import Link from 'next/link'
import { activeUniverse, latestValuation } from '@/lib/data'
import { saveValuation } from '@/lib/actions'
import { BAND_LABELS, GATE_LABELS, computeValuation, type Band } from '@/lib/valuation'
import { Btn, Card, Chip, EmptyState, SectionTitle } from '@/components/ui'

export const dynamic = 'force-dynamic'

export default async function ValuationsPage() {
  const universe = await activeUniverse()
  if (universe.length === 0) return <EmptyState title="Seed the database first." />

  const rows = await Promise.all(
    universe.map(async (t) => ({ ticker: t, snapshot: await latestValuation(t.symbol) })),
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold">Valuation</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Valuation picks the side; delta picks the strike. Five inputs, shown separately, never a black box. Fewer
        than three populated → Insufficient data, both sides.{' '}
        <Link href="/valuations/backtest" style={{ color: 'var(--accent)' }}>
          Run the gate backwards over 2026 →
        </Link>
      </p>

      {rows.map(({ ticker: t, snapshot: v }) => {
        const res = computeValuation({
          v1RangePosition: v?.v1RangePosition,
          v2AnalystUpside: v?.v2AnalystUpside,
          v3PeVsMedian: v?.v3PeVsMedian,
          v4YieldVsMedian: v?.v4YieldVsMedian,
          v5Thesis: v?.v5Thesis,
          v5Rationale: v?.v5Rationale,
        })
        return (
          <div key={t.symbol} className="mt-4">
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{t.symbol}</h2>
                {res.insufficient ? (
                  <Chip kind="neutral">Insufficient data ({res.inputsPopulated} of 5) — both sides</Chip>
                ) : (
                  <Chip kind="neutral">
                    {BAND_LABELS[res.band as Band]} → {GATE_LABELS[res.gate]}
                  </Chip>
                )}
                {v?.provisional && v.band ? (
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    provisional read: {BAND_LABELS[v.band as Band]}
                  </span>
                ) : null}
              </div>

              <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                {res.components.map((c) => (
                  <li key={c.key} className="flex justify-between gap-2">
                    <span style={{ color: 'var(--muted)' }}>
                      {c.label}
                      {c.key === 'v4' && ['OWL'].includes(t.symbol) ? ' (primary here)' : ''}
                    </span>
                    <span className="tabular">{c.raw == null ? '—' : c.raw.toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm" style={{ color: 'var(--accent)' }}>
                  Update inputs
                </summary>
                <form action={saveValuation} className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="symbol" value={t.symbol} />
                  <label className="text-sm">
                    52-week range position (0–1)
                    <input name="v1" type="number" step="0.01" min="0" max="1" defaultValue={v?.v1RangePosition ?? ''} className="mt-1 w-full" />
                  </label>
                  <label className="text-sm">
                    Analyst target upside (e.g. 0.12)
                    <input name="v2" type="number" step="0.01" defaultValue={v?.v2AnalystUpside ?? ''} className="mt-1 w-full" />
                  </label>
                  <label className="text-sm">
                    Fwd P/E vs own 5-yr median (e.g. 0.2 = 20% above)
                    <input name="v3" type="number" step="0.01" defaultValue={v?.v3PeVsMedian ?? ''} className="mt-1 w-full" />
                  </label>
                  <label className="text-sm">
                    Yield vs own median (e.g. 0.15 = 15% above)
                    <input name="v4" type="number" step="0.01" defaultValue={v?.v4YieldVsMedian ?? ''} className="mt-1 w-full" />
                  </label>
                  <label className="text-sm">
                    Own thesis (−1 deep value … +1 rich; weighted double)
                    <input name="v5" type="number" step="0.1" min="-1" max="1" defaultValue={v?.v5Thesis ?? ''} className="mt-1 w-full" />
                  </label>
                  <label className="text-sm sm:col-span-2">
                    Thesis rationale (required for the thesis to count)
                    <textarea name="v5Rationale" rows={2} defaultValue={v?.v5Rationale ?? ''} className="mt-1 w-full" />
                  </label>
                  <div>
                    <Btn tone="primary">Save snapshot</Btn>
                  </div>
                </form>
              </details>
            </Card>
          </div>
        )
      })}

      <SectionTitle>How the gate reads</SectionTitle>
      <Card>
        <ul className="text-sm">
          <li>Deep value / Undervalued → <strong>puts only</strong> — assignment is the goal.</li>
          <li>Fair → <strong>both sides</strong> — and this should be the common state.</li>
          <li>Rich / Overvalued → <strong>calls only</strong> — happy to be trimmed.</li>
        </ul>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Valuation may shade the strike to ~7 delta when deep value meets puts or overvalued meets calls. Never
          past 8.
        </p>
      </Card>
    </div>
  )
}
