'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Check, CloudUpload, FileText, Plus, RefreshCw, Trash2, WifiOff, Zap, PenLine, ExternalLink } from 'lucide-react'
import { Button, useToast, Spinner } from '@/components/ui'
import { cx, relativeTime } from '@/lib/util'
import { createDraft, saveDraft, flushOutbox, outboxItems, removeOutboxItem, retryOutboxItem, useOffline, recentPages, type RecentPage } from '@/lib/offline/sync'
import type { OutboxItem, NoteCreateItem } from '@/lib/offline/db'

/**
  The offline notepad. Works with no network at all: notes written here are kept
  on this device and become real notes (with AI filing) the moment the app is
  back online. Also shows every queued change and the pages readable offline.
*/
export function OfflineNotepad() {
  const router = useRouter()
  const params = useSearchParams()
  const toast = useToast()
  const { online, pending, syncing } = useOffline()
  const [items, setItems] = React.useState<OutboxItem[]>([])
  const [editing, setEditing] = React.useState<NoteCreateItem | null>(null)
  const [recent, setRecent] = React.useState<RecentPage[]>([])
  const [cached, setCached] = React.useState<Set<string>>(new Set())
  const draftParam = params.get('draft')
  const wantsNew = params.get('new') === '1'

  const reload = React.useCallback(async () => {
    const all = await outboxItems()
    setItems(all)
    return all
  }, [])

  React.useEffect(() => {
    void reload()
    setRecent(recentPages())
    // Which of the recent pages are actually in the page cache?
    ;(async () => {
      try {
        if (!('caches' in window)) return
        const keys = await caches.keys()
        const pagesKey = keys.find((k) => k.endsWith('-pages'))
        if (!pagesKey) return
        const reqs = await (await caches.open(pagesKey)).keys()
        setCached(new Set(reqs.map((r) => new URL(r.url).pathname)))
      } catch {
        /* ignore */
      }
    })()
  }, [reload])

  // Open the draft named in the URL, or start a new one.
  React.useEffect(() => {
    ;(async () => {
      if (draftParam) {
        const all = await reload()
        const d = all.find((i) => i.id === draftParam)
        if (d && d.kind === 'note-create') setEditing(d)
      } else if (wantsNew) {
        const d = await createDraft()
        router.replace(`/offline?draft=${d.id}`)
      }
    })()
  }, [draftParam, wantsNew, reload, router])

  // When the draft being edited syncs, continue in the real note.
  React.useEffect(() => {
    const onItem = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; kind: string; noteId?: string }>).detail
      if (editing && d.id === editing.id && d.noteId) {
        toast.push({ text: 'Synced. Continuing in the full editor.', tone: 'success' })
        router.replace(`/notes/${d.noteId}`)
      } else void reload()
    }
    window.addEventListener('hkn:synced-item', onItem)
    return () => window.removeEventListener('hkn:synced-item', onItem)
  }, [editing, reload, router, toast])

  const startNew = async () => {
    const d = await createDraft()
    router.replace(`/offline?draft=${d.id}`)
    setEditing(d)
  }

  if (editing) return <DraftEditor draft={editing} onBack={() => { setEditing(null); router.replace('/offline'); void reload() }} />

  const drafts = items.filter((i): i is NoteCreateItem => i.kind === 'note-create')
  const other = items.filter((i) => i.kind !== 'note-create')

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em]">Offline notes</h1>
          <p className="mt-1 text-[14px] text-fg-2">Write here without a connection. Everything syncs and gets filed by AI the moment you are back online.</p>
        </div>
      </div>
      <div className="mb-6 mt-3 flex flex-wrap items-center gap-2 text-[13px]">
        <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', online ? 'border-success/30 bg-success/10 text-success' : 'border-warning/40 bg-warning/10 text-warning')}>
          {online ? <Check className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />} {online ? 'Online' : 'Offline'}
        </span>
        {pending > 0 ? <span className="inline-flex items-center gap-1.5 text-fg-2">{syncing ? <Spinner className="h-3.5 w-3.5" /> : <CloudUpload className="h-3.5 w-3.5" />} {syncing ? 'Syncing…' : `${pending} waiting to sync`}</span> : null}
        {online && pending > 0 && !syncing ? <Button size="sm" variant="ghost" onClick={() => flushOutbox()}><RefreshCw className="h-3.5 w-3.5" /> Sync now</Button> : null}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button variant="primary" size="lg" onClick={startNew}><Plus className="h-4 w-4" /> New offline note</Button>
      </div>

      <section className="mb-8">
        <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3">Drafts on this device</h2>
        {drafts.length === 0 ? <p className="text-[13.5px] text-fg-3">No drafts. Notes you write offline appear here until they sync.</p> : null}
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {drafts.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-3 py-2.5">
              <PenLine className="h-4 w-4 shrink-0 text-accent" />
              <button className="min-w-0 flex-1 text-left" onClick={() => { setEditing(d); router.replace(`/offline?draft=${d.id}`) }}>
                <div className="truncate text-[14.5px] font-medium">{d.title || firstLine(d.markdown) || 'Untitled'}</div>
                <div className="truncate text-[12px] text-fg-3">{d.error ? <span className="text-danger">{d.error}</span> : `Edited ${relativeTime(new Date(d.updatedAt))}`}</div>
              </button>
              <ItemActions item={d} onChange={reload} />
            </li>
          ))}
        </ul>
      </section>

      {other.length ? (
        <section className="mb-8">
          <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3">Waiting to sync</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {other.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
                {i.kind === 'capture' ? <Zap className="h-4 w-4 shrink-0 text-accent" /> : <FileText className="h-4 w-4 shrink-0 text-fg-3" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px]">{i.kind === 'capture' ? i.text || `${i.files.length} file(s)` : `Edit to “${i.title || 'Untitled'}”`}</div>
                  <div className="truncate text-[12px] text-fg-3">{i.error ? <span className="text-danger">{i.error}</span> : `${i.kind === 'capture' ? 'Captured' : 'Saved'} ${relativeTime(new Date(i.updatedAt))}`}</div>
                </div>
                <ItemActions item={i} onChange={reload} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3">Readable offline</h2>
        {recent.length === 0 ? <p className="text-[13.5px] text-fg-3">Pages you open while online are kept on this device and listed here.</p> : null}
        <ul className="space-y-0.5">
          {recent.slice(0, 20).map((p) => {
            const ok = cached.has(p.href)
            return (
              <li key={p.href}>
                <Link href={p.href} className={cx('flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13.5px] hover:bg-surface-2', !ok && !online && 'opacity-50')}>
                  <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', ok ? 'bg-success' : 'bg-border-2')} />
                  <span className="min-w-0 flex-1 truncate">{p.title || p.href}</span>
                  <span className="text-[11.5px] text-fg-3">{relativeTime(new Date(p.at))}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function firstLine(md: string) {
  return md.split('\n').map((l) => l.replace(/^[#>\-*\s\[\]x]+/i, '').trim()).find(Boolean) ?? ''
}

function ItemActions({ item, onChange }: { item: OutboxItem; onChange: () => Promise<unknown> }) {
  const { online } = useOffline()
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {item.error && online ? <button className="rounded-md p-2 text-fg-3 hover:bg-surface-2 hover:text-fg" title="Retry" aria-label="Retry" onClick={async () => { await retryOutboxItem(item.id); await onChange() }}><RefreshCw className="h-4 w-4" /></button> : null}
      <button className="rounded-md p-2 text-fg-3 hover:bg-surface-2 hover:text-danger" title="Discard" aria-label="Discard" onClick={async () => { if (confirm('Discard this unsynced change?')) { await removeOutboxItem(item.id); await onChange() } }}><Trash2 className="h-4 w-4" /></button>
    </div>
  )
}

/** Plain title + markdown editor that saves to the device on every keystroke. */
function DraftEditor({ draft, onBack }: { draft: NoteCreateItem; onBack: () => void }) {
  const { online, syncing } = useOffline()
  const [title, setTitle] = React.useState(draft.title)
  const [body, setBody] = React.useState(draft.markdown)
  const [state, setState] = React.useState<'idle' | 'saving' | 'saved'>('idle')
  const timer = React.useRef<number | undefined>(undefined)
  const bodyRef = React.useRef<HTMLTextAreaElement>(null)

  const save = React.useCallback((t: string, b: string) => {
    window.clearTimeout(timer.current)
    setState('saving')
    timer.current = window.setTimeout(async () => {
      await saveDraft(draft.id, { title: t, markdown: b })
      setState('saved')
    }, 300)
  }, [draft.id])

  React.useEffect(() => {
    const el = bodyRef.current
    if (el) { el.style.height = 'auto'; el.style.height = Math.max(240, el.scrollHeight) + 'px' }
  }, [body])
  React.useEffect(() => { if (!draft.title && !draft.markdown) setTimeout(() => bodyRef.current?.focus(), 50) }, [draft.id, draft.title, draft.markdown])

  // Leaving the page flushes immediately.
  React.useEffect(() => () => { window.clearTimeout(timer.current); void saveDraft(draft.id, { title, markdown: body }) }, [draft.id, title, body])

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button onClick={onBack} className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-[13.5px] text-fg-2 hover:bg-surface-2 hover:text-fg"><ArrowLeft className="h-4 w-4" /> Offline notes</button>
        <span className={cx('inline-flex min-w-0 items-center gap-1.5 truncate rounded-full border px-2.5 py-1 text-[12px]', online ? 'border-border text-fg-3' : 'border-warning/40 bg-warning/10 text-warning')}>
          {online ? (syncing ? <Spinner className="h-3 w-3" /> : <CloudUpload className="h-3.5 w-3.5 shrink-0" />) : <WifiOff className="h-3.5 w-3.5 shrink-0" />}
          <span className="truncate">{state === 'saving' ? 'Saving…' : online ? (syncing ? 'Syncing' : 'Saved · syncs shortly') : 'Saved on this device'}</span>
        </span>
      </div>
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); save(e.target.value, body) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); bodyRef.current?.focus() } }}
        placeholder="Untitled"
        data-large
        className="w-full bg-transparent text-[28px] font-semibold leading-tight tracking-[-0.02em] outline-none placeholder:text-fg-3"
      />
      <textarea
        ref={bodyRef}
        value={body}
        onChange={(e) => { setBody(e.target.value); save(title, e.target.value) }}
        placeholder={'Write freely. Markdown works: # headings, - bullets, - [ ] tasks, "Decision: …", "@Name to … by Friday".\n\nAI files people, companies, tasks and decisions once this syncs.'}
        data-large
        className="editor-prose mt-3 w-full resize-none bg-transparent text-[17px] leading-relaxed outline-none placeholder:text-fg-3"
        style={{ minHeight: 240 }}
      />
      <p className="mt-4 text-[12px] text-fg-3">
        {online ? 'Connected. This draft becomes a full note automatically; you will be taken to it when it syncs.' : 'No connection. Keep writing — nothing is lost. When you are back online this becomes a full note with AI filing.'}
        {' '}<Link href="/notes" className="inline-flex items-center gap-0.5 underline-offset-2 hover:underline">All notes <ExternalLink className="h-3 w-3" /></Link>
      </p>
    </div>
  )
}
