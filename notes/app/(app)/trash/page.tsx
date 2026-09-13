import { Page } from '@/components/shell/AppShell'
import { PageHeader } from '@/components/ui'
import { listTrash, TRASH_DAYS } from '@/lib/trash'
import { sessionContextIds } from '@/lib/tenant'
import { getContexts } from '@/lib/context'
import { TrashClient } from '@/components/notes/TrashClient'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Trash' }

export default async function TrashPage() {
  const [ids, contexts] = await Promise.all([sessionContextIds(), getContexts()])
  const items = await listTrash(ids)
  const ctxName = new Map(contexts.map((c) => [c.id, c.name]))
  return (
    <Page>
      <PageHeader title="Trash" subtitle={`Deleted notes stay here for ${TRASH_DAYS} days, then are removed for good along with everything extracted from them.`} />
      <TrashClient items={items.map((i) => ({ id: i.id, title: i.title, kind: i.kind, excerpt: i.excerpt, wordCount: i.wordCount, deletedAt: i.deletedAt.toISOString(), purgeAt: i.purgeAt.toISOString(), context: ctxName.get(i.contextId) ?? '' }))} />
    </Page>
  )
}
