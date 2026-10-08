'use client'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { PanelRightClose, Sparkles } from 'lucide-react'
import { setShell, useShell } from './store'
import { cx } from '@/lib/util'

/** Pages render <Panel> to fill the right intelligence panel. */
export function Panel({ children, title = 'Intelligence' }: { children: React.ReactNode; title?: string }) {
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  React.useEffect(() => {
    setHost(document.getElementById('intel-panel'))
    setShell({ panelAvailable: true })
    return () => setShell({ panelAvailable: false })
  }, [])
  if (!host) return null
  return createPortal(
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-2 xl:hidden" aria-hidden />
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-fg-2">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {title}
        </div>
        <button className="rounded-md p-2 text-fg-3 hover:bg-surface-2 hover:text-fg xl:p-1" onClick={() => setShell({ panelOpen: false, panelSheet: false })} title="Close panel (⌘.)" aria-label="Close panel">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(16px+env(safe-area-inset-bottom))] xl:pb-4">{children}</div>
    </div>,
    host,
  )
}

/**
  Hosts the intelligence panel: a docked right column on wide screens, a
  swipe-away bottom sheet everywhere else (opened from the ✦ button in the
  mobile top bar).
*/
export function PanelHost() {
  const { panelOpen, panelAvailable, panelSheet } = useShell()
  const visible = panelOpen && panelAvailable
  const sheet = panelSheet && panelAvailable
  React.useEffect(() => {
    if (!sheet) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setShell({ panelSheet: false }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheet])
  return (
    <>
      {sheet ? <div className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] xl:hidden" onClick={() => setShell({ panelSheet: false })} aria-hidden /> : null}
      <aside
        id="intel-panel"
        className={cx(
          'bg-surface',
          // Bottom sheet (below xl)
          'fixed inset-x-0 bottom-0 z-[61] max-h-[85dvh] flex-col rounded-t-2xl border-t border-border shadow-pop',
          sheet ? 'flex animate-up' : 'hidden',
          // Docked column (xl and up)
          'xl:static xl:z-auto xl:max-h-none xl:shrink-0 xl:flex-col xl:rounded-none xl:border-l xl:border-t-0 xl:shadow-none xl:transition-[width] xl:duration-200',
          visible ? 'xl:flex xl:w-[var(--panel-w)]' : 'xl:hidden xl:w-0',
        )}
        aria-label="Intelligence panel"
      />
    </>
  )
}

export function PanelSection({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <section className={cx('mb-5', className)}>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{title}</h3>
        {action}
      </div>
      <div className="text-[13.5px]">{children}</div>
    </section>
  )
}
