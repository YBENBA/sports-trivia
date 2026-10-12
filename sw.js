// Service worker: the whole game is cached on first visit and works offline afterwards.
const CACHE = 'sta-5.3-1f23c1d63a';
const ASSETS = ["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sta-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  // Cache first (instant + offline); the page itself is refreshed in the background for the next visit.
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = req.mode === 'navigate' ? 'index.html' : req;
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok && req.mode === 'navigate') c.put('index.html', r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  }));
});
