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
  if (e && e < monthStart) return false;
  // Frequency check
  const freq = p.frequency || 'monthly';
  if (freq === 'monthly') return true;
  if (!s) return true;
  const monthsSinceStart = (date.getFullYear() - s.getFullYear()) * 12 + (date.getMonth() - s.getMonth());
  if (monthsSinceStart < 0) return false;
  const interval = freq === 'yearly' ? 12 : freq === 'quarterly' ? 3 : freq === 'bimonthly' ? 2 : 1;
  return monthsSinceStart % interval === 0;
}

const PREF_DEFAULTS = {
  paymentDueTomorrow: true,
  paydayTomorrow: true,
  paymentEnded: true,
  bufferLow: false,
  weeklyRecap: false,
};
const prefOn = (prefs, key) => prefs && prefs[key] !== undefined ? !!prefs[key] : !!PREF_DEFAULTS[key];

function deviceKey(ua) {
  if (!ua) return '';
  const m = ua.match(/^[^)]+\)/);
  return m ? m[0] : ua;
}

async function getActiveTokens(hdoc) {
  const tokensSnap = await hdoc.collection('pushTokens').get();
  const groups = new Map();
  for (const d of tokensSnap.docs) {
    const data = d.data() || {};
    const key = deviceKey(data.ua || '');
    const existing = groups.get(key);
    if (!existing || (data.createdAt || '') > (existing.data.createdAt || '')) {
      groups.set(key, { id: d.id, data });
    }
  }
  const keep = new Set([...groups.values()].map(g => g.id));
  for (const d of tokensSnap.docs) {
    if (!keep.has(d.id)) {
      await hdoc.collection('pushTokens').doc(d.id).delete();
      console.log(`${hdoc.id}: removed duplicate token ${d.id.slice(0, 20)}…`);
    }
  }
  return [...keep];
}

async function sendPush(hdoc, tokens, title, body) {
  if (!tokens.length) return 0;
  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      data: { title: String(title), body: String(body) },
      webpush: { notification: { title: String(title), body: String(body) } }
    });
    console.log(`${hdoc.id}: "${title}" sent ${res.successCount}/${tokens.length}`);
    for (let i = 0; i < res.responses.length; i++) {
      const r = res.responses[i];
      if (!r.success) {
        const code = r.error && r.error.code ? r.error.code : 'unknown';
        if (code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/invalid-argument') {
          await hdoc.collection('pushTokens').doc(tokens[i]).delete();
        }
      }
    }
    return res.successCount;
  } catch (e) {
    console.error(`${hdoc.id} send failed:`, e.message);
    return 0;
  }
}

async function main() {
  const TEST_MODE = process.env.TEST_MODE === 'true';
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const tomorrowDay = tomorrow.getDate();
  const isMonday = now.getUTCDay() === 1;

  const households = await db.collection('households').listDocuments();
  let totalSent = 0;

  for (const hdoc of households) {
    const dataSnap = await hdoc.collection('data').doc('main').get();
    if (!dataSnap.exists) continue;
    const data = dataSnap.data();
    const prefs = data.notifPrefs || {};
    const tokens = await getActiveTokens(hdoc);
    if (!tokens.length) continue;

    if (TEST_MODE) {
      totalSent += await sendPush(hdoc, tokens,
        '✅ Test push from your budget app',
        `If you see this, background notifications are working. (${tokens.length} device${tokens.length===1?'':'s'})`);
      continue;
    }

    // 1. Payments due tomorrow
    if (prefOn(prefs, 'paymentDueTomorrow')) {
      const due = (data.payments || []).filter(p =>
        !p.onetime && p.day === tomorrowDay && isActiveOn(p, tomorrow)
      );
      // Also include one-time payments scheduled for tomorrow
      const dueOnetime = (data.payments || []).filter(p => {
        if (!p.onetime) return false;
        const d = parseDMY(p.endDate);
        return d && d.toDateString() === tomorrow.toDateString();
      });
      const all = due.concat(dueOnetime);
      if (all.length) {
        const total = all.reduce((s, p) => s + p.amount, 0);
        const list = all.slice(0, 3).map(p => `${p.name} ${fmt(p.amount)}`).join(', ');
        const body = `${list}${all.length > 3 ? ` +${all.length - 3} more` : ''} — Total ${fmt(total)}`;
        totalSent += await sendPush(hdoc, tokens, '💶 Payments due tomorrow', body);
      }
    }

    // 2. Payday tomorrow
    if (prefOn(prefs, 'paydayTomorrow')) {
      const payday = data.payday || 25;
      if (tomorrow.getDate() === payday) {
        totalSent += await sendPush(hdoc, tokens,
          '💰 Payday tomorrow',
          `Your salary lands on day ${payday}.`);
      }
    }

    // 3. Installment paid off (an installment whose endDate was yesterday)
    if (prefOn(prefs, 'paymentEnded')) {
      const ended = (data.payments || []).filter(p => {
        if (p.onetime) return false;
        const e = parseDMY(p.endDate);
        return e && e.toDateString() === yesterday.toDateString();
      });
      if (ended.length) {
        const freed = ended.reduce((s, p) => s + p.amount, 0);
        const names = ended.map(p => p.name).join(', ');
        totalSent += await sendPush(hdoc, tokens,
          '🎉 Installment paid off',
          `${names} ended yesterday — ${fmt(freed)}/mo freed up.`);
      }
    }

    // 4. Buffer alert (planned remaining below threshold)
    if (prefOn(prefs, 'bufferLow') && data.bufferAmt > 0) {
      const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const b = (data.monthlyBudgets && data.monthlyBudgets[key]) || data;
      const ni = b.netIncome || 0;
      const fixedActive = (data.payments || []).filter(p => isActiveOn(p, now)).reduce((s,p)=>s+p.amount,0);
      const onetimeThis = (data.payments || []).filter(p => {
        if (!p.onetime) return false;
        const d = parseDMY(p.endDate);
        return d && d.getFullYear()===now.getFullYear() && d.getMonth()===now.getMonth();
      }).reduce((s,p)=>s+p.amount,0);
      const variable = (b.grocery||0)+(b.recreation||0)+(b.clothes||0)+(b.restaurant||0)+(b.other2||0);
      const remaining = ni - (fixedActive + onetimeThis + variable);
      if (remaining < data.bufferAmt) {
        totalSent += await sendPush(hdoc, tokens,
          '⚠️ Low buffer warning',
          `Remaining ${fmt(remaining)} is below your buffer of ${fmt(data.bufferAmt)}.`);
      }
    }

    // 5. Weekly recap on Mondays
    if (prefOn(prefs, 'weeklyRecap') && isMonday) {
      const next7 = (data.payments || []).filter(p => {
        if (p.onetime) {
          const d = parseDMY(p.endDate);
          if (!d) return false;
          const diff = Math.ceil((d - now) / 864e5);
          return diff >= 0 && diff <= 7;
        }
        if (!isActiveOn(p, now)) return false;
        const next = new Date(now.getFullYear(), now.getMonth(), p.day);
        if (next < now) next.setMonth(next.getMonth()+1);
        const diff = Math.ceil((next - now) / 864e5);
        return diff >= 0 && diff <= 7;
      });
      const total = next7.reduce((s,p)=>s+p.amount,0);
      totalSent += await sendPush(hdoc, tokens,
        '📊 Week ahead',
        `${next7.length} payment${next7.length===1?'':'s'} totaling ${fmt(total)} due in the next 7 days.`);
    }
  }

  console.log(`Total notifications sent: ${totalSent}`);
}

main().catch(e => { console.error(e); process.exit(1); });
