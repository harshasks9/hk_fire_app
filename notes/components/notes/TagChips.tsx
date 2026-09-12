'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Tag, X, Plus } from 'lucide-react'
import { cx } from '@/lib/util'
import { api } from '@/lib/client'
import { useToast } from '@/components/ui'

import { tagHref } from '@/lib/tag-href'
export { tagHref }

/** Read-only chips (note rows, meeting page, search hits). */
export function TagChips({ tags, max = 6, className, active, plain }: { tags: string[]; max?: number; className?: string; active?: string | null; /** Render without links (inside another link, e.g. a note row). */ plain?: boolean }) {
  if (!tags.length) return null
  const shown = tags.slice(0, max)
  const cls = (t: string) => cx('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11.5px] transition', !plain && 'hover:bg-accent-soft hover:text-accent', active === t ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-2')
  return (
    <span className={cx('flex flex-wrap items-center gap-1', className)}>
      {shown.map((t) =>
        plain ? (
          <span key={t} className={cls(t)}><span className="text-fg-3">#</span>{t}</span>
        ) : (
          <Link key={t} href={tagHref(t)} onClick={(e) => e.stopPropagation()} className={cls(t)}>
            <span className="text-fg-3">#</span>{t}
          </Link>
        ),
      )}
      {tags.length > shown.length ? <span className="text-[11px] text-fg-3">+{tags.length - shown.length}</span> : null}
    </span>
  )
}

/** Editable tags on a note: automatic ones can be removed, own ones added and removed. */
export function TagEditor({ noteId, auto, manual }: { noteId: string; auto: string[]; manual: string[] }) {
  const router = useRouter()
  const toast = useToast()
  const [autoTags, setAuto] = React.useState(auto)
  const [manualTags, setManual] = React.useState(manual)
  const [adding, setAdding] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  React.useEffect(() => setAuto(auto), [auto])
  React.useEffect(() => setManual(manual), [manual])
  const save = async (next: string[]) => {
    setManual(next)
    try {
      await api(`/api/notes/${noteId}`, { method: 'PATCH', json: { manualTags: next } })
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) }
  }
  const add = async () => {
    const t = draft.trim().replace(/^#/, '').toLowerCase()
    setDraft('')
    setAdding(false)
    if (!t || manualTags.includes(t) || autoTags.includes(t)) return
    await save([...manualTags, t])
  }
  const removeAuto = async (t: string) => {
    setAuto((a) => a.filter((x) => x !== t))
    try {
      await api(`/api/notes/${noteId}`, { method: 'PATCH', json: { tags: autoTags.filter((x) => x !== t) } })
      router.refresh()
    } catch (e) { toast.push({ text: String(e), tone: 'danger' }) }
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {manualTags.map((t) => (
        <span key={`m-${t}`} className="group inline-flex items-center gap-0.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11.5px] text-accent">
          <Link href={tagHref(t)} className="hover:underline"><span className="opacity-60">#</span>{t}</Link>
          <button onClick={() => save(manualTags.filter((x) => x !== t))} className="ml-0.5 rounded p-0.5 opacity-60 hover:opacity-100" aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      {autoTags.map((t) => (
        <span key={`a-${t}`} className="group inline-flex items-center gap-0.5 rounded-md bg-surface-2 px-1.5 py-0.5 text-[11.5px] text-fg-2" title="Suggested from the content">
          <Link href={tagHref(t)} className="hover:text-accent"><span className="text-fg-3">#</span>{t}</Link>
          <button onClick={() => removeAuto(t)} className="ml-0.5 rounded p-0.5 text-fg-3 opacity-0 transition hover:text-fg group-hover:opacity-100 pointer-coarse:opacity-100" aria-label={`Remove ${t}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      {adding ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void add(); if (e.key === 'Escape') { setAdding(false); setDraft('') } }}
          onBlur={() => void add()}
          placeholder="tag"
          className="h-6 w-24 rounded-md border border-border bg-surface px-1.5 text-[12px] outline-none focus:border-accent"
        />
      ) : (
        <button onClick={() => setAdding(true)} className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-border px-1.5 py-0.5 text-[11.5px] text-fg-3 hover:border-border-2 hover:text-fg"><Plus className="h-3 w-3" /> tag</button>
      )}
      {!autoTags.length && !manualTags.length ? <span className="inline-flex items-center gap-1 text-[12px] text-fg-3"><Tag className="h-3 w-3" /> Tags appear after AI reads the note</span> : null}
    </div>
  )
}
