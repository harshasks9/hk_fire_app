/* Offline support for /turkey: the page, its icon, the drag library, fonts and place photos. */
const CACHE = 'turkey-trip-v1';
const SHELL = ['/turkey/index.html', '/turkey/icon.svg', '/turkey/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // The page itself: network first, so updates arrive; the cached copy when offline.
  if (req.mode === 'navigate' && url.pathname.startsWith('/turkey/')) {
    e.respondWith(fetch(req).then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('/turkey/index.html', copy)); return r; }).catch(() => caches.match('/turkey/index.html')));
    return;
  }
  // Library, fonts, photos and Wikipedia lookups: cache first.
  const cacheable = url.origin === location.origin && url.pathname.startsWith('/turkey/')
    || /(^|\.)cdnjs\.cloudflare\.com$|fonts\.(googleapis|gstatic)\.com$|upload\.wikimedia\.org$|en\.wikipedia\.org$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return r; })));
});
