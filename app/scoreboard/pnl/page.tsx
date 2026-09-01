import { isNotNull } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { getSetting } from '@/lib/data'
import { BackLink, Card, SectionTitle, money } from '@/components/ui'
import { PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

export default async function PnlPage() {
  const db = await getDb()
  const closed = await db.select().from(schema.positions).where(isNotNull(schema.positions.closedAt))
  const resolved = closed.filter((p) => p.realisedPnl != null)
  const process = resolved.filter((p) => !p.isDeviation)
  const deviations = resolved.filter((p) => p.isDeviation)
  const sum = (xs: typeof resolved) => xs.reduce((s, p) => s + (p.realisedPnl ?? 0), 0)
  const unresolvedDeviations = closed.filter((p) => p.isDeviation && p.realisedPnl == null).length
  const baseline = await getSetting<{ netCredit: number; positions: number; winners: number }>('baseline2026')

  const byMonth = new Map<string, { process: number; deviation: number }>()
  for (const p of resolved) {
    const k = (p.closedAt ?? p.openedAt).toISOString().slice(0, 7)
    const row = byMonth.get(k) ?? { process: 0, deviation: 0 }
    if (p.isDeviation) row.deviation += p.realisedPnl ?? 0
    else row.process += p.realisedPnl ?? 0
    byMonth.set(k, row)
  }

  return (
    <div>
      <BackLink href="/scoreboard">Scoreboard</BackLink>
      <h1 className="mt-2 text-2xl font-semibold">
        P&L — the output <PageHelp entry={GLOSSARY.page_pnl} />
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        One comparison and nothing else. The arithmetic is the argument.
      </p>

      <SectionTitle>The comparison</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card tone="good">
          <p className="text-sm font-medium">Process trades</p>
          <p className="mt-1 text-2xl font-semibold tabular">{money(sum(process))}</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            across {process.length} resolved positions
          </p>
        </Card>
        <Card tone={sum(deviations) < 0 ? 'bad' : undefined}>
          <p className="text-sm font-medium">Deviations</p>
          <p className="mt-1 text-2xl font-semibold tabular">{money(sum(deviations))}</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            across {deviations.length} resolved positions
            {unresolvedDeviations > 0 ? ` · ${unresolvedDeviations} more await a dollar outcome` : ''}
          </p>
        </Card>
      </div>

      <SectionTitle>By month</SectionTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead>
              <tr className="text-left" style={{ color: 'var(--muted)' }}>
                <th className="py-1 pr-4 font-medium">Month</th>
                <th className="py-1 pr-4 font-medium">Process</th>
                <th className="py-1 font-medium">Deviations</th>
              </tr>
            </thead>
            <tbody>
              {[...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([m, r]) => (
                <tr key={m}>
                  <td className="py-1 pr-4">{m}</td>
                  <td className="py-1 pr-4" style={{ color: r.process >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {money(r.process)}
                  </td>
                  <td className="py-1" style={{ color: r.deviation >= 0 ? 'var(--good)' : 'var(--bad)' }}>
                    {r.deviation === 0 ? '—' : money(r.deviation)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Resolved outcomes only; seeded rows cover the positions the record names, not all 139.
          {baseline ? ` Programme baseline Jan–Aug 2026: $${baseline.netCredit.toLocaleString()} net credit, ${baseline.winners}/${baseline.positions} winners.` : ''}
        </p>
      </Card>
    </div>
  )
}
