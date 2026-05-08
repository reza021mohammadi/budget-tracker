// Service worker for Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDNJdUV63copftWu0MdwUgFFGJSRV-sjuY",
  authDomain: "budget-tracker-4c83c.firebaseapp.com",
  projectId: "budget-tracker-4c83c",
  storageBucket: "budget-tracker-4c83c.firebasestorage.app",
  messagingSenderId: "130617560083",
  appId: "1:130617560083:web:369e10ed924b2671c043e6"
});

const messaging = firebase.messaging();

// iOS Safari does NOT auto-display from the FCM notification payload —
// the service worker has to show it explicitly here. Combined with the
// legacy in-app scheduleNotifications path being disabled, this gives
// exactly one banner per push.
messaging.onBackgroundMessage((payload) => {
  // Server sends data-only payloads to avoid the FCM SDK's auto-display.
  // We render the notification ourselves so there's exactly one banner.
  const { title, body } = payload.data || payload.notification || {};
  self.registration.showNotification(title || '💶 Budget', {
    body: body || '',
    icon: './icon.png',
    badge: './icon.png'
  });
});
