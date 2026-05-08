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

// Do NOT call self.registration.showNotification() here when the FCM payload
// already contains a `notification` field — iOS/Safari auto-display the
// system notification, and showing one ourselves would produce duplicates.
// The system handles delivery directly from the `notification` payload.
