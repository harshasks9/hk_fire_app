import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { listTags, untaggedNoteIds } from '@/lib/tags'
import { TagBackfill } from '@/components/notes/TagBackfill'
import { tagHref } from '@/lib/tag-href'
import { Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const ctx = await getActiveContext()
  const tags = await listTags([ctx.id], { limit: 400 })
  const { remaining } = await untaggedNoteIds([ctx.id], 1)
  const max = tags[0]?.count ?? 1
  return (
    <Page>
      <PageHeader
        title="Tags"
        subtitle={`${tags.length} tags across ${ctx.name} — derived from the content of every note as it is read, plus the ones you add.`}
        actions={<Link href="/graph?types=tag,person,company,topic,project" className="inline-flex items-center gap-1 text-[13px] text-accent hover:underline"><Share2 className="h-3.5 w-3.5" /> See tags in the graph</Link>}
      />
      {remaining > 0 ? <TagBackfill remaining={remaining} /> : null}
      {tags.length === 0 ? (
        <EmptyState title="No tags yet" description="Tags are generated automatically when a note is read by AI. Write or capture something and they appear here." />
      ) : (
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {tags.map((t) => {
            const size = 12 + Math.round((Math.log(t.count + 1) / Math.log(max + 1)) * 12)
            return (
              <Link key={t.tag} href={tagHref(t.tag)} className="inline-flex items-baseline gap-1 rounded-md px-1.5 py-0.5 text-fg-2 hover:bg-accent-soft hover:text-accent" style={{ fontSize: `${size}px` }}>
                <span className="text-fg-3">#</span>{t.tag}<span className="text-[11px] text-fg-3">{t.count}</span>
              </Link>
            )
          })}
        </div>
      )}
      <p className="mt-8 text-[12.5px] text-fg-3">Tip: in search, type <code className="rounded bg-surface-2 px-1">tag:pricing</code> or <code className="rounded bg-surface-2 px-1">#pricing</code> to filter, optionally with more words.</p>
    </Page>
  )
}
