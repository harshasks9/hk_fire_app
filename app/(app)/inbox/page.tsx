import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, Badge } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { listNotes } from '@/lib/queries'
import { NoteKindIcon, EntityIcon } from '@/components/entities'
import { relativeTime } from '@/lib/util'
import { InboxActions } from '@/components/notes/InboxActions'
import { Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

const SOURCE_LABEL: Record<string, string> = { 'quick-capture': 'Quick capture', voice: 'Voice note', share: 'Shared link', upload: 'Upload', email: 'Email', transcript: 'Meeting transcript', seed: 'Sample' }

export default async function InboxPage() {
  const ctx = await getActiveContext()
  const items = await listNotes(ctx.id, { inbox: true, limit: 80 })
  return (
    <Page>
      <PageHeader title="Inbox" subtitle="Everything you capture lands here and is filed automatically. Nothing to triage — this is a record of what AI did." actions={<InboxActions />} />
      {items.length === 0 ? (
        <EmptyState title="Inbox is clear" description="Quick capture (⌘⇧N), voice notes, links, screenshots and transcripts appear here as they are processed." />
      ) : (
        <ul className="divide-y divide-border">
          {items.map((n) => (
            <li key={n.id} className="py-3">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-2"><NoteKindIcon kind={n.kind} className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <Link href={`/notes/${n.id}`} className="text-[14.5px] font-medium hover:text-accent">{n.title || (n.preview ? n.preview.slice(0, 80) : 'Untitled')}</Link>
                    <span className="text-[12px] text-fg-3">{SOURCE_LABEL[n.source] ?? n.source} · {relativeTime(n.createdAt)}</span>
                    {n.status === 'inbox' || n.status === 'processing' ? <Badge tone="accent">{n.status === 'processing' ? 'AI processing…' : 'queued'}</Badge> : null}
                  </div>
                  {n.title && n.preview ? <p className="mt-0.5 line-clamp-2 text-[13px] text-fg-2">{n.preview}</p> : null}
                  {n.status === 'processed' ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px] text-fg-3">
                      <Sparkles className="h-3 w-3 text-accent" />
                      {n.entities.length ? (
                        <>
                          <span>Filed under</span>
                          {n.entities.map((e) => <Link key={e.id} href={e.type === 'person' ? `/people/${e.id}` : e.type === 'company' ? `/companies/${e.id}` : `/topics/${e.id}`} className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-fg-2 hover:text-fg"><EntityIcon type={e.type} className="h-2.5 w-2.5" />{e.name}</Link>)}
                        </>
                      ) : <span>Processed — no entities detected</span>}
                      {n.summary?.actions.length ? <span>· {n.summary.actions.length} action{n.summary.actions.length === 1 ? '' : 's'}</span> : null}
                      {n.summary?.decisions.length ? <span>· {n.summary.decisions.length} decision{n.summary.decisions.length === 1 ? '' : 's'}</span> : null}
                      {n.summary?.numbers.length ? <span>· {n.summary.numbers.length} number{n.summary.numbers.length === 1 ? '' : 's'}</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Page>
  )
}
