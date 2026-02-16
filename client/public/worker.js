console.log('Service Worker Loaded...');

self.addEventListener('push', e => {
  const data = e.data.json();
  console.log('Push Recieved...');
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/logo192.png', // Assure-toi d'avoir une icone ici ou utilise l'icone par défaut
    data: { url: data.url } // On stocke l'URL pour le clic
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});