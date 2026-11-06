// Cache v2 : réseau d'abord pour les pages (toujours la dernière version), cache en secours
const CACHE = 'mpc-v2';
const ASSETS = ['./', './index.html', './inscription.html', './boite.html', './chat.html', './admin.html', './icon-192.png', './icon-512.png', './mail-pro-icon.svg', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return; // laisse passer Supabase/CDN

  // Pages HTML : réseau d'abord → on a toujours la dernière version
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; })
        .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
    return;
  }
  // Autres fichiers (icônes…) : cache d'abord
  e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
