import { desc, isNotNull } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { resolveDeviation } from '@/lib/actions'
import { Btn, Card, Chip, EmptyState, SectionTitle, money } from '@/components/ui'
import { Explain, PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

const RULE_LABELS: Record<string, string> = {
  delta_band: 'Outside 3–8 delta',
  novelty: 'Novelty trade',
  rescue_roll: 'Rescue roll',
  missed_week: 'Missed week',
  stop_not_taken: 'Stop not taken',
  gate_override: 'Gate override',
  credit_band: 'Credit outside band',
  blocked_name: 'Blocked name',
  blocked_side: 'Blocked side',
}

export default async function DeviationsPage() {
  const db = await getDb()
  const rows = await db.select().from(schema.deviations).orderBy(desc(schema.deviations.createdAt))
  const closedPositions = await db.select().from(schema.positions).where(isNotNull(schema.positions.closedAt))
  const resolvedProcess = closedPositions.filter((p) => !p.isDeviation && p.realisedPnl != null)
  const resolvedDeviation = closedPositions.filter((p) => p.isDeviation && p.realisedPnl != null)
  const sum = (xs: typeof closedPositions) => xs.reduce((s, p) => s + (p.realisedPnl ?? 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-semibold">
        <Explain entry={GLOSSARY.deviation}>Deviation</Explain> ledger <PageHelp entry={GLOSSARY.page_deviations} />
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        What the rule said, what happened, and the number. Seven of the eight losing positions in the 2026 record
        were deviations of one kind or another.
      </p>

      <SectionTitle>The monthly comparison</SectionTitle>
      <Card>
        <p className="tabular">
          <strong>Process trades: {money(sum(resolvedProcess))}</strong> across {resolvedProcess.length} positions.
          <br />
          <strong>Deviations: {money(sum(resolvedDeviation))}</strong> across {resolvedDeviation.length} positions.
        </p>
      </Card>

      <SectionTitle>Every departure from process</SectionTitle>
      {rows.length === 0 ? (
        <EmptyState title="No deviations recorded.">That is the point.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((d) => (
            <Card key={d.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Chip kind={d.outcomeUsd != null && d.outcomeUsd < 0 ? 'bad' : d.outcomeUsd != null ? 'good' : 'warn'}>
                  {RULE_LABELS[d.ruleBroken] ?? d.ruleBroken}
                </Chip>
                <span className="text-xs tabular" style={{ color: 'var(--muted)' }}>
                  {d.createdAt.toISOString().slice(0, 10)}
                  {d.seeded ? ' · seeded from record' : ''}
                </span>
              </div>
              <dl className="mt-2 grid gap-1 text-sm">
                <div>
                  <dt className="inline font-medium">Rule said: </dt>
                  <dd className="inline">{d.ruleSaid}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">What happened: </dt>
                  <dd className="inline">{d.actionTaken}</dd>
                </div>
                {d.reason ? (
                  <div>
                    <dt className="inline font-medium">Typed reason: </dt>
                    <dd className="inline">{d.reason}</dd>
                  </div>
                ) : null}
                <div>
                  <dt className="inline font-medium">Outcome: </dt>
                  <dd className="inline tabular">
                    {d.outcomeUsd != null ? (
                      <span style={{ color: d.outcomeUsd < 0 ? 'var(--bad)' : 'var(--good)' }}>{money(d.outcomeUsd)}</span>
                    ) : (
                      'unresolved'
                    )}
                  </dd>
                </div>
              </dl>
              {d.outcomeUsd == null && d.ruleBroken !== 'missed_week' ? (
                <form action={resolveDeviation} className="mt-2 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="deviationId" value={d.id} />
                  <label htmlFor={`out-${d.id}`} className="text-sm">
                    Resolve, $
                  </label>
                  <input id={`out-${d.id}`} name="outcomeUsd" type="number" step="0.01" className="w-32" />
                  <Btn>Record outcome</Btn>
                </form>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
