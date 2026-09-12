'use client'
import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Inbox, FileText, CalendarDays, CheckSquare, Users, Hash, FlaskConical, Search, Sparkles, Settings, PanelLeftClose, PanelLeftOpen, Plus, Building2, Star, Clock, GitBranch, Repeat, ChevronsUpDown, Check } from 'lucide-react'
import { setShell, useShell } from './store'
import { cx } from '@/lib/util'
import { Avatar } from '@/components/ui'
import { api } from '@/lib/client'
import { createNoteAndOpen } from '@/lib/offline/notes-client'
import { OfflineBadge } from '@/components/offline/OfflineBadge'

export interface SidebarProps {
  contexts: { id: string; slug: string; name: string; kind: string }[]
  active: { id: string; slug: string; name: string; kind: string }
  favorites: { id: string; title: string; kind: string }[]
  recents: { id: string; title: string; kind: string }[]
  pinned: { id: string; name: string; type: string }[]
  inboxCount: number
  userName: string
}

const NAV = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/people', label: 'People', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/topics', label: 'Topics', icon: Hash },
  { href: '/decisions', label: 'Decisions', icon: GitBranch },
  { href: '/loops', label: 'Open loops', icon: Repeat },
  { href: '/research', label: 'Research', icon: FlaskConical },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/ask', label: 'Ask', icon: Sparkles },
]

