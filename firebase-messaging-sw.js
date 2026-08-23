importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC60355aPCR1Ji6MRlyOXuYCEbjYTjZ9n0",
  authDomain: "al-mustaqbal-stor.firebaseapp.com",
  projectId: "al-mustaqbal-stor",
  storageBucket: "al-mustaqbal-stor.firebasestorage.app",
  messagingSenderId: "96965787019",
  appId: "1:96965787019:web:4531931ae87c4b317e438e",
  measurementId: "G-0JTB3KDKV4"
});

const messaging = firebase.messaging();

// استقبال رسائل FCM عندما يكون الموقع في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Background message:',
    payload
  );

  const notification = payload.notification || {};
  const data = payload.data || {};

  const title =
    notification.title ||
    data.title ||
    'متجر المستقبل';

  const body =
    notification.body ||
    data.body ||
    '';

  const options = {
    body: body,

    icon:
      notification.icon ||
      data.icon ||
      '/almstaq/icon-192.png',

    badge:
      notification.badge ||
      data.badge ||
      '/almstaq/icon-192.png',

    data: data,

    tag:
      data.notificationId ||
      data.invoiceId ||
      'mustaqbal-notification',

    renotify: true
  };

  return self.registration.showNotification(
    title,
    options
  );
});


// عند الضغط على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl =
    event.notification &&
    event.notification.data &&
    event.notification.data.url
      ? event.notification.data.url
      : 'https://alidelll626-sudo.github.io/almstaq/';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {

      for (const client of clientList) {

        try {

          const clientUrl = new URL(client.url);
          const target = new URL(targetUrl);

          if (
