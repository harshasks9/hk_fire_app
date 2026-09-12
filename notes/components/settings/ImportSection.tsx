'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileUp } from 'lucide-react'
import { Button, useToast } from '@/components/ui'

/** Import Markdown / text files or the app's JSON export into the active context. */
export function ImportSection({ contexts, activeContextId }: { contexts: { id: string; name: string }[]; activeContextId: string }) {
  const router = useRouter()
  const toast = useToast()
  const [files, setFiles] = React.useState<File[]>([])
  const [ctx, setCtx] = React.useState(activeContextId)
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<{ created: number; skipped: { name: string; reason: string }[] } | null>(null)
  const submit = async () => {
    if (!files.length) return
    setBusy(true); setResult(null)
    try {
      const fd = new FormData()
      for (const f of files) fd.append('files', f)
      fd.set('lastModified', files.map((f) => String(f.lastModified)).join(','))
      fd.set('contextId', ctx)
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const j = (await res.json()) as { error?: string; created?: number; skipped?: { name: string; reason: string }[] }
      if (!res.ok) throw new Error(j.error ?? 'Import failed')
      setResult({ created: j.created ?? 0, skipped: j.skipped ?? [] })
      setFiles([])
      toast.push({ text: `Imported ${j.created} note${j.created === 1 ? '' : 's'}. AI is filing them.`, tone: 'success' })
      router.refresh()
    } catch (e) {
      toast.push({ text: String((e as Error).message ?? e), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <section id="import">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><FileUp className="h-3.5 w-3.5" /> Import</h2>
      <p className="mb-3 text-[13.5px] text-fg-2">Bring notes in from Markdown or text files (Obsidian, Bear, Apple Notes exports, plain files) or from this app's own export. Titles and dates come from front matter or the first heading; duplicates are skipped; every note is analyzed like a new capture.</p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] font-medium hover:bg-surface-2"><Upload className="h-3.5 w-3.5" /> Choose files<input type="file" multiple accept=".md,.markdown,.txt,.json,text/markdown,text/plain,application/json" className="hidden" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} /></label>
        <select value={ctx} onChange={(e) => setCtx(e.target.value)} className="h-9 rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px]">{contexts.map((c) => <option key={c.id} value={c.id}>into {c.name}</option>)}</select>
        <Button variant="primary" loading={busy} disabled={!files.length} onClick={submit}>Import {files.length ? `${files.length} file${files.length === 1 ? '' : 's'}` : ''}</Button>
      </div>
      {files.length ? <p className="mt-2 text-[12.5px] text-fg-3">{files.slice(0, 6).map((f) => f.name).join(', ')}{files.length > 6 ? ` and ${files.length - 6} more` : ''}</p> : null}
      {result ? <div className="mt-3 rounded-xl border border-border p-3 text-[13px]"><div><strong>{result.created}</strong> imported{result.skipped.length ? `, ${result.skipped.length} skipped` : ''}.</div>{result.skipped.slice(0, 8).map((s, i) => <div key={i} className="text-fg-3">{s.name}: {s.reason}</div>)}</div> : null}
    </section>
  )
}
