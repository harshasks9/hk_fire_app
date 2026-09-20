import { notFound } from 'next/navigation'
import { DocView } from '@/components/share/DocView'
import { AttachmentGallery } from '@/components/share/AttachmentGallery'
import { resolveShareToken } from '@/lib/share'
import { ensureReady } from '@/lib/bootstrap'
import { formatDate } from '@/lib/util'
import type { PMNode } from '@/lib/markdown'
import { CheckSquare, CalendarDays, User, Flag } from 'lucide-react'
export const dynamic = 'force-dynamic'

/** Public, read-only view of a shared note or task. No navigation, no AI content; attachments come through the token. */
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  await ensureReady()
  const { token } = await params
  const r = await resolveShareToken(token)
  if (!r) notFound()
  const assetBase = `/s/${token}/a`
  const head = <div className="mb-8 flex items-center gap-2 text-[12.5px] text-fg-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-accent-fg">N</span> Shared from Notes{r.ownerName ? ` by ${r.ownerName}` : ''} · {r.notebookName}</div>
  if (r.kind === 'task') {
    const t = r.task
    const done = t.status === 'done'
    return (
      <main className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
        {head}
        <div className="mb-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium uppercase tracking-[0.06em] text-fg-3"><CheckSquare className="h-3.5 w-3.5" /> Task</div>
        <h1 className={`text-[30px] font-semibold leading-tight tracking-[-0.02em] ${done ? 'text-fg-3 line-through' : ''}`}>{t.title}</h1>
        <div className="mb-8 mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13.5px] text-fg-2">
          <span className="inline-flex items-center gap-1.5"><span className={`inline-block h-2 w-2 rounded-full ${done ? 'bg-success' : t.status === 'dropped' ? 'bg-fg-3' : 'bg-accent'}`} />{t.status === 'done' ? 'Done' : t.status === 'waiting' ? 'Waiting' : t.status === 'delegated' ? 'Delegated' : t.status === 'dropped' ? 'Dropped' : 'Open'}</span>
          <span className="inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-fg-3" />{t.owner}</span>
          {t.dueAt ? <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-fg-3" />Due {formatDate(t.dueAt, { month: 'long', day: 'numeric', year: 'numeric' })}</span> : null}
          {t.priority !== 'normal' ? <span className="inline-flex items-center gap-1.5"><Flag className="h-3.5 w-3.5 text-fg-3" />{t.priority}</span> : null}
          {r.entityName ? <span className="text-fg-3">· {r.entityName}</span> : null}
        </div>
        {t.details ? <DocView doc={t.details as PMNode} assetBase={assetBase} /> : <p className="text-[14px] text-fg-3">No details yet.</p>}
        <AttachmentGallery attachments={r.attachments} base={assetBase} />
        <footer className="mt-14 border-t border-border pt-4 text-[12px] text-fg-3">Read-only · created {formatDate(t.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}. The owner can revoke this link at any time.</footer>
      </main>
    )
  }
  const { note } = r
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
      {head}
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">{note.title || 'Untitled'}</h1>
      <p className="mb-8 mt-2 text-[13px] text-fg-3">{formatDate(note.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}{note.updatedAt.getTime() - note.createdAt.getTime() > 86400 * 1000 ? ` · updated ${formatDate(note.updatedAt, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}</p>
      <DocView doc={note.contentJson as PMNode} assetBase={assetBase} />
      <footer className="mt-14 border-t border-border pt-4 text-[12px] text-fg-3">Read-only. The owner can revoke this link at any time.</footer>
    </main>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  await ensureReady()
  const r = await resolveShareToken(token, { countView: false }).catch(() => null)
  const title = r ? (r.kind === 'task' ? `${r.task.title} · Shared task` : `${r.note.title || 'Untitled'} · Shared note`) : 'Shared'
  return { title, robots: { index: false, follow: false } }
}
