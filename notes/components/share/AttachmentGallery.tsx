import { Paperclip } from 'lucide-react'

export interface AttachmentVM { id: string; name: string; mime: string; size: number; durationSeconds?: number | null }
export const formatSize = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${Math.round(n / 1e3)} KB` : `${n} B`)

/** Images, audio, video and files attached to a task or note, rendered inline (server-safe; no handlers). */
export function AttachmentGallery({ attachments, base, title = 'Attachments' }: { attachments: AttachmentVM[]; base: string; title?: string }) {
  if (!attachments.length) return null
  const url = (a: AttachmentVM) => `${base}/${a.id}`
  const images = attachments.filter((a) => a.mime.startsWith('image/'))
  const media = attachments.filter((a) => a.mime.startsWith('audio/') || a.mime.startsWith('video/'))
  const files = attachments.filter((a) => !images.includes(a) && !media.includes(a))
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{title} <span className="font-normal">{attachments.length}</span></h2>
      {images.length ? <div className="grid gap-3 sm:grid-cols-2">{images.map((a) => <a key={a.id} href={url(a)} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-border bg-surface"><img src={url(a)} alt={a.name} className="max-h-[420px] w-full object-contain" /><span className="block truncate px-3 py-1.5 text-[12px] text-fg-3">{a.name}</span></a>)}</div> : null}
      {media.length ? <div className="mt-3 space-y-3">{media.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 truncate text-[12.5px] text-fg-2">{a.name} <span className="text-fg-3">· {formatSize(a.size)}</span></div>
          {a.mime.startsWith('video/') ? <video controls preload="metadata" src={url(a)} className="max-h-[420px] w-full rounded-lg bg-black" /> : <audio controls preload="metadata" src={url(a)} className="w-full" />}
        </div>
      ))}</div> : null}
      {files.length ? <ul className="mt-3 divide-y divide-border rounded-xl border border-border">{files.map((a) => <li key={a.id}><a href={url(a)} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 text-[13.5px] hover:bg-surface-2"><Paperclip className="h-3.5 w-3.5 text-fg-3" /><span className="min-w-0 flex-1 truncate">{a.name}</span><span className="text-[12px] text-fg-3">{formatSize(a.size)}</span></a></li>)}</ul> : null}
    </section>
  )
}
