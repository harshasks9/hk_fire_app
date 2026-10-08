'use client'
import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { flushOutbox, refreshPending, setOnline, setActiveContextId, recordRecentPage } from '@/lib/offline/sync'
import { registerServiceWorker, warmCaches } from '@/lib/offline/sw-client'

/**
  Keeps the offline machinery alive for the whole app: registers the service
  worker, tracks connectivity, replays the outbox whenever there is a chance of
  success (coming online, tab becoming visible, a Background Sync wake-up, a
  timer) and remembers which pages were opened so they can be listed offline.
*/
export function OfflineProvider({ contextId, children }: { contextId?: string; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => { setActiveContextId(contextId) }, [contextId])

  React.useEffect(() => {
    let alive = true
    setOnline(navigator.onLine)
    void refreshPending()
    registerServiceWorker().then(() => { if (alive) setTimeout(warmCaches, 1500) })
    void flushOutbox()

    const onOnline = () => { setOnline(true); void flushOutbox(); warmCaches() }
    const onOffline = () => setOnline(false)
    const onVisible = () => { if (document.visibilityState === 'visible') { setOnline(navigator.onLine); void flushOutbox() } }
    const onMessage = (e: MessageEvent) => { if (e.data?.type === 'sync') void flushOutbox() }
    const onSynced = () => router.refresh()
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    document.addEventListener('visibilitychange', onVisible)
    navigator.serviceWorker?.addEventListener('message', onMessage)
    window.addEventListener('hkn:synced', onSynced)
    const timer = window.setInterval(() => { if (navigator.onLine) void flushOutbox() }, 45_000)
    return () => {
      alive = false
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      document.removeEventListener('visibilitychange', onVisible)
      navigator.serviceWorker?.removeEventListener('message', onMessage)
      window.removeEventListener('hkn:synced', onSynced)
      window.clearInterval(timer)
    }
  }, [router])

  // Remember opened pages (title + path) so the offline notepad can list what is readable offline.
  React.useEffect(() => {
    if (!pathname || pathname === '/offline' || pathname === '/login') return
    const t = window.setTimeout(() => {
      recordRecentPage(pathname, document.title)
      warmCaches()
    }, 800)
    return () => window.clearTimeout(t)
  }, [pathname])

  return <>{children}</>
}
