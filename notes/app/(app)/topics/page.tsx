import { getActiveScope } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { EntityList } from '@/components/entities/EntityList'
export const dynamic = 'force-dynamic'
export default async function TopicsPage() {
  const scope = await getActiveScope()
  const items = [...(await listEntities(scope.ids, 'project')), ...(await listEntities(scope.ids, 'topic'))]
  return <EntityList title="Topics" subtitle={`${items.length} topics and projects · they emerge on their own`} items={items} type="topic" contextNames={scope.all ? Object.fromEntries(scope.contexts.map((c) => [c.id, c.name])) : undefined} emptyText="Topics emerge from what you write about repeatedly. Nothing to tag." />
}
