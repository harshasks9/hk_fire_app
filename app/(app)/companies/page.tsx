import { getActiveContext } from '@/lib/context'
import { listEntities } from '@/lib/queries'
import { EntityList } from '@/components/entities/EntityList'
export const dynamic = 'force-dynamic'
export default async function CompaniesPage() {
  const ctx = await getActiveContext()
  const items = await listEntities(ctx.id, 'company')
  return <EntityList title="Companies" items={items} type="company" emptyText="Company pages build themselves from customer conversations, meetings and captures." />
}
