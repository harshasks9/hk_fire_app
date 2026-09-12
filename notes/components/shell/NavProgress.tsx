'use client'
import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { setShell, useShell } from './store'

/**
 * A thin bar under the top edge that starts the instant a navigation begins
 * (any in-app link, or code that calls startNavigation()) and finishes when
 * the new route has rendered. It is the difference between "did my click
 * register?" and a UI that feels alive while the server works.
 */
export function startNavigation() {
  setShell({ navPending: true })
}

export function NavProgress() {
  const { navPending } = useShell()
  const pathname = usePathname()
  const search = useSearchParams()
  const [progress, setProgress] = React.useState(0)
  const [visible, setVisible] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const startedAt = React.useRef(0)

  // Any click on an internal link starts the bar (capture phase, before Next handles it).
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      if (url.pathname.startsWith('/api/')) return
      setShell({ navPending: true })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  // Start: ramp quickly to ~80% then creep. Finish: jump to 100% and fade.
  React.useEffect(() => {
    if (!navPending) return
    startedAt.current = Date.now()
    setVisible(true)
    setProgress(12)
    timer.current = setInterval(() => setProgress((p) => (p < 80 ? p + (80 - p) * 0.18 : p < 95 ? p + 0.4 : p)), 120)
    // Safety: never hang the bar (e.g. a click that did not navigate).
    const safety = setTimeout(() => setShell({ navPending: false }), 12000)
    return () => { if (timer.current) clearInterval(timer.current); clearTimeout(safety) }
  }, [navPending])

  // The route changed → finish.
  const route = `${pathname}?${search?.toString() ?? ''}`
  const lastRoute = React.useRef(route)
  React.useEffect(() => {
    if (route === lastRoute.current) return
    lastRoute.current = route
    if (navPending) setShell({ navPending: false })
    setProgress(100)
    const t = setTimeout(() => { setVisible(false); setProgress(0) }, 260)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route])
  React.useEffect(() => {
    if (navPending || !visible) return
    setProgress(100)
    const t = setTimeout(() => { setVisible(false); setProgress(0) }, 260)
    return () => clearTimeout(t)
  }, [navPending, visible])

  if (!visible) return null
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[120] h-[2.5px]" aria-hidden>
      <div className="h-full bg-accent shadow-[0_0_8px_var(--accent)] transition-[width,opacity] duration-200 ease-out" style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }} />
    </div>
  )
}
