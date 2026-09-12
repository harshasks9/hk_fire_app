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
    <div className="flex h-full flex-col">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.06em] text-fg-2">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          {title}
        </div>
        <button className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={() => setShell({ panelOpen: false })} title="Close panel (⌘.)" aria-label="Close panel">
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
    </div>,
    host,
  )
}

export function PanelHost() {
  const { panelOpen, panelAvailable } = useShell()
  const visible = panelOpen && panelAvailable
  return (
    <aside id="intel-panel" className={cx('hidden shrink-0 border-l border-border bg-surface transition-[width] duration-200 xl:block', visible ? 'w-[var(--panel-w)]' : 'w-0 overflow-hidden border-l-0')} aria-label="Intelligence panel" />
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
