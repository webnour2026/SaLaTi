// ════════════════════════════════════════
// SERVICE WORKER — SaLaTi PWA
// GitHub Pages: https://webnour2026.github.io/SaLaTi/
// ════════════════════════════════════════
const CACHE = 'salati-v1';
const RUNTIME = 'salati-rt-v1';
const BASE = '/SaLaTi';

const PRECACHE = [
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/adhan-moroccan.mp3',
  BASE + '/adhan-moroccan2.mp3',
  BASE + '/icon-192.png',
  BASE + '/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Prayer API → network first, cache fallback
  if (url.hostname === 'api.aladhan.com') {
    e.respondWith(
      fetch(e.request)
        .then(r => { caches.open(RUNTIME).then(c => c.put(e.request, r.clone())); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Nominatim → network only
  if (url.hostname === 'nominatim.openstreetmap.org') {
    e.respondWith(fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // MP3 → cache first
  if (url.pathname.endsWith('.mp3')) {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(r => {
        caches.open(RUNTIME).then(cache => cache.put(e.request, r.clone()));
        return r;
      }))
    );
    return;
  }

  // Fonts → cache first
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then(c => c || fetch(e.request).then(r => {
        caches.open(RUNTIME).then(cache => cache.put(e.request, r.clone()));
        return r;
      }))
    );
    return;
  }

  // App shell → cache first, fallback to index
  e.respondWith(
    caches.match(e.request)
      .then(c => c || fetch(e.request).catch(() => caches.match(BASE + '/index.html')))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const d = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(d.title || '🕌 Prayer Time', {
      body: d.body || 'Hayya ala salah — حي على الصلاة',
      icon: BASE + '/icon-192.png',
      badge: BASE + '/icon-192.png',
      vibrate: [300, 150, 300, 150, 600],
      requireInteraction: true,
      silent: false,
      actions: [
        { action: 'open', title: '🕌 Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action !== 'dismiss') {
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(list => {
        for (const c of list) {
          if (c.url.includes('SaLaTi') && 'focus' in c) return c.focus();
        }
        if (clients.openWindow) return clients.openWindow(BASE + '/index.html');
      })
    );
  }
});
