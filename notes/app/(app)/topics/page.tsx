import { getActiveContext } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { EntityList } from '@/components/entities/EntityList'
export const dynamic = 'force-dynamic'
export default async function TopicsPage() {
  const ctx = await getActiveContext()
  const items = [...(await listEntities(ctx.id, 'project')), ...(await listEntities(ctx.id, 'topic'))]
  return <EntityList title="Topics" subtitle={`${items.length} topics and projects · they emerge on their own`} items={items} type="topic" emptyText="Topics emerge from what you write about repeatedly. Nothing to tag." />
}
