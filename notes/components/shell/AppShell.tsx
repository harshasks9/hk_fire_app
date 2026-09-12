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
import { Search, PanelRight, Zap } from 'lucide-react'
import { cx } from '@/lib/util'

export function AppShell({ sidebar, children }: { sidebar: SidebarProps; children: React.ReactNode }) {
  const { panelAvailable, panelOpen } = useShell()
  return (
    <ToastProvider>
      <div className="flex h-dvh w-full overflow-hidden">
        <Sidebar {...sidebar} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-3 md:hidden">
            <ContextSwitcher contexts={sidebar.contexts} active={sidebar.active} />
            <div className="flex items-center gap-1">
              <button className="rounded-md p-2 text-fg-2 hover:bg-surface-2" onClick={() => setShell({ captureOpen: true })} aria-label="Quick capture"><Zap className="h-4 w-4" /></button>
              <button className="rounded-md p-2 text-fg-2 hover:bg-surface-2" onClick={() => setShell({ commandOpen: true })} aria-label="Search"><Search className="h-4 w-4" /></button>
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
      <MobileNav />
      <CommandBar />
      <QuickCapture />
      <Shortcuts />
    </ToastProvider>
  )
}

export function Page({ children, className, width = 'default' }: { children: React.ReactNode; className?: string; width?: 'default' | 'narrow' | 'wide' | 'full' }) {
  return <div className={cx('mx-auto w-full px-5 py-6 sm:px-8 sm:py-8', width === 'narrow' ? 'max-w-[760px]' : width === 'wide' ? 'max-w-[1200px]' : width === 'full' ? 'max-w-none' : 'max-w-[960px]', className)}>{children}</div>
}
