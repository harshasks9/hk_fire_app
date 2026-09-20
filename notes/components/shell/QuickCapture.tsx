'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Paperclip, Mic, Link2, Image as ImageIcon, X, Zap } from 'lucide-react'
import { setShell, useShell } from './store'
import { useToast } from '@/components/ui'
import { cx } from '@/lib/util'
import { enqueueCapture, isNetworkError, useOffline } from '@/lib/offline/sync'

/** Option/Alt+Space (inside the app) or ⌘⇧N. Type, paste a URL or image, drop a file, press Enter. Done. */
export function QuickCapture() {
  const { captureOpen } = useShell()
  const { online } = useOffline()
  const router = useRouter()
  const toast = useToast()
  const [text, setText] = React.useState('')
  const [files, setFiles] = React.useState<File[]>([])
  const [busy, setBusy] = React.useState(false)
  const ref = React.useRef<HTMLTextAreaElement>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (captureOpen) setTimeout(() => ref.current?.focus(), 10)
    else { setText(''); setFiles([]) }
  }, [captureOpen])

  const close = () => setShell({ captureOpen: false })

  const keepForLater = async () => {
    await enqueueCapture({ text, files })
    toast.push({ text: 'Saved on this device. It will be filed when you are back online.', tone: 'success' })
    close()
  }

  const submit = async () => {
    if (!text.trim() && !files.length) return
    setBusy(true)
    try {
      if (!navigator.onLine) { await keepForLater(); return }
      const fd = new FormData()
      fd.set('text', text)
      for (const f of files) fd.append('files', f)
      const res = await fetch('/api/capture', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Capture failed')
      toast.push({ text: 'Captured. AI is filing it.', tone: 'success' })
      close()
      router.refresh()
    } catch (e) {
      // The request never reached the server: keep it locally and replay later.
      if (isNetworkError(e)) { await keepForLater(); return }
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(false)
    }
  }

  const onPaste = (e: React.ClipboardEvent) => {
    const items = [...e.clipboardData.items]
    const imgs = items.filter((i) => i.type.startsWith('image/')).map((i) => i.getAsFile()).filter((f): f is File => Boolean(f))
    if (imgs.length) { e.preventDefault(); setFiles((f) => [...f, ...imgs]) }
  }

  if (!captureOpen) return null
  const isUrl = /^https?:\/\/\S+$/.test(text.trim())
  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center bg-black/20 px-3 pt-[16vh] backdrop-blur-[2px]" onMouseDown={close}>
      <div className="animate-pop w-full max-w-[560px] overflow-hidden rounded-2xl border border-border bg-surface shadow-pop" onMouseDown={(e) => e.stopPropagation()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); setFiles((f) => [...f, ...Array.from(e.dataTransfer.files)]) }}>
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-3"><Zap className="h-3.5 w-3.5 text-accent" /> Quick capture{!online ? <span className="ml-1 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10.5px] normal-case tracking-normal text-warning">offline · saves on device</span> : null}</div>
          <button onClick={close} className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={onPaste}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder="Samsung wants additional 3% buffer…  or paste a link, screenshot, or drop a file"
          rows={3}
          className="w-full resize-none bg-transparent px-4 py-3 text-[15px] outline-none placeholder:text-fg-3"
        />
        {files.length ? (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 text-[12px]">
                {f.type.startsWith('image/') ? <ImageIcon className="h-3 w-3" /> : f.type.startsWith('audio/') ? <Mic className="h-3 w-3" /> : <Paperclip className="h-3 w-3" />}
                {f.name}
                <button onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} className="text-fg-3 hover:text-fg" aria-label="Remove"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <div className="flex items-center gap-1">
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => setFiles((f) => [...f, ...Array.from(e.target.files ?? [])])} />
            <IconBtn title="Attach file or screenshot" onClick={() => fileRef.current?.click()}><Paperclip className="h-4 w-4" /></IconBtn>
            <IconBtn title="Voice note" onClick={() => { close(); router.push('/capture/voice') }}><Mic className="h-4 w-4" /></IconBtn>
            {isUrl ? <span className="ml-1 inline-flex items-center gap-1 text-[12px] text-accent"><Link2 className="h-3.5 w-3.5" /> Link detected</span> : null}
          </div>
          <div className="flex items-center gap-2 text-[12px] text-fg-3">
            <span className="hidden sm:inline">AI files it for you</span>
            <button onClick={submit} disabled={busy || (!text.trim() && !files.length)} className={cx('inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-medium text-accent-fg disabled:opacity-40')}>
              {busy ? 'Capturing…' : 'Capture'} <span className="rounded bg-white/20 px-1 text-[10.5px]">↵</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IconBtn({ children, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className="rounded-md p-1.5 text-fg-3 hover:bg-surface-2 hover:text-fg">{children}</button>
}
