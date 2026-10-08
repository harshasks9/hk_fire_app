'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, CalendarDays, Flag, User, Globe, Pencil, Trash2, Paperclip, Upload, X, ArrowLeft, Copy, ExternalLink } from 'lucide-react'
import { Badge, Button, useToast } from '@/components/ui'
import { NoteEditor } from '@/components/editor/NoteEditor'
import { ShareDialog } from '@/components/notes/ShareDialog'
import { TaskEditor } from '@/components/crud/editors'
import { EntityChip } from '@/components/entities'
import { formatSize } from '@/components/share/AttachmentGallery'
import { api } from '@/lib/client'
import { cx, formatDate, relativeTime } from '@/lib/util'

export interface TaskDetailVM {
  task: { id: string; title: string; owner: string; status: string; priority: string; dueAt: string | null; details: unknown; detailsText: string; sourceNoteId: string | null; sourceExcerpt: string | null; createdAt: string; updatedAt: string; completedAt: string | null; aiGenerated: boolean; contextId: string }
  contextName: string
  entity: { id: string; name: string; type: string } | null
  sourceNote: { id: string; title: string } | null
  attachments: { id: string; name: string; mime: string; size: number; durationSeconds: number | null; createdAt: string }[]
  publicUrl: string | null
}

const STATUS: { id: string; label: string }[] = [{ id: 'open', label: 'Open' }, { id: 'waiting', label: 'Waiting' }, { id: 'delegated', label: 'Delegated' }, { id: 'done', label: 'Done' }, { id: 'dropped', label: 'Dropped' }]

