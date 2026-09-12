'use client'
import * as React from 'react'
import { Sidebar, type SidebarProps, ContextSwitcher } from './Sidebar'
import { MobileNav } from './MobileNav'
import { CommandBar } from './CommandBar'
import { QuickCapture } from './QuickCapture'
import { PanelHost } from './IntelligencePanel'
import { Shortcuts } from './Shortcuts'
import { ToastProvider } from '@/components/ui'
import { useShell, setShell } from './store'
import { Search, PanelRight, Zap, Sparkles } from 'lucide-react'
import { OfflineProvider } from '@/components/offline/OfflineProvider'
import { OfflineBadge } from '@/components/offline/OfflineBadge'
import { GlobalTemplatePicker } from '@/components/notes/TemplatePicker'
import { NavProgress } from './NavProgress'
import { cx } from '@/lib/util'

export function AppShell({ sidebar, children, viewingAsAdmin }: { sidebar: SidebarProps; children: React.ReactNode; viewingAsAdmin?: { notebookName: string } | null }) {
  const { panelAvailable, panelOpen } = useShell()
  return (
    <ToastProvider>
      <OfflineProvider contextId={sidebar.active.id}>
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar {...sidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          {viewingAsAdmin ? <AdminBanner notebookName={viewingAsAdmin.notebookName} /> : null}
          {/* Mobile top bar */}
          <div className="flex h-[calc(48px+env(safe-area-inset-top))] shrink-0 items-center justify-between border-b border-border bg-surface px-3 pt-[env(safe-area-inset-top)] md:hidden">
            <ContextSwitcher contexts={sidebar.contexts} active={sidebar.active} />
            <div className="flex items-center gap-0.5">
              <OfflineBadge compact className="mr-1" />
              {panelAvailable ? (
                <button className="relative rounded-md p-2.5 text-accent hover:bg-surface-2 xl:hidden" onClick={() => setShell({ panelSheet: true })} aria-label="Open intelligence panel"><Sparkles className="h-[18px] w-[18px]" /></button>
              ) : null}
              <button className="rounded-md p-2.5 text-fg-2 hover:bg-surface-2" onClick={() => setShell({ captureOpen: true })} aria-label="Quick capture"><Zap className="h-[18px] w-[18px]" /></button>
              <button className="rounded-md p-2.5 text-fg-2 hover:bg-surface-2" onClick={() => setShell({ commandOpen: true })} aria-label="Search"><Search className="h-[18px] w-[18px]" /></button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1">
            <main className="relative min-w-0 flex-1 overflow-y-auto pb-24 md:pb-0">
              {panelAvailable && !panelOpen ? (
                <button className="absolute right-3 top-3 z-10 hidden rounded-md border border-border bg-surface p-1.5 text-fg-3 shadow-soft hover:text-fg xl:block" onClick={() => setShell({ panelOpen: true })} title="Open intelligence panel (⌘.)" aria-label="Open intelligence panel">
                  <PanelRight className="h-4 w-4" />
                </button>
              ) : null}
              {children}
            </main>
            <PanelHost />
          </div>
        </div>
      </div>
      <React.Suspense fallback={null}><NavProgress /></React.Suspense>
      <MobileNav />
      <CommandBar />
      <QuickCapture />
      <GlobalTemplatePicker />
      <Shortcuts />
      </OfflineProvider>
    </ToastProvider>
  )
}

function AdminBanner({ notebookName }: { notebookName: string }) {
  const [busy, setBusy] = React.useState(false)
  return (
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-warning/40 bg-warning/10 px-3 py-1.5 text-[12.5px] text-warning">
      <span>Viewing <strong>{notebookName}</strong> as admin. Anything you do here happens in their notebook.</span>
      <button disabled={busy} className="rounded-md border border-warning/40 px-2 py-0.5 font-medium hover:bg-warning/10" onClick={async () => { setBusy(true); try { await fetch('/api/admin/leave', { method: 'POST' }); window.location.href = '/admin' } finally { setBusy(false) } }}>Back to my notebook</button>
    </div>
  )
}

export function Page({ children, className, width = 'default' }: { children: React.ReactNode; className?: string; width?: 'default' | 'narrow' | 'wide' | 'full' }) {
  return <div className={cx('mx-auto w-full px-5 py-6 sm:px-8 sm:py-8', width === 'narrow' ? 'max-w-[760px]' : width === 'wide' ? 'max-w-[1200px]' : width === 'full' ? 'max-w-none' : 'max-w-[960px]', className)}>{children}</div>
}
