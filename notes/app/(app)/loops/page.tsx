import { Page } from '@/components/shell/AppShell'
import { PageHeader, EmptyState, Section } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { listOpenLoops } from '@/lib/queries'
import { LoopRow } from '@/components/entities'
import { NewLoop } from '@/components/crud/editors'
export const dynamic = 'force-dynamic'
export default async function LoopsPage({ searchParams }: { searchParams: Promise<{ highlight?: string }> }) {
  const { highlight } = await searchParams
  const ctx = await getActiveContext()
  const loops = await listOpenLoops(ctx.id, { limit: 200, includeResolved: true })
  const open = loops.filter((l) => l.status === 'open')
  const promised = open.filter((l) => l.kind === 'promised')
  const waiting = open.filter((l) => l.kind === 'waiting')
  const other = open.filter((l) => l.kind !== 'promised' && l.kind !== 'waiting')
  const closed = loops.filter((l) => l.status !== 'open').slice(0, 20)
  return (
    <Page>
      <PageHeader title="Open loops" subtitle="Commitments detected in your notes that have not been resolved: what you promised, what you are waiting on, what needs a follow-up. Add your own too." actions={<NewLoop />} />
      {open.length === 0 && closed.length === 0 ? <EmptyState title="No open loops" description='Phrases like "I’ll send you…", "waiting on pricing approval" or "let’s come back to…" are tracked here automatically.' /> : (
        <>
          <Section title="You promised" count={promised.length}>{promised.length ? promised.map((l) => <LoopRow key={l.id} loop={l} highlight={highlight === l.id} />) : <p className="text-[13.5px] text-fg-3">Nothing owed.</p>}</Section>
          <Section title="Waiting on others" count={waiting.length}>{waiting.length ? waiting.map((l) => <LoopRow key={l.id} loop={l} highlight={highlight === l.id} />) : <p className="text-[13.5px] text-fg-3">Nothing pending.</p>}</Section>
          <Section title="Follow-ups & open questions" count={other.length}>{other.length ? other.map((l) => <LoopRow key={l.id} loop={l} highlight={highlight === l.id} />) : <p className="text-[13.5px] text-fg-3">None.</p>}</Section>
          {closed.length ? <Section title="Recently closed">{closed.map((l) => <LoopRow key={l.id} loop={l} />)}</Section> : null}
        </>
      )}
    </Page>
  )
}