/** One task, in full: status and dates, the rich details editor, files and media, and the public link. */
export function TaskDetail({ d }: { d: TaskDetailVM }) {
  const router = useRouter()
  const toast = useToast()
  const t = d.task
  const [status, setStatus] = React.useState(t.status)
  const [edit, setEdit] = React.useState(false)
  const [share, setShare] = React.useState(false)
  const [uploading, setUploading] = React.useState(0)
  const [drag, setDrag] = React.useState(false)
  const fileInput = React.useRef<HTMLInputElement>(null)
  const done = status === 'done'

  const setTo = async (s: string) => {
    setStatus(s)
    try { await api(`/api/tasks/${t.id}`, { method: 'PATCH', json: { status: s } }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) }
  }
  const upload = async (files: File[]) => {
    if (!files.length) return
    setUploading((n) => n + files.length)
    for (const f of files) {
      const fd = new FormData(); fd.set('taskId', t.id); fd.set('file', f)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!res.ok) throw new Error((await res.json()).error ?? 'Upload failed')
      } catch (e) { toast.push({ text: `${f.name}: ${String((e as Error).message ?? e)}`, tone: 'danger' }) }
      finally { setUploading((n) => n - 1) }
    }
    router.refresh()
  }
  const removeAttachment = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return
    try { await api(`/api/attachments/${id}`, { method: 'DELETE' }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) }
  }
  const remove = async () => {
    if (!confirm('Delete this task, its details, files and public links?')) return
    await api(`/api/tasks/${t.id}`, { method: 'DELETE' })
    router.push('/tasks'); router.refresh()
  }
  const copyPublic = async () => { if (!d.publicUrl) return; try { await navigator.clipboard.writeText(d.publicUrl); toast.push({ text: 'Public link copied', tone: 'success' }) } catch { /* ignore */ } }

  const images = d.attachments.filter((a) => a.mime.startsWith('image/'))
  const media = d.attachments.filter((a) => a.mime.startsWith('audio/') || a.mime.startsWith('video/'))
  const files = d.attachments.filter((a) => !images.includes(a) && !media.includes(a))
  const url = (id: string) => `/api/attachments/${id}`

  const meta = (
    <>
      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" /> {t.owner}</span>
      {t.dueAt ? <span className={cx('inline-flex items-center gap-1', !done && new Date(t.dueAt) < new Date() && 'text-danger')}><CalendarDays className="h-3 w-3" /> Due {formatDate(t.dueAt)}</span> : null}
      {t.priority !== 'normal' ? <span className="inline-flex items-center gap-1"><Flag className="h-3 w-3" /> {t.priority}</span> : null}
      <span>{d.contextName}</span>
      {d.entity ? <EntityChip id={d.entity.id} name={d.entity.name} type={d.entity.type} subtle /> : null}
      {d.sourceNote ? <Link href={`/notes/${d.sourceNote.id}${t.sourceExcerpt ? `?highlight=${encodeURIComponent(t.sourceExcerpt.slice(0, 100))}` : ''}`} className="hover:text-fg">from “{d.sourceNote.title || 'Untitled'}”</Link> : null}
      {d.publicUrl ? <button type="button" onClick={copyPublic} className="inline-flex items-center gap-1 text-accent hover:underline"><Globe className="h-3 w-3" /> Public link</button> : null}
    </>
  )

  return (
    <div onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); upload(Array.from(e.dataTransfer.files)) }} className={cx('rounded-xl transition', drag && 'ring-2 ring-accent ring-offset-4 ring-offset-bg')}>
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Link href="/tasks" className="mr-auto inline-flex items-center gap-1 text-[12.5px] text-fg-3 hover:text-fg"><ArrowLeft className="h-3.5 w-3.5" /> Tasks</Link>
        <select value={status} onChange={(e) => setTo(e.target.value)} className="h-8 rounded-[9px] border border-border bg-surface px-2 text-[12.5px]" aria-label="Status">{STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
        <Button size="sm" variant={done ? 'secondary' : 'primary'} onClick={() => setTo(done ? 'open' : 'done')}><Check className="h-3.5 w-3.5" /> {done ? 'Reopen' : 'Mark done'}</Button>
        <Button size="sm" variant="secondary" onClick={() => setEdit(true)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
        <Button size="sm" variant={d.publicUrl ? 'secondary' : 'ghost'} onClick={() => setShare(true)} title="Anyone with the link can see this task"><Globe className="h-3.5 w-3.5" /> {d.publicUrl ? 'Public' : 'Share'}</Button>
        <Button size="sm" variant="ghost" onClick={remove} title="Delete task"><Trash2 className="h-3.5 w-3.5 text-danger" /></Button>
      </div>
      {done ? <Badge tone="success" className="mb-2">Done{t.completedAt ? ` · ${relativeTime(t.completedAt)}` : ''}</Badge> : status === 'dropped' ? <Badge className="mb-2">Dropped</Badge> : null}
      <div className="task-editor"><NoteEditor key={t.updatedAt} noteId={t.id} target="task" initialTitle={t.title} initialContent={t.details ?? { type: 'doc', content: [{ type: 'paragraph' }] }} placeholder="Add details: what, why, links, checklists. Paste or drop images and files anywhere on this page." meta={meta} /></div>

      <section className="mt-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Files and media <span className="font-normal">{d.attachments.length || ''}</span></h2>
          <div className="flex items-center gap-2">
            {uploading ? <span className="text-[12px] text-fg-3">Uploading {uploading}…</span> : null}
            <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => { upload(Array.from(e.target.files ?? [])); e.target.value = '' }} />
            <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}><Upload className="h-3.5 w-3.5" /> Add files</Button>
          </div>
        </div>
        {d.attachments.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-5 text-center text-[13px] text-fg-3">Images, screenshots, voice notes, video, PDFs, spreadsheets: drop them here or use Add files. Images pasted into the details above land here too.</p> : null}
        {images.length ? <div className="grid gap-3 sm:grid-cols-2">{images.map((a) => (
          <figure key={a.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface">
            <a href={url(a.id)} target="_blank" rel="noreferrer"><img src={url(a.id)} alt={a.name} className="max-h-[360px] w-full object-contain" /></a>
            <figcaption className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-fg-3"><span className="min-w-0 flex-1 truncate">{a.name}</span><span>{formatSize(a.size)}</span><button type="button" onClick={() => removeAttachment(a.id, a.name)} className="rounded p-0.5 hover:text-danger" aria-label={`Remove ${a.name}`}><X className="h-3.5 w-3.5" /></button></figcaption>
          </figure>
        ))}</div> : null}
        {media.length ? <div className="mt-3 space-y-3">{media.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-surface p-3">
            <div className="mb-2 flex items-center gap-2 text-[12.5px] text-fg-2"><span className="min-w-0 flex-1 truncate">{a.name}</span><span className="text-fg-3">{formatSize(a.size)}</span><button type="button" onClick={() => removeAttachment(a.id, a.name)} className="rounded p-0.5 text-fg-3 hover:text-danger" aria-label={`Remove ${a.name}`}><X className="h-3.5 w-3.5" /></button></div>
            {a.mime.startsWith('video/') ? <video controls preload="metadata" src={url(a.id)} className="max-h-[420px] w-full rounded-lg bg-black" /> : <audio controls preload="metadata" src={url(a.id)} className="w-full" />}
          </div>
        ))}</div> : null}
        {files.length ? <ul className="mt-3 divide-y divide-border rounded-xl border border-border">{files.map((a) => (
          <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-[13.5px]">
            <Paperclip className="h-3.5 w-3.5 text-fg-3" />
            <a href={url(a.id)} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:text-accent">{a.name}</a>
            <span className="text-[12px] text-fg-3">{formatSize(a.size)}</span>
            <a href={url(a.id)} target="_blank" rel="noreferrer" className="rounded p-0.5 text-fg-3 hover:text-fg" aria-label="Open"><ExternalLink className="h-3.5 w-3.5" /></a>
            <button type="button" onClick={() => removeAttachment(a.id, a.name)} className="rounded p-0.5 text-fg-3 hover:text-danger" aria-label={`Remove ${a.name}`}><X className="h-3.5 w-3.5" /></button>
          </li>
        ))}</ul> : null}
      </section>

      {d.publicUrl ? (
        <div className="mt-8 flex flex-wrap items-center gap-2 rounded-xl border border-accent-soft-2 bg-accent-soft/40 px-3 py-2 text-[13px]">
          <Globe className="h-4 w-4 text-accent" /><span className="text-fg-2">Anyone with this link can see the task:</span>
          <code className="min-w-0 flex-1 truncate text-[12.5px]">{d.publicUrl}</code>
          <Button size="sm" variant="ghost" onClick={copyPublic}><Copy className="h-3.5 w-3.5" /> Copy</Button>
          <Button size="sm" variant="ghost" onClick={() => setShare(true)}>Manage</Button>
        </div>
      ) : null}

      {edit ? <TaskEditor task={{ id: t.id, title: t.title, owner: t.owner, dueAt: t.dueAt, priority: t.priority }} onClose={() => setEdit(false)} /> : null}
      <ShareDialog taskId={t.id} open={share} onClose={() => { setShare(false); router.refresh() }} />
    </div>
  )
}
