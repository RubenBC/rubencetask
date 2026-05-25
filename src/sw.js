import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'RubenceTask', {
      body: data.body || '',
      icon: '/rubencetask/icons/icon-192.png',
      badge: '/rubencetask/icons/icon-72.png',
      vibrate: [200, 100, 200],
      tag: data.noteId || 'default',
      renotify: true,
      data: { noteId: data.noteId },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = '/rubencetask/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/rubencetask') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});