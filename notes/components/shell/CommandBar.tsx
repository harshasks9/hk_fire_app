'use client'
import * as React from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import { FileText, CalendarDays, Users, Building2, Hash, CheckSquare, GitBranch, FlaskConical, Sparkles, Search, Plus, Inbox, Home, Repeat, Settings, Mic, Zap, ArrowRight, Sun, Moon, Share2, TrendingUp, FileUp } from 'lucide-react'
import { setShell, useShell } from './store'
import { startNavigation } from './NavProgress'
import { api } from '@/lib/client'
import { createNoteAndOpen } from '@/lib/offline/notes-client'
import type { SearchResult } from '@/lib/search'
import { cx } from '@/lib/util'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = { note: FileText, meeting: CalendarDays, person: Users, company: Building2, topic: Hash, project: Hash, task: CheckSquare, decision: GitBranch, research: FlaskConical, commitment: Repeat }

export function CommandBar() {
  const { commandOpen, commandQuery } = useShell()
  const router = useRouter()
  const [q, setQ] = React.useState('')
  const [result, setResult] = React.useState<SearchResult | null>(null)
  const [loading, setLoading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (commandOpen) {
      setQ(commandQuery)
      setResult(null)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [commandOpen, commandQuery])

  React.useEffect(() => {
    if (!commandOpen) return
    const query = q.trim()
    if (query.length < 2) { setResult(null); return }
    let alive = true
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const r = await api<SearchResult>(`/api/search?q=${encodeURIComponent(query)}&limit=4`)
        if (alive) setResult(r)
      } finally {
        if (alive) setLoading(false)
      }
    }, 120)
    return () => { alive = false; clearTimeout(t) }
  }, [q, commandOpen])

  const close = () => setShell({ commandOpen: false })
  const go = (href: string) => { close(); startNavigation(); router.push(href) }
  const newNote = async () => { close(); await createNoteAndOpen(router) }

  if (!commandOpen) return null
  const isQuestion = result?.isQuestion || /\?$/.test(q) || /^(what|who|when|where|why|how|which|show|find|list)\b/i.test(q.trim())
  const commands = [
    { id: 'new-note', label: 'New note', icon: Plus, run: newNote, kbd: '⌘N', keywords: 'create write' },
    { id: 'new-template', label: 'New note from template…', icon: FileText, run: () => { close(); setShell({ templatePickerOpen: true }) }, keywords: 'template meeting 1:1 decision review' },
    { id: 'review', label: 'Weekly review', icon: Repeat, run: () => go('/review'), keywords: 'week retrospective' },
    { id: 'trash', label: 'Trash', icon: Inbox, run: () => go('/trash'), keywords: 'deleted restore' },
    { id: 'quick', label: 'Quick capture', icon: Zap, run: () => { close(); setShell({ captureOpen: true }) }, kbd: '⌘⇧N', keywords: 'capture jot' },
    { id: 'voice', label: 'Record voice note', icon: Mic, run: () => go('/capture/voice'), keywords: 'audio record' },
    { id: 'live', label: 'Start live meeting', icon: CalendarDays, run: () => go('/meetings/live'), keywords: 'transcribe record meeting' },
    { id: 'upload-documents', label: 'Upload documents (PDF, Word, Excel, images)…', icon: FileUp, run: () => { close(); setShell({ uploadOpen: true }) }, keywords: 'upload pdf docx word excel xlsx csv scan image file document import extract' },
    { id: 'import-recording', label: 'Import a meeting recording or transcript', icon: Mic, run: () => go('/meetings/import'), keywords: 'recording transcript iphone voice memo upload audio m4a' },
    { id: 'ask', label: 'Ask my notes', icon: Sparkles, run: () => go('/ask'), keywords: 'ai question' },
    { id: 'home', label: 'Go to Home', icon: Home, run: () => go('/') },
    { id: 'today', label: 'Today: journal, schedule, due', icon: Sun, run: () => go('/today'), keywords: 'today daily note journal day schedule due' },
    { id: 'inbox', label: 'Go to Inbox', icon: Inbox, run: () => go('/inbox') },
    { id: 'notes', label: 'Go to Notes', icon: FileText, run: () => go('/notes') },
    { id: 'meetings', label: 'Go to Meetings', icon: CalendarDays, run: () => go('/meetings') },
    { id: 'tasks', label: 'Go to Tasks', icon: CheckSquare, run: () => go('/tasks') },
    { id: 'people', label: 'Go to People', icon: Users, run: () => go('/people') },
    { id: 'companies', label: 'Go to Companies', icon: Building2, run: () => go('/companies') },
    { id: 'topics', label: 'Go to Topics', icon: Hash, run: () => go('/topics') },
    { id: 'tags', label: 'Go to Tags', icon: Hash, run: () => go('/tags'), keywords: 'tag labels' },
    { id: 'graph', label: 'Open the graph', icon: Share2, run: () => go('/graph'), keywords: 'graph network map relationships' },
    { id: 'numbers', label: 'Numbers dashboard', icon: TrendingUp, run: () => go('/numbers'), keywords: 'numbers metrics kpi figures charts dashboard' },
    { id: 'decisions', label: 'Go to Decisions', icon: GitBranch, run: () => go('/decisions') },
    { id: 'loops', label: 'Go to Open loops', icon: Repeat, run: () => go('/loops') },
    { id: 'research', label: 'Go to Research', icon: FlaskConical, run: () => go('/research') },
    { id: 'settings', label: 'Go to Settings', icon: Settings, run: () => go('/settings') },
    { id: 'theme-dark', label: 'Switch to dark mode', icon: Moon, run: () => { close(); setShell({ theme: 'dark' }) }, keywords: 'theme' },
    { id: 'theme-light', label: 'Switch to light mode', icon: Sun, run: () => { close(); setShell({ theme: 'light' }) }, keywords: 'theme' },
  ]

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-black/20 px-3 pt-[12vh] backdrop-blur-[2px]" onMouseDown={close}>
      <Command shouldFilter={false} className="animate-pop w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-surface shadow-pop" onMouseDown={(e) => e.stopPropagation()} label="Command bar" loop>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-fg-3" />
          <Command.Input ref={inputRef} value={q} onValueChange={setQ} placeholder="Search, navigate, or ask anything…" className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-fg-3" />
          {loading ? <span className="text-[11px] text-fg-3">searching…</span> : <span className="kbd">esc</span>}
        </div>
        <Command.List className="max-h-[60vh] overflow-y-auto p-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.06em] [&_[cmdk-group-heading]]:text-fg-3">
          {q.trim().length >= 2 ? (
            <Command.Group heading="Ask">
              <Item onSelect={() => go(`/ask?q=${encodeURIComponent(q.trim())}`)} icon={Sparkles} accent>
                <span className="flex-1 truncate">{isQuestion ? `Ask: “${q.trim()}”` : `Ask AI about “${q.trim()}”`}</span>
                <ArrowRight className="h-3.5 w-3.5 text-fg-3" />
              </Item>
              <Item onSelect={() => go(`/search?q=${encodeURIComponent(q.trim())}`)} icon={Search}>
                <span className="flex-1 truncate">Search everything for “{q.trim()}”</span>
                <span className="kbd">↵</span>
              </Item>
            </Command.Group>
          ) : null}
          {result?.groups.map((g) => (
            <Command.Group key={g.type} heading={g.label}>
              {g.hits.map((h) => {
                const Icon = ICONS[h.type] ?? FileText
                return (
                  <Item key={h.type + h.id} onSelect={() => go(h.href)} icon={Icon}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{h.title}</span>
                      {h.subtitle || h.snippet ? <span className="block truncate text-[12px] text-fg-3">{h.subtitle ?? h.snippet}</span> : null}
                    </span>
                    {h.matchKind === 'semantic' ? <span className="text-[10.5px] text-accent">semantic</span> : null}
                  </Item>
                )
              })}
            </Command.Group>
          ))}
          <Command.Group heading={q.trim() ? 'Commands' : 'Quick actions'}>
            {commands
              .filter((c) => !q.trim() || (c.label + ' ' + (c.keywords ?? '')).toLowerCase().includes(q.trim().toLowerCase()))
              .slice(0, q.trim() ? 6 : 8)
              .map((c) => (
                <Item key={c.id} onSelect={c.run} icon={c.icon}>
                  <span className="flex-1">{c.label}</span>
                  {c.kbd ? <span className="kbd">{c.kbd}</span> : null}
                </Item>
              ))}
          </Command.Group>
          {!q.trim() ? (
            <div className="px-2 py-2 text-[12px] text-fg-3">Try “Show my meetings with Thomas” · “What did we decide about marketplace caps?” · “Open Nissan”</div>
          ) : null}
        </Command.List>
      </Command>
    </div>
  )
}

function Item({ children, onSelect, icon: Icon, accent }: { children: React.ReactNode; onSelect: () => void; icon: React.ComponentType<{ className?: string }>; accent?: boolean }) {
  return (
    <Command.Item onSelect={onSelect} value={Math.random().toString(36)} className={cx('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] data-[selected=true]:bg-surface-2', accent && 'text-fg')}>
      <Icon className={cx('h-4 w-4 shrink-0', accent ? 'text-accent' : 'text-fg-3')} />
      {children}
    </Command.Item>
  )
}
