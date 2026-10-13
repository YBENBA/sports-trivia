// Service worker: the whole game is cached on first visit and works offline afterwards.
const CACHE = 'sta-5.6-2f5382fd83';
const ASSETS = ["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png","apple-touch-icon.png"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('sta-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // Only the game page itself maps to the cached index.html; other pages on the site (e.g. the iPhone checklist) load normally.
  const isApp = req.mode === 'navigate' && /\/(index\.html)?$/.test(url.pathname);
  if (req.mode === 'navigate' && !isApp) return;
  // Cache first (instant + offline); the page itself is refreshed in the background for the next visit.
  e.respondWith(caches.open(CACHE).then(async c => {
    const key = isApp ? 'index.html' : req;
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r.ok && isApp) c.put('index.html', r.clone()); return r; }).catch(() => null);
    return hit || (await net) || Response.error();
  }));
});
