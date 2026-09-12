import { notFound } from 'next/navigation'
import { DocView } from '@/components/share/DocView'
import { resolveShareToken } from '@/lib/share'
import { ensureReady } from '@/lib/bootstrap'
import { formatDate } from '@/lib/util'
import type { PMNode } from '@/lib/markdown'
export const dynamic = 'force-dynamic'

/** Public, read-only view of a shared note. No navigation, no AI content, no attachments beyond images in the body. */
export default async function SharedNotePage({ params }: { params: Promise<{ token: string }> }) {
  await ensureReady()
  const { token } = await params
  const r = await resolveShareToken(token)
  if (!r) notFound()
  const { note, notebookName, ownerName } = r
  return (
    <main className="mx-auto w-full max-w-[720px] px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 flex items-center gap-2 text-[12.5px] text-fg-3"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[11px] font-bold text-accent-fg">N</span> Shared from Notes{ownerName ? ` by ${ownerName}` : ''} · {notebookName}</div>
      <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">{note.title || 'Untitled'}</h1>
      <p className="mb-8 mt-2 text-[13px] text-fg-3">{formatDate(note.createdAt, { month: 'long', day: 'numeric', year: 'numeric' })}{note.updatedAt.getTime() - note.createdAt.getTime() > 86400 * 1000 ? ` · updated ${formatDate(note.updatedAt, { month: 'long', day: 'numeric', year: 'numeric' })}` : ''}</p>
      <DocView doc={note.contentJson as PMNode} />
      <footer className="mt-14 border-t border-border pt-4 text-[12px] text-fg-3">Read-only. The owner can revoke this link at any time.</footer>
    </main>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  await ensureReady()
  const r = await resolveShareToken(token).catch(() => null)
  return { title: r ? `${r.note.title || 'Untitled'} · Shared note` : 'Shared note', robots: { index: false, follow: false } }
}
