import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { listTags, untaggedNoteIds } from '@/lib/tags'
import { TagBackfill } from '@/components/notes/TagBackfill'
import { TagCloud } from '@/components/tags/TagCloud'
import { Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const scope = await getActiveScope()
  const ctx = { name: scope.label }
  const tags = await listTags(scope.ids, { limit: 400 })
  const { remaining } = await untaggedNoteIds(scope.ids, 1)
  return (
    <Page>
      <PageHeader
        title="Tags"
        subtitle={`${tags.length} tags across ${ctx.name} — derived from the content of every note as it is read, plus the ones you add. Rename or remove any of them here.`}
        actions={<Link href="/graph?types=tag,person,company,topic,project" className="inline-flex items-center gap-1 text-[13px] text-accent hover:underline"><Share2 className="h-3.5 w-3.5" /> See tags in the graph</Link>}
      />
      {remaining > 0 ? <TagBackfill remaining={remaining} /> : null}
      {tags.length === 0 ? (
        <EmptyState title="No tags yet" description="Tags are generated automatically when a note is read by AI. Write or capture something and they appear here." />
      ) : (
        <TagCloud tags={tags} />
      )}
      <p className="mt-8 text-[12.5px] text-fg-3">Tip: in search, type <code className="rounded bg-surface-2 px-1">tag:pricing</code> or <code className="rounded bg-surface-2 px-1">#pricing</code> to filter, optionally with more words.</p>
    </Page>
  )
}
