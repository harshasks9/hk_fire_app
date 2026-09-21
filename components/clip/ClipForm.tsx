'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Scissors, Check, ExternalLink, X, Globe } from 'lucide-react'
import { Button, Input, Textarea, useToast } from '@/components/ui'
import { api } from '@/lib/client'

interface Props { initialUrl: string; initialTitle: string; initialText: string; contexts: { id: string; name: string }[]; activeContextId: string; popup: boolean; via: 'bookmarklet' | 'share' | 'page' }

type Done = { id: string; title: string; fetched: boolean; words: number; error: string | null }

export function ClipForm({ initialUrl, initialTitle, initialText, contexts, activeContextId, popup, via }: Props) {
  const router = useRouter()
  const toast = useToast()
  const [url, setUrl] = React.useState(initialUrl)
  const [title, setTitle] = React.useState(initialTitle)
  const [selection, setSelection] = React.useState(initialText)
  const [comment, setComment] = React.useState('')
  const [contextId, setContextId] = React.useState(activeContextId)
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState<Done | null>(null)
  const auto = React.useRef(false)
  const validUrl = /^https?:\/\/\S+$/i.test(url.trim())

  const submit = React.useCallback(async () => {
    if (!validUrl || busy) return
    setBusy(true)
    try {
      const r = await api<Done>('/api/clip', { method: 'POST', json: { url: url.trim(), title, selection, comment, contextId, via } })
      setDone(r)
      if (!popup) { router.push(`/notes/${r.id}`); router.refresh() }
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }, [validUrl, busy, url, title, selection, comment, contextId, via, popup, router, toast])

  // Shared from another app with nothing to add: file it straight away, the way a share sheet is expected to behave.
  React.useEffect(() => {
    if (auto.current) return
    auto.current = true
    if (via === 'share' && validUrl && !initialText) void submit()
  }, [via, validUrl, initialText, submit])

  let host = ''
  try { host = new URL(url).hostname.replace(/^www\./, '') } catch { host = '' }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5" data-testid="clip-done">
        <div className="mb-2 flex items-center gap-2 text-[15px] font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success"><Check className="h-4 w-4" /></span> Clipped</div>
        <p className="text-[14px]">{done.title}</p>
        <p className="mt-1 text-[12.5px] text-fg-3">{done.fetched && done.words ? `${done.words.toLocaleString()} words saved to your Inbox. AI is filing it.` : done.error ? `${done.error}. The link and your notes were saved; open the note to read it there.` : 'The link was saved to your Inbox.'}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={`/notes/${done.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[13px] font-medium text-white hover:bg-accent-2" target={popup ? '_blank' : undefined}><ExternalLink className="h-3.5 w-3.5" /> Open note</Link>
          {popup ? <Button onClick={() => window.close()}><X className="h-3.5 w-3.5" /> Close</Button> : <Button onClick={() => { setDone(null); setUrl(''); setTitle(''); setSelection(''); setComment('') }}>Clip another</Button>}
        </div>
      </div>
    )
  }

  return (
    <form className="rounded-2xl border border-border bg-surface p-5" onSubmit={(e) => { e.preventDefault(); void submit() }} data-testid="clip-form">
      <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3"><Scissors className="h-3.5 w-3.5 text-accent" /> Clip to Notes</div>
      <label className="block text-[12.5px] font-medium text-fg-2">Web address</label>
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" autoFocus={!initialUrl} className="mt-1" aria-label="Web address" />
      {host ? <p className="mt-1 inline-flex items-center gap-1 text-[12px] text-fg-3"><Globe className="h-3 w-3" /> {host}</p> : null}
      <label className="mt-3 block text-[12.5px] font-medium text-fg-2">Title <span className="font-normal text-fg-3">(the page&apos;s own headline is used when it can be read)</span></label>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Optional" className="mt-1" aria-label="Title" />
      {selection ? (
        <>
          <label className="mt-3 block text-[12.5px] font-medium text-fg-2">Selected text</label>
          <Textarea value={selection} onChange={(e) => setSelection(e.target.value)} rows={4} className="mt-1" aria-label="Selected text" />
        </>
      ) : null}
      <label className="mt-3 block text-[12.5px] font-medium text-fg-2">Your note</label>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Why this matters, what to do with it…" className="mt-1" aria-label="Your note" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); void submit() } }} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select value={contextId} onChange={(e) => setContextId(e.target.value)} className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[13px]" aria-label="Context">
          {contexts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button type="submit" variant="primary" loading={busy} disabled={!validUrl}><Scissors className="h-3.5 w-3.5" /> Clip</Button>
        {popup ? <Button type="button" variant="ghost" onClick={() => window.close()}>Cancel</Button> : null}
      </div>
      <p className="mt-3 text-[12px] text-fg-3">The readable article (headline, byline, text, tables) is saved into the note with a link to the source, then filed like any capture: people, tasks, numbers, tags.</p>
    </form>
  )
}