export function Sidebar(props: SidebarProps) {
  const { sidebarCollapsed: collapsed } = useShell()
  const pathname = usePathname()
  const router = useRouter()
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  const newNote = () => createNoteAndOpen(router)

  return (
    <nav className={cx('hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex', collapsed ? 'w-[var(--sidebar-collapsed-w)]' : 'w-[var(--sidebar-w)]')} aria-label="Primary">
      <div className={cx('flex h-12 items-center', collapsed ? 'justify-center' : 'justify-between px-3')}>
        {!collapsed ? <ContextSwitcher contexts={props.contexts} active={props.active} /> : null}
        <button className="rounded-md p-1.5 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={() => setShell({ sidebarCollapsed: !collapsed })} title={collapsed ? 'Expand sidebar (⌘\\)' : 'Collapse sidebar (⌘\\)'} aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <div className={cx('px-2 pb-2', collapsed && 'px-1.5')}>
        <button onClick={newNote} className={cx('flex w-full items-center gap-2 rounded-lg border border-border-2 bg-surface px-2.5 py-1.5 text-[13px] font-medium text-fg shadow-[0_1px_0_rgba(0,0,0,0.03)] hover:bg-surface-2', collapsed && 'justify-center px-0')} title="New note (⌘N)">
          <Plus className="h-4 w-4" />
          {!collapsed ? <span className="flex-1 text-left">New note</span> : null}
          {!collapsed ? <span className="kbd">⌘N</span> : null}
        </button>
        {!collapsed ? <OfflineBadge className="mt-2 w-full justify-center" /> : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ul className="space-y-px">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className={cx('flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] transition-colors', isActive(n.href) ? 'bg-surface-2 font-medium text-fg' : 'text-fg-2 hover:bg-surface-2 hover:text-fg', collapsed && 'justify-center px-0')} title={collapsed ? n.label : undefined}>
                <n.icon className={cx('h-4 w-4 shrink-0', isActive(n.href) ? 'text-fg' : 'text-fg-3')} />
                {!collapsed ? <span className="flex-1 truncate">{n.label}</span> : null}
                {!collapsed && n.href === '/inbox' && props.inboxCount > 0 ? <span className="rounded bg-accent-soft px-1.5 text-[11px] font-medium text-accent">{props.inboxCount}</span> : null}
              </Link>
            </li>
          ))}
        </ul>

        {!collapsed && (props.pinned.length > 0 || props.favorites.length > 0) ? (
          <div className="mt-5">
            <div className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3"><Star className="h-3 w-3" /> Favorites</div>
            <ul className="space-y-px">
              {props.pinned.map((e) => (
                <li key={e.id}>
                  <Link href={e.type === 'person' ? `/people/${e.id}` : e.type === 'company' ? `/companies/${e.id}` : `/topics/${e.id}`} className={cx('block truncate rounded-lg px-2 py-1 text-[13px] text-fg-2 hover:bg-surface-2 hover:text-fg', pathname.includes(e.id) && 'bg-surface-2 text-fg')}>
                    {e.name}
                  </Link>
                </li>
              ))}
              {props.favorites.map((n) => (
                <li key={n.id}>
                  <Link href={`/notes/${n.id}`} className={cx('block truncate rounded-lg px-2 py-1 text-[13px] text-fg-2 hover:bg-surface-2 hover:text-fg', pathname.includes(n.id) && 'bg-surface-2 text-fg')}>
                    {n.title || 'Untitled'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!collapsed && props.recents.length > 0 ? (
          <div className="mt-5">
            <div className="mb-1 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3"><Clock className="h-3 w-3" /> Recent</div>
            <ul className="space-y-px">
              {props.recents.map((n) => (
                <li key={n.id}>
                  <Link href={`/notes/${n.id}`} className={cx('block truncate rounded-lg px-2 py-1 text-[13px] text-fg-2 hover:bg-surface-2 hover:text-fg', pathname.includes(n.id) && 'bg-surface-2 text-fg')}>
                    {n.title || 'Untitled'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className={cx('border-t border-border p-2', collapsed && 'flex flex-col items-center gap-1')}>
        <Link href="/settings" className={cx('flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] text-fg-2 hover:bg-surface-2 hover:text-fg', pathname.startsWith('/settings') && 'bg-surface-2 text-fg', collapsed && 'justify-center px-0')} title="Settings">
          <Settings className="h-4 w-4 text-fg-3" />
          {!collapsed ? 'Settings' : null}
        </Link>
        <Link href="/settings#account" className={cx('mt-0.5 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] text-fg-2 hover:bg-surface-2 hover:text-fg', collapsed && 'justify-center px-0')} title="Account">
          <Avatar name={props.userName} size={20} />
          {!collapsed ? <span className="truncate">{props.userName}</span> : null}
        </Link>
      </div>
    </nav>
  )
}

export function ContextSwitcher({ contexts, active, className }: { contexts: SidebarProps['contexts']; active: SidebarProps['active']; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  const switchTo = async (slug: string) => {
    setOpen(false)
    await api('/api/context', { method: 'POST', json: { slug } })
    router.push('/')
    router.refresh()
  }
  return (
    <div ref={ref} className={cx('relative', className)}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13.5px] font-semibold hover:bg-surface-2 pointer-coarse:min-h-10 pointer-coarse:px-2" aria-haspopup="listbox" aria-expanded={open}>
        <span className={cx('inline-block h-2 w-2 rounded-full', dotFor(active.kind))} />
        {active.name}
        <ChevronsUpDown className="h-3.5 w-3.5 text-fg-3" />
      </button>
      {open ? (
        <div className="animate-pop absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border bg-surface p-1 shadow-pop" role="listbox">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">Context</div>
          {contexts.map((c) => (
            <button key={c.id} onClick={() => switchTo(c.slug)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13.5px] hover:bg-surface-2" role="option" aria-selected={c.id === active.id}>
              <span className={cx('inline-block h-2 w-2 rounded-full', dotFor(c.kind))} />
              <span className="flex-1">{c.name}</span>
              {c.id === active.id ? <Check className="h-3.5 w-3.5 text-accent" /> : null}
            </button>
          ))}
          <div className="mt-1 border-t border-border px-2 pt-1.5 text-[11.5px] text-fg-3">Contexts keep data, permissions and AI retrieval separate.</div>
        </div>
      ) : null}
    </div>
  )
}

import { dotFor } from '@/lib/ui-helpers'
export { dotFor }
