'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FileUp, Upload, X, CheckCircle2, AlertTriangle, Loader2, ExternalLink, RefreshCw } from 'lucide-react'
import { Button, useToast } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { api } from '@/lib/client'
import { cx } from '@/lib/util'
import { setShell, useShell } from '@/components/shell/store'
import { DOCUMENT_ACCEPT, MAX_DOCUMENT_BYTES } from '@/lib/documents/constants'

type Stage = 'queued' | 'uploading' | 'extracting' | 'filing' | 'done' | 'failed'
interface Item { key: string; file: File; stage: Stage; progress: number; noteId?: string; title?: string; error?: string; words?: number; method?: string | null }
interface Ctx { id: string; name: string }
interface Status { noteId: string; title: string; stage: Exclude<Stage, 'queued'>; error: string | null; words: number; method: string | null }

const STAGE_LABEL: Record<Stage, string> = { queued: 'Waiting', uploading: 'Uploading', extracting: 'Extracting text', filing: 'AI is filing it', done: 'Done', failed: 'Failed' }
const CHUNK = 3 * 1024 * 1024

function fmtSize(n: number) {
  return n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}

/** Header button: opens the shared dialog. */
export function UploadDocumentsButton({ label = 'Upload documents', size = 'md' }: { label?: string; size?: 'sm' | 'md' }) {
  return (
    <Button variant="secondary" size={size} onClick={() => setShell({ uploadOpen: true })}>
      <FileUp className="h-4 w-4" /> {label}
    </Button>
  )
}

/** Mounted once in the shell; the command bar, Inbox, Notes and Settings open it. */
export function GlobalUploadDocuments() {
  const { uploadOpen } = useShell()
  const close = React.useCallback(() => setShell({ uploadOpen: false }), [])
  if (!uploadOpen) return null
  return <UploadDocumentsDialog onClose={close} />
}

