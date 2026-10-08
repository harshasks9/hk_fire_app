/*
  Notes service worker.
  - Static assets (/_next/static, icons, manifest): cache-first, they are content-hashed.
  - Page navigations: network-first; the response is cached so pages you have
    opened stay readable offline. When nothing is cached the offline notepad is served.
  - GET API calls: network-first with the last good response as fallback.
  - Writes (POST/PATCH/DELETE) are never intercepted: the app queues them in
    IndexedDB and replays them (see lib/offline/sync.ts). A Background Sync
    event just wakes the app up to do that.
*/
const VERSION = 'hkn-v4'
const STATIC = VERSION + '-static'
const PAGES = VERSION + '-pages'
const API = VERSION + '-api'
const OFFLINE_URL = '/offline'
const STATIC_PRECACHE = ['/manifest.json', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/maskable-512.png']
const MAX_PAGES = 120

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    await precache()
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((k) => k.startsWith('hkn-') && !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('message', (event) => {
  const data = event.data || {}
  if (data.type === 'skip-waiting') self.skipWaiting()
  if (data.type === 'precache') event.waitUntil(precache())
  if (data.type === 'cache-urls' && Array.isArray(data.urls)) event.waitUntil(cacheUrls(data.urls))
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'hkn-outbox') event.waitUntil(notifyClients({ type: 'sync' }))
})

async function notifyClients(msg) {
  const all = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
  for (const c of all) c.postMessage(msg)
}

async function precache() {
  const stat = await caches.open(STATIC)
  await Promise.all(STATIC_PRECACHE.map(async (u) => { try { const r = await fetch(u, { cache: 'no-cache' }); if (r.ok) await stat.put(u, r) } catch (e) { /* offline */ } }))
  await cachePageWithAssets(OFFLINE_URL)
}

async function cacheUrls(urls) {
  const stat = await caches.open(STATIC)
  await Promise.all(urls.map(async (u) => {
    try {
      if (await stat.match(u)) return
      const r = await fetch(u)
      if (r.ok) await stat.put(u, r)
    } catch (e) { /* ignore */ }
  }))
}

/* Fetch a page and every /_next/static asset it references so it renders fully offline. */
async function cachePageWithAssets(path) {
  try {
    const res = await fetch(path, { credentials: 'same-origin', headers: { Accept: 'text/html' }, cache: 'no-cache' })
    if (!res.ok || res.redirected || !(res.headers.get('content-type') || '').includes('text/html')) return false
    const html = await res.clone().text()
    const pages = await caches.open(PAGES)
    await pages.put(path, res)
    const assets = new Set()
    for (const m of html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+)"/g)) assets.add(m[1].replace(/&amp;/g, '&'))
    await cacheUrls([...assets])
    return true
  } catch (e) {
    return false
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return
  const p = url.pathname
  if (p.startsWith('/_next/static/') || p.startsWith('/icons/') || p === '/icon.svg' || p === '/manifest.json' || p === '/favicon.ico') {
    event.respondWith(cacheFirst(req))
    return
  }
  if (p.startsWith('/_next/')) return
  // React Server Component payloads for client-side navigations are not cached: when one
  // fails the router falls back to a full navigation, which is served from the page cache below.
  if (req.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) return
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(pageStrategy(req, url))
    return
  }
  if (p.startsWith('/api/')) {
    event.respondWith(networkFirst(req, API, () => new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json', 'x-hkn-offline': '1' } })))
    return
  }
  event.respondWith(networkFirst(req, STATIC, () => new Response('', { status: 503, headers: { 'x-hkn-offline': '1' } })))
})

async function cacheFirst(req) {
  const cache = await caches.open(STATIC)
  const hit = await cache.match(req)
  if (hit) return hit
  try {
    const res = await fetch(req)
    if (res.ok) cache.put(req, res.clone())
    return res
  } catch (e) {
    return new Response('', { status: 503, headers: { 'x-hkn-offline': '1' } })
  }
}

async function networkFirst(req, cacheName, fallback) {
  const cache = await caches.open(cacheName)
  try {
    const res = await fetch(req)
    if (res.ok && res.status === 200 && !res.redirected) cache.put(req, res.clone())
    return res
  } catch (e) {
    const hit = await cache.match(req)
    return hit || fallback()
  }
}

async function pageStrategy(req, url) {
  const cache = await caches.open(PAGES)
  const key = url.pathname + url.search
  const offlineNow = self.navigator && self.navigator.onLine === false
  if (!offlineNow) {
    try {
      const res = await fetch(req)
      if (res.ok && res.status === 200 && !res.redirected && (res.headers.get('content-type') || '').includes('text/html')) {
        cache.put(key, res.clone())
        trimPages(cache)
      }
      return res
    } catch (e) { /* fall through to cache */ }
  }
  const hit = (await cache.match(key)) || (await cache.match(url.pathname))
  if (hit) return hit
  const offline = await cache.match(OFFLINE_URL)
  if (offline) return offline
  return new Response(fallbackHtml(), { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'x-hkn-offline': '1' } })
}

async function trimPages(cache) {
  try {
    const keys = await cache.keys()
    if (keys.length <= MAX_PAGES) return
    for (const k of keys.slice(0, keys.length - MAX_PAGES)) if (!k.url.endsWith(OFFLINE_URL)) await cache.delete(k)
  } catch (e) { /* ignore */ }
}

function fallbackHtml() {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline · Notes</title><style>body{font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100dvh;background:#fafaf9;color:#1c1c1e}main{text-align:center;padding:24px;max-width:420px}h1{font-size:20px;margin:0 0 8px}p{color:#666;font-size:15px;line-height:1.5}a{display:inline-block;margin-top:16px;padding:10px 16px;border-radius:10px;background:#5b5bd6;color:#fff;text-decoration:none;font-weight:500}@media(prefers-color-scheme:dark){body{background:#0e0e10;color:#f2f2f2}p{color:#aaa}}</style></head><body><main><h1>You are offline</h1><p>This page has not been opened on this device yet. Open the app once while online and it will be available offline.</p><a href="/">Try again</a></main></body></html>'
}
