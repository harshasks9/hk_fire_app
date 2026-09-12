import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { listDecisions } from '@/lib/queries'
import { DecisionCard } from '@/components/entities'
export const dynamic = 'force-dynamic'
export default async function DecisionsPage() {
  const ctx = await getActiveContext()
  const items = await listDecisions(ctx.id)
  const open = items.filter((d) => d.status === 'revisited' || d.status === 'proposed')
  const rest = items.filter((d) => !open.includes(d))
  return (
    <Page>
      <PageHeader title="Decisions" subtitle="Institutional memory. Every decision keeps its history — including when later conversations contradict it." />
      {items.length === 0 ? <EmptyState title="No decisions recorded" description='Write "Decision: …" or "we agreed to …" in any note. Later notes that revisit it are linked automatically.' /> : (
        <>
          {open.length ? <section className="mb-8"><h2 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-warning">Unresolved or revisited</h2>{open.map((d) => <DecisionCard key={d.id} d={d} />)}</section> : null}
          <section><h2 className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">All decisions</h2>{rest.map((d) => <DecisionCard key={d.id} d={d} />)}</section>
        </>
      )}
    </Page>
  )
}
