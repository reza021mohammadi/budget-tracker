const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const messaging = admin.messaging();

const fmt = n => '€' + Number(n).toFixed(2);

function parseDMY(s) {
  if (!s || s === 'ongoing' || s.includes(' ') || s.includes('&')) return null;
  const p = s.split(/[./]/);
  if (p.length !== 3) return null;
  return new Date(+p[2], +p[1] - 1, +p[0]);
}

function isActiveOn(p, date) {
  if (p.onetime) return false;
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const s = parseDMY(p.startDate);
  if (s && s > monthEnd) return false;
  const e = parseDMY(p.endDate);
  return !e || e >= monthStart;
}

async function main() {
  const TEST_MODE = process.env.TEST_MODE === 'true';
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.getDate();

  const households = await db.collection('households').listDocuments();
  let totalSent = 0;

  for (const hdoc of households) {
    const dataSnap = await hdoc.collection('data').doc('main').get();
    if (!dataSnap.exists) continue;
    const data = dataSnap.data();

    const due = (data.payments || []).filter(p =>
      !p.onetime && p.day === tomorrowDay && isActiveOn(p, tomorrow)
    );
    if (!TEST_MODE && due.length === 0) continue;

    const tokensSnap = await hdoc.collection('pushTokens').get();
    const tokens = tokensSnap.docs.map(d => d.id);
    if (tokens.length === 0) continue;

    let title, body;
    if (TEST_MODE) {
      title = '✅ Test push from your budget app';
      body = `If you see this, background notifications are working. (${tokens.length} device${tokens.length===1?'':'s'} registered)`;
    } else {
      const total = due.reduce((s, p) => s + p.amount, 0);
      const list = due.slice(0, 3).map(p => `${p.name} ${fmt(p.amount)}`).join(', ');
      title = '💶 Payments due tomorrow';
      body = `${list}${due.length > 3 ? ` +${due.length - 3} more` : ''} — Total ${fmt(total)}`;
    }

    try {
      const res = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body }
      });
      console.log(`${hdoc.id}: sent ${res.successCount}/${tokens.length}`);
      totalSent += res.successCount;

      // Inspect failures and clean up stale tokens
      for (let i = 0; i < res.responses.length; i++) {
        const r = res.responses[i];
        if (!r.success) {
          const code = r.error && r.error.code ? r.error.code : 'unknown';
          const msg = r.error && r.error.message ? r.error.message : '';
          console.log(`  token ${tokens[i].slice(0, 20)}… FAILED [${code}] ${msg}`);
          if (code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/invalid-argument') {
            await hdoc.collection('pushTokens').doc(tokens[i]).delete();
            console.log(`    -> removed`);
          }
        }
      }
    } catch (e) {
      console.error(`${hdoc.id} failed:`, e.message);
    }
  }

  console.log(`Total notifications sent: ${totalSent}`);
}

main().catch(e => { console.error(e); process.exit(1); });
