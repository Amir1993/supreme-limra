// Supreme Limra Society — Service Worker v3
// Strategy: Network-first for HTML (always fresh), Cache-first for assets

const CACHE = 'slimra-v3';
const ALWAYS_FRESH = ['/', '/index.html', './index.html'];

// Install: cache static assets only (NOT index.html)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled([
        cache.add('./manifest.json').catch(()=>{}),
        cache.add('./icon.svg').catch(()=>{}),
        cache.add('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').catch(()=>{}),
        cache.add('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').catch(()=>{}),
      ]);
    })
  );
  // Take control immediately — don't wait for old SW to die
  self.skipWaiting();
});

// Activate: delete ALL old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        console.log('[SW] Deleting old cache:', k);
        return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' ||
                 url.pathname.endsWith('.html') ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('/supreme-limra/');

  if (isHTML) {
    // ── NETWORK FIRST for HTML — always get fresh app ──────────────────
    e.respondWith(
      fetch(e.request, {cache: 'no-store'})
        .then(response => {
          // Success: return fresh response (don't cache HTML)
          return response;
        })
        .catch(() => {
          // Offline fallback: serve cached version if available
          return caches.match('./index.html');
        })
    );
  } else {
    // ── CACHE FIRST for assets (JS libs, icons, fonts) ─────────────────
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE).then(cache => cache.put(e.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
  }
});
