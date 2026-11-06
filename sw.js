// Cache v3 : pages en réseau d'abord, bibliothèques externes (Tailwind, Supabase, polices) gardées en cache pour un démarrage rapide
const CACHE = 'mpc-v3';
const LOCAL = ['./','./index.html','./inscription.html','./boite.html','./chat.html','./admin.html','./icon-192.png','./icon-512.png','./mail-pro-icon.svg','./manifest.webmanifest'];
const CDN_HOSTS = ['cdn.tailwindcss.com','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(LOCAL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Appels Supabase : toujours le réseau, jamais de cache
  if (url.hostname.endsWith('supabase.co')) return;

  // Bibliothèques externes (Tailwind, Supabase JS, polices) : cache d'abord, puis réseau
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res;
    })));
    return;
  }

  if (url.origin !== location.origin) return;

  // Pages HTML : réseau d'abord (toujours la dernière version), cache en secours
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(fetch(req).then((res) => { const c = res.clone(); caches.open(CACHE).then((x) => x.put(req, c)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./index.html'))));
    return;
  }
  // Autres fichiers locaux : cache d'abord
  e.respondWith(caches.match(req).then((cached) => cached || fetch(req)));
});
