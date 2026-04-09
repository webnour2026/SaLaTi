const CACHE = 'salati-v3';
const RUNTIME_CACHE = 'salati-rt-v3';
const BASE = '/SaLaTi';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll([
        BASE + '/',
        BASE + '/index.html',
        BASE + '/manifest.json',
        BASE + '/icon-192.png',
        BASE + '/icon-512.png'
      ])
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE && k !== RUNTIME_CACHE) return caches.delete(k);
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);

  if (u.hostname === 'api.aladhan.com') {
    e.respondWith(
      fetch(e.request)
        .then(r => {
          caches.open(RUNTIME_CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  if (u.hostname === 'nominatim.openstreetmap.org') {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  if (
    u.pathname.endsWith('.mp3') ||
    u.hostname.includes('googleapis') ||
    u.hostname.includes('gstatic')
  ) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached ||
        fetch(e.request).then(r => {
          caches.open(RUNTIME_CACHE).then(c => c.put(e.request, r.clone()));
          return r;
        })
      )
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request).catch(() => caches.match(BASE + '/index.html'))
    )
  );
});
