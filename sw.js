// Supreme Limra Society — Service Worker v5
const CACHE = 'slimra-v5';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Always network-first — never serve cached HTML
  if(e.request.destination === 'document' || 
     e.request.url.endsWith('.html') ||
     e.request.url.endsWith('/')) {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).catch(() => 
        caches.match(e.request)
      )
    );
  } else {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
  }
});
