// Importamos los scripts de Firebase especiales para el Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// 🚀 Inicializamos Firebase en segundo plano con tus llaves
firebase.initializeApp({
  apiKey: "AIzaSyB4Z6W1VQAgzFTxUGtxhWNO485SwpQqiXg",
  authDomain: "prevdengue-6e6b7.firebaseapp.com",
  projectId: "prevdengue-6e6b7",
  storageBucket: "prevdengue-6e6b7.firebasestorage.app",
  messagingSenderId: "1057934990386",
  appId: "1:1057934990386:web:247165f999b0e28869302b"
});

const messaging = firebase.messaging();

// Aquí es donde el celular "escucha" los mensajes cuando la app está en segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensaje recibido en segundo plano:', payload);
  const notificationTitle = payload.notification.title || "Alerta PrevDengue";
  
  const notificationOptions = {
    body: payload.notification.body || "Tienes un nuevo mensaje",
    icon: '/favicon.ico',
    vibrate: [200, 100, 200], // 🔥 Hace vibrar el celular (Android)
    requireInteraction: true  // 🔥 Obliga a Windows/Edge a mantener la notificación en pantalla
  };
  
  return self.registration.showNotification(notificationTitle, notificationOptions);
});
