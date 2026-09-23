// ARK Iowa admin service worker — push notifications only.
//
// Deliberately no caching or offline handling: the admin is live data, and a
// stale cached dashboard would be worse than a slow one.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data && event.data.text() };
  }
  const title = data.title || 'ARK Iowa';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: '/iowa/icons/admin-192.png',
      badge: '/iowa/icons/admin-192.png',
      tag: data.tag || undefined,
      data: { url: data.url || '/iowa/admin' },
    })
  );
});

// Tapping it: focus the app if it's already open, otherwise open it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/iowa/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/iowa/admin') && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
