import { getActiveScope } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { EntityList } from '@/components/entities/EntityList'
export const dynamic = 'force-dynamic'
export default async function CompaniesPage() {
  const scope = await getActiveScope()
  const items = await listEntities(scope.ids, 'company')
  return <EntityList title="Companies" items={items} type="company" contextNames={scope.all ? Object.fromEntries(scope.contexts.map((c) => [c.id, c.name])) : undefined} emptyText="Company pages build themselves from customer conversations, meetings and captures." />
}
