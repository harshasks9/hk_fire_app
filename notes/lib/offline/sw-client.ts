'use client'
/* Service worker registration and the messages that keep its caches warm. */

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    // Pick up a new worker as soon as it is installed.
    reg.addEventListener('updatefound', () => {
      const w = reg.installing
      w?.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) w.postMessage({ type: 'skip-waiting' }) })
    })
    return reg
  } catch {
    return null
  }
}

/** Ask the worker to (re)cache the offline notepad and every static asset this page has loaded. */
export function warmCaches() {
  try {
    const sw = navigator.serviceWorker?.controller
    if (!sw || !navigator.onLine) return
    const urls = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => n.startsWith(location.origin + '/_next/static/'))
    sw.postMessage({ type: 'cache-urls', urls })
    sw.postMessage({ type: 'precache' })
  } catch {
    /* ignore */
  }
}
