import { getActiveContext } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { EntityList } from '@/components/entities/EntityList'
export const dynamic = 'force-dynamic'
export default async function PeoplePage() {
  const ctx = await getActiveContext()
  const items = await listEntities(ctx.id, 'person')
  return <EntityList title="People" items={items} type="person" emptyText="People pages appear automatically when someone is mentioned in a note or meeting." />
}
