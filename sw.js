const CACHE = 'salati-v4';
const RUNTIME_CACHE = 'salati-runtime-v4';
const BASE = './';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([
        BASE,
        BASE + 'index.html',
        BASE + 'manifest.json',
        BASE + 'icon-192.png',
        BASE + 'icon-512.png'
      ])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match(BASE + 'index.html'))
    );
    return;
  }

  if (url.hostname === 'api.aladhan.com') {
    e.respondWith(
      fetch(req)
        .then(r => {
          caches.open(RUNTIME_CACHE).then(c => c.put(req, r.clone()));
          return r;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  if (url.hostname === 'nominatim.openstreetmap.org') {
    e.respondWith(
      fetch(req).catch(() =>
        new Response('{}', {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  if (
    url.pathname.endsWith('.mp3') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('gstatic')
  ) {
    e.respondWith(
      caches.match(req).then(cached =>
        cached ||
        fetch(req).then(r => {
          caches.open(RUNTIME_CACHE).then(c => c.put(req, r.clone()));
          return r;
        })
      )
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
