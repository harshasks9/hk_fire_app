import { and, eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { bandFromComposite, gateFromBand, BAND_LABELS } from '@/lib/valuation'
import { BackLink, Card, Chip, SectionTitle, money } from '@/components/ui'
import { PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

/* 2026 52-week extremes for the backtest's single-input approximation. The
   MSFT low is the brief's own figure (shares sold at $357.47, ~2% above it). */
const RANGE_2026: Record<string, { low: number; high: number }> = {
  MSFT: { low: 351, high: 568 },
}

export default async function BacktestPage() {
  const db = await getDb()
  const rows = await db
    .select()
    .from(schema.positions)
    .where(and(eq(schema.positions.symbol, 'MSFT'), eq(schema.positions.seeded, true)))
  const janMar = rows
    .filter((p) => p.openedAt.toISOString().slice(0, 10) < '2026-04-01')
    .sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime())

  const judged = janMar.map((p) => {
    const range = RANGE_2026.MSFT!
    const spot = p.entrySpot ?? 0
    const rangePos = (spot - range.low) / (range.high - range.low)
    // Single-input approximation: richness from range position alone.
    const composite = Math.min(1, Math.max(-1, (rangePos - 0.5) * 2))
    const band = bandFromComposite(composite)
    const gate = gateFromBand(band)
    const blocked = (gate === 'puts_only' && p.type === 'call') || (gate === 'calls_only' && p.type === 'put')
    return { p, rangePos, band, gate, blocked }
  })
  const blockedCalls = judged.filter((j) => j.blocked && j.p.type === 'call')

  return (
    <div>
      <BackLink href="/valuations">Valuation</BackLink>
      <h1 className="mt-2 text-2xl font-semibold">
        The gate, run backwards over 2026 <PageHelp entry={GLOSSARY.page_backtest} />
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Including where it would have been wrong. Jan–March: MSFT fell $505 → $357 and the book sold{' '}
        <strong>calls</strong> into the decline — eleven against three puts — then sold 1,472 shares at $357.47,
        about 2% above the 52-week low. At those prices the gate reads deep value, puts only, and blocks every one
        of those call tickets.
      </p>

      <SectionTitle>Verdicts (single-input approximation: range position only)</SectionTitle>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular">
            <thead>
              <tr className="text-left" style={{ color: 'var(--muted)' }}>
                <th className="py-1 pr-3 font-medium">Written</th>
                <th className="py-1 pr-3 font-medium">Position</th>
                <th className="py-1 pr-3 font-medium">Spot</th>
                <th className="py-1 pr-3 font-medium">Range pos</th>
                <th className="py-1 pr-3 font-medium">Gate reads</th>
                <th className="py-1 font-medium">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {judged.map(({ p, rangePos, band, gate, blocked }) => (
                <tr key={p.id}>
                  <td className="py-1 pr-3">{p.openedAt.toISOString().slice(0, 10)}</td>
                  <td className="py-1 pr-3">
                    {p.strike}
                    {p.type === 'call' ? 'C' : 'P'} ×{p.lots}
                  </td>
                  <td className="py-1 pr-3">${p.entrySpot?.toFixed(0)}</td>
                  <td className="py-1 pr-3">{(rangePos * 100).toFixed(0)}%</td>
                  <td className="py-1 pr-3">
                    {BAND_LABELS[band]} → {gate === 'puts_only' ? 'puts only' : gate === 'calls_only' ? 'calls only' : 'both'}
                  </td>
                  <td className="py-1">
                    <Chip kind={blocked ? 'bad' : 'good'}>{blocked ? 'BLOCKED' : 'allowed'}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <SectionTitle>Where it would have been wrong</SectionTitle>
      <Card tone="warn">
        <p className="text-sm">
          The blocked calls were mostly <em>winners</em> — {blockedCalls.length} call tickets the gate refuses
          collected{' '}
          {money(blockedCalls.reduce((s, j) => s + (j.p.realisedPnl ?? 0), 0))} of premium in the actual record.
          The gate trades that premium away to avoid selling the bottom, and in March 2026 it would also have
          blocked the sale of 1,472 shares at $357.47. That trade-off is the model; it is shown here so it is
          chosen, not discovered.
        </p>
      </Card>

      <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
        Backtest uses the seeded Jan–Mar rows and a single-input band (52-week range position). The live gate
        requires three inputs and would read Insufficient data → both sides until they are filled.
      </p>
    </div>
  )
}
