import { getActiveScope } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { EntityList } from '@/components/entities/EntityList'
export const dynamic = 'force-dynamic'
export default async function PeoplePage() {
  const scope = await getActiveScope()
  const items = await listEntities(scope.ids, 'person')
  return <EntityList title="People" items={items} type="person" contextNames={scope.all ? Object.fromEntries(scope.contexts.map((c) => [c.id, c.name])) : undefined} emptyText="People pages appear automatically when someone is mentioned in a note or meeting." />
}
