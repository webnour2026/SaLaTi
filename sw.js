const CACHE='salati-v3',BASE='./SaLaTi';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll([BASE+'/',BASE+'./index.html',BASE+'./manifest.json',BASE+'./icon-192.png',BASE+'./icon-512.png'])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.hostname==='api.aladhan.com'){
    e.respondWith(fetch(e.request).then(r=>{caches.open(CACHE+'rt').then(c=>c.put(e.request,r.clone()));return r;}).catch(()=>caches.match(e.request)));return;
  }
  if(u.hostname==='nominatim.openstreetmap.org'){
    e.respondWith(fetch(e.request).catch(()=>new Response('{}',{headers:{'Content-Type':'application/json'}})));return;
  }
  if(u.pathname.endsWith('.mp3')||u.hostname.includes('googleapis')||u.hostname.includes('gstatic')){
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).then(r=>{caches.open(CACHE+'rt').then(x=>x.put(e.request,r.clone()));return r;})));return;
  }
  e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request).catch(()=>caches.match(BASE+'./index.html'))));
});
self.addEventListener('push',e=>{
  const d=e.data?e.data.json():{};
  e.waitUntil(self.registration.showNotification(d.title||'🕌 Prayer Time',{body:d.body||'حي على الصلاة',icon:BASE+'/icon-192.png',vibrate:[300,150,300,150,600],requireInteraction:true}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window'}).then(l=>{for(const c of l)if('focus'in c)return c.focus();if(clients.openWindow)return clients.openWindow(BASE+'/');}));
});
