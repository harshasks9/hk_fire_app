import { Page } from '@/components/shell/AppShell'
import { PageHeader } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { numbersFor, listEntityNames } from '@/lib/numbers'
import { NewFact } from '@/components/crud/editors'
import { NumbersDashboard } from '@/components/numbers/NumbersDashboard'

export const dynamic = 'force-dynamic'

export default async function NumbersPage({ searchParams }: { searchParams: Promise<{ all?: string }> }) {
  const { all } = await searchParams
  const scope = await getActiveScope()
  const ids = all === '1' ? scope.contexts.map((c) => c.id) : scope.ids
  const ctx = { name: all === '1' ? 'All' : scope.label }
  const [data, entities] = await Promise.all([numbersFor(ids), listEntityNames(ids)])
  return (
    <Page width="wide">
      <PageHeader title="Numbers" subtitle={`Every figure your notes mention in ${ctx.name}, what it is now, and how it moved. For your own calculations, add a /sheet to any note.`} actions={<NewFact entities={entities} />} />
      <NumbersDashboard data={data} />
    </Page>
  )
}
