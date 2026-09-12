'use client'
import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, FileText, Plus, Search, Inbox, Mic, Camera, Upload, CalendarDays, X, PenLine } from 'lucide-react'
import { cx } from '@/lib/util'
import { api } from '@/lib/client'
import { setShell } from './store'

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const tabs = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/notes', label: 'Notes', icon: FileText },
    null,
    { href: '/search', label: 'Search', icon: Search },
    { href: '/inbox', label: 'Inbox', icon: Inbox },
  ]
  const actions = [
    { label: 'New note', icon: PenLine, run: async () => { const n = await api<{ id: string }>('/api/notes', { method: 'POST', json: {} }); router.push(`/notes/${n.id}`) } },
    { label: 'Voice note', icon: Mic, run: () => router.push('/capture/voice') },
    { label: 'Camera', icon: Camera, run: () => setShell({ captureOpen: true }) },
    { label: 'Screenshot', icon: Upload, run: () => setShell({ captureOpen: true }) },
    { label: 'Meeting', icon: CalendarDays, run: () => router.push('/meetings/live') },
    { label: 'Quick note', icon: Plus, run: () => setShell({ captureOpen: true }) },
  ]
  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)}>
          <div className="animate-up absolute bottom-[calc(64px+env(safe-area-inset-bottom))] left-3 right-3 rounded-2xl border border-border bg-surface p-3 shadow-pop" onClick={(e) => e.stopPropagation()}>
            <div className="grid grid-cols-3 gap-2">
              {actions.map((a) => (
                <button key={a.label} className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-[12.5px] hover:bg-surface-2" onClick={() => { setOpen(false); a.run() }}>
                  <a.icon className="h-5 w-5 text-accent" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around border-t border-border bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Mobile">
        {tabs.map((t, i) =>
          t ? (
            <Link key={t.href} href={t.href} className={cx('flex h-16 w-14 flex-col items-center justify-center gap-1 text-[10.5px]', (t.href === '/' ? pathname === '/' : pathname.startsWith(t.href)) ? 'text-fg' : 'text-fg-3')}>
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ) : (
            <button key={i} onClick={() => setOpen((o) => !o)} className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-fg shadow-pop" aria-label="Capture">
              {open ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
            </button>
          ),
        )}
      </nav>
    </>
  )
}
