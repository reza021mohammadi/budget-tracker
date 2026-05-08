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

// We rely on the FCM SDK's default behavior: when payload contains a
// webpush.notification field, the SDK calls self.registration.showNotification
// automatically. Defining onBackgroundMessage here would cause it to fire
// again, producing duplicate banners. We just need messaging() to be
// initialized so the SW can receive the push.
firebase.messaging();