export function UploadDocumentsDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const toast = useToast()
  const [items, setItems] = React.useState<Item[]>([])
  const [contexts, setContexts] = React.useState<Ctx[]>([])
  const [contextId, setContextId] = React.useState('')
  const [dragging, setDragging] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const alive = React.useRef(true)
  React.useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  React.useEffect(() => {
    api<{ contexts: Ctx[] } | Ctx[]>('/api/contexts').then((r) => setContexts(Array.isArray(r) ? r : r.contexts ?? [])).catch(() => undefined)
  }, [])

  const patch = (key: string, p: Partial<Item>) => setItems((list) => list.map((it) => (it.key === key ? { ...it, ...p } : it)))

  const add = (files: File[]) => {
    const fresh: Item[] = []
    for (const f of files) {
      if (f.size > MAX_DOCUMENT_BYTES) { toast.push({ text: `${f.name} is larger than ${Math.round(MAX_DOCUMENT_BYTES / 1048576)} MB`, tone: 'danger' }); continue }
      if (f.size === 0) continue
      fresh.push({ key: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2, 7)}`, file: f, stage: 'queued', progress: 0 })
    }
    setItems((list) => [...list, ...fresh])
  }

  const poll = async (key: string, noteId: string) => {
    for (let i = 0; i < 400 && alive.current; i++) {
      try {
        const s = await api<Status>(`/api/documents/${noteId}`)
        patch(key, { stage: s.stage, title: s.title, error: s.error ?? undefined, words: s.words, method: s.method })
        if (s.stage === 'done' || s.stage === 'failed') return
      } catch {
        /* keep polling */
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  const uploadOne = async (it: Item) => {
    patch(it.key, { stage: 'uploading', progress: 0 })
    const start = await api<{ noteId: string; attachmentId: string; chunkSize: number }>('/api/documents/upload', { method: 'POST', json: { name: it.file.name, mime: it.file.type, size: it.file.size, contextId: contextId || undefined, lastModified: it.file.lastModified } })
    patch(it.key, { noteId: start.noteId })
    const size = start.chunkSize || CHUNK
    for (let offset = 0; offset < it.file.size; offset += size) {
      const last = offset + size >= it.file.size
      const res = await fetch(`/api/documents/upload/${start.attachmentId}`, { method: 'PUT', body: it.file.slice(offset, Math.min(offset + size, it.file.size)), headers: { 'Content-Type': 'application/octet-stream', 'x-chunk-last': last ? '1' : '0' } })
      if (!res.ok) throw new Error((await res.json().catch(() => ({ error: 'Upload failed' }))).error ?? 'Upload failed')
      patch(it.key, { progress: Math.min(100, Math.round(((offset + size) / it.file.size) * 100)) })
    }
    await api(`/api/documents/upload/${start.noteId}`, { method: 'POST' })
    patch(it.key, { stage: 'extracting', progress: 100 })
    await poll(it.key, start.noteId)
  }

  const run = async () => {
    const queued = items.filter((i) => i.stage === 'queued')
    if (!queued.length) return
    setRunning(true)
    let ok = 0
    for (const it of queued) {
      try {
        await uploadOne(it)
        ok++
      } catch (e) {
        patch(it.key, { stage: 'failed', error: String((e as Error).message ?? e) })
      }
    }
    setRunning(false)
    if (ok) { toast.push({ text: `${ok} document${ok === 1 ? '' : 's'} added as notes.`, tone: 'success' }); router.refresh() }
  }

  const retry = async (it: Item) => {
    if (!it.noteId) { patch(it.key, { stage: 'queued', error: undefined }); return }
    patch(it.key, { stage: 'extracting', error: undefined })
    try {
      await api(`/api/documents/${it.noteId}`, { method: 'POST' })
      await poll(it.key, it.noteId)
      router.refresh()
    } catch (e) {
      patch(it.key, { stage: 'failed', error: String((e as Error).message ?? e) })
    }
  }

  const queued = items.filter((i) => i.stage === 'queued').length
  const busy = running || items.some((i) => i.stage === 'uploading' || i.stage === 'extracting' || i.stage === 'filing')

  return (
    <Dialog title="Upload documents" onClose={onClose} wide>
      <p className="mb-3 text-[13px] text-fg-2">Each file becomes a note: the text is extracted, the original stays attached, and AI files people, numbers, tasks and decisions the way it does for anything you write. PDF, Word, Excel, CSV, web pages, text, and scans or photos of documents.</p>
      <div
        className={cx('rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors', dragging ? 'border-accent bg-accent-soft/40' : 'border-border-2')}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add(Array.from(e.dataTransfer.files)) }}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-fg-3" />
        <p className="text-[14px]">Drop files here</p>
        <p className="mt-1 text-[12.5px] text-fg-3">pdf, docx, xlsx, csv, html, txt, md, png, jpg — up to {Math.round(MAX_DOCUMENT_BYTES / 1048576)} MB each</p>
        <Button className="mt-3" onClick={() => fileRef.current?.click()}>Choose files</Button>
        <input ref={fileRef} type="file" multiple accept={DOCUMENT_ACCEPT} className="hidden" onChange={(e) => { add(Array.from(e.target.files ?? [])); e.target.value = '' }} />
      </div>
      {items.length ? (
        <ul className="mt-3 divide-y divide-border rounded-xl border border-border">
          {items.map((it) => (
            <li key={it.key} className="flex items-start gap-3 px-3 py-2.5 text-[13.5px]">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                {it.stage === 'done' ? <CheckCircle2 className="h-4 w-4 text-success" /> : it.stage === 'failed' ? <AlertTriangle className="h-4 w-4 text-danger" /> : it.stage === 'queued' ? <span className="h-2 w-2 rounded-full bg-border-2" /> : <Loader2 className="h-4 w-4 animate-spin text-accent" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  {it.noteId ? <Link href={`/notes/${it.noteId}`} className="truncate font-medium hover:text-accent" onClick={onClose}>{it.title || it.file.name}</Link> : <span className="truncate font-medium">{it.file.name}</span>}
                  <span className="text-[12px] text-fg-3">{fmtSize(it.file.size)}</span>
                </div>
                <div className="mt-0.5 text-[12.5px] text-fg-3">
                  {it.stage === 'uploading' ? `Uploading ${it.progress}%` : STAGE_LABEL[it.stage]}
                  {it.stage === 'done' && it.words ? ` · ${it.words.toLocaleString()} words${it.method ? ` · ${it.method === 'pdf-ai' || it.method === 'image-ai' ? 'read by the model' : it.method}` : ''}` : ''}
                  {it.stage === 'failed' && it.error ? <span className="text-danger"> · {it.error}</span> : null}
                </div>
                {it.stage === 'uploading' ? <div className="mt-1.5 h-1 w-full overflow-hidden rounded bg-surface-3"><div className="h-full bg-accent transition-all" style={{ width: `${it.progress}%` }} /></div> : null}
              </div>
              {it.stage === 'queued' ? <button className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={() => setItems((l) => l.filter((x) => x.key !== it.key))} aria-label="Remove"><X className="h-4 w-4" /></button> : null}
              {it.stage === 'failed' ? <button className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={() => void retry(it)} title="Try again"><RefreshCw className="h-4 w-4" /></button> : null}
              {it.stage === 'done' && it.noteId ? <Link href={`/notes/${it.noteId}`} className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={onClose} title="Open the note"><ExternalLink className="h-4 w-4" /></Link> : null}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <select value={contextId} onChange={(e) => setContextId(e.target.value)} className="h-9 rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px]" disabled={busy}>
          <option value="">Into the current context</option>
          {contexts.map((c) => <option key={c.id} value={c.id}>into {c.name}</option>)}
        </select>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose}>{busy ? 'Continue in background' : 'Close'}</Button>
          <Button variant="primary" loading={running} disabled={!queued || running} onClick={run}>Upload {queued ? `${queued} file${queued === 1 ? '' : 's'}` : ''}</Button>
        </div>
      </div>
      {busy ? <p className="mt-2 text-[12px] text-fg-3">You can close this; extraction and filing keep running and the notes appear in your Inbox.</p> : null}
    </Dialog>
  )
}
