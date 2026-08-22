const CACHE_NAME = 'portal-vision-pwa-v68';

const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icon-192-v2.png',
  './icon-512-v2.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Só fazemos cache da casca da PWA.
  // O Portal do Apps Script continua online e dinâmico.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});


self.addEventListener('push', event => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch (_) {
    data = { title: 'Portal Vision', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Portal Vision',
      {
        body: data.body || '',
        icon: data.icon || './icon-192-v2.png',
        badge: data.badge || './icon-192-v2.png',
        tag: data.tag || ('portal-' + Date.now()),
        data: {
          url: data.url || './'
        }
      }
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const targetUrl =
    (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clients => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          return client;
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

