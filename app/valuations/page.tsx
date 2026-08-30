import Link from 'next/link'
import { activeUniverse, getSetting, latestPrices, latestValuation } from '@/lib/data'
import { saveValuation } from '@/lib/actions'
import { BAND_LABELS, GATE_LABELS, computeValuation, type Band } from '@/lib/valuation'
import { Btn, Card, Chip, EmptyState, SectionTitle } from '@/components/ui'
import { Explain, PageHelp } from '@/components/Explain'
import { GLOSSARY } from '@/lib/glossary'

export const dynamic = 'force-dynamic'

interface RawInputs {
  low52: number | null
  high52: number | null
  currentPrice: number | null
  targetPrice: number | null
  fwdPe: number | null
  typicalPe: number | null
  yieldNow: number | null
  yieldTypical: number | null
  view: string
  viewWhy: string
}

const VIEW_LABELS: Record<string, string> = {
  very_cheap: 'Looks very cheap',
  cheap: 'Looks cheap',
  fair: 'Fairly priced',
  expensive: 'Looks expensive',
  very_expensive: 'Looks very expensive',
}

function pctWord(x: number): string {
  const p = Math.abs(x * 100).toFixed(0)
  return x >= 0 ? `${p}% above` : `${p}% below`
}

export default async function ValuationsPage() {
  const universe = await activeUniverse()
  if (universe.length === 0) return <EmptyState title="Seed the database first." />
  const prices = await latestPrices()

  const rows = await Promise.all(
    universe.map(async (t) => ({
      ticker: t,
      snapshot: await latestValuation(t.symbol),
      raw: await getSetting<RawInputs>(`valuation_raw_${t.symbol}`),
    })),
  )

  return (
    <div>
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">Valuation</h1>
        <PageHelp entry={GLOSSARY.page_valuations} />
      </div>
      <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
        Valuation picks the <Explain entry={GLOSSARY.band_gate}>side</Explain>; delta picks the strike. Five
        inputs, shown separately, never a black box. Fewer than three filled → Insufficient data, both sides.{' '}
        <Link href="/valuations/backtest" style={{ color: 'var(--accent)' }}>
          Run the gate backwards over 2026 →
        </Link>
      </p>

      {rows.map(({ ticker: t, snapshot: v, raw }) => {
        const spot = prices.get(t.symbol)?.close ?? null
        const res = computeValuation({
          v1RangePosition: v?.v1RangePosition,
          v2AnalystUpside: v?.v2AnalystUpside,
          v3PeVsMedian: v?.v3PeVsMedian,
          v4YieldVsMedian: v?.v4YieldVsMedian,
          v5Thesis: v?.v5Thesis,
          v5Rationale: v?.v5Rationale,
        })
        const isYieldName = t.symbol === 'OWL'
        return (
          <div key={t.symbol} className="mt-4">
            <Card>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{t.symbol}</h2>
                {spot != null ? (
                  <span className="text-sm tabular" style={{ color: 'var(--muted)' }}>
                    ${spot.toFixed(2)}
                  </span>
                ) : null}
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

              {/* The five inputs, in words a reader can act on. */}
              <ul className="mt-3 grid gap-1.5 text-sm">
                <li>
                  <Explain entry={GLOSSARY.range_position}>52-week range</Explain>:{' '}
                  {v?.v1RangePosition != null ? (
                    <span className="tabular">
                      at {(v.v1RangePosition * 100).toFixed(0)}% of the range —{' '}
                      {v.v1RangePosition >= 0.7 ? 'the expensive end' : v.v1RangePosition <= 0.3 ? 'the cheap end' : 'the middle'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>not filled</span>
                  )}
                </li>
                <li>
                  <Explain entry={GLOSSARY.analyst_target}>Analyst target</Explain>:{' '}
                  {v?.v2AnalystUpside != null ? (
                    <span className="tabular">{pctWord(v.v2AnalystUpside)} today’s price</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>not filled</span>
                  )}
                </li>
                <li>
                  <Explain entry={GLOSSARY.pe_vs_median}>P/E vs its own typical</Explain>:{' '}
                  {v?.v3PeVsMedian != null ? (
                    <span className="tabular">{pctWord(v.v3PeVsMedian)} typical</span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>{isYieldName ? 'not used for this name' : 'not filled'}</span>
                  )}
                </li>
                <li>
                  <Explain entry={GLOSSARY.yield_vs_median}>Dividend yield vs its own typical</Explain>
                  {isYieldName ? ' (primary here)' : ''}:{' '}
                  {v?.v4YieldVsMedian != null ? (
                    <span className="tabular">
                      {pctWord(v.v4YieldVsMedian)} typical — {v.v4YieldVsMedian > 0 ? 'leans cheap' : 'leans expensive'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>not filled</span>
                  )}
                </li>
                <li>
                  <Explain entry={GLOSSARY.thesis}>Your view (counts double)</Explain>:{' '}
                  {v?.v5Thesis != null && v.v5Rationale ? (
                    <span>
                      {VIEW_LABELS[raw?.view ?? ''] ?? v.v5Thesis.toFixed(1)} — “{v.v5Rationale}”
                    </span>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>no written view yet</span>
                  )}
                </li>
              </ul>

              <details className="mt-3">
                <summary className="cursor-pointer text-sm" style={{ color: 'var(--accent)' }}>
                  Update inputs — plain numbers from any broker page
                </summary>
                <form action={saveValuation} className="mt-3 grid gap-4">
                  <input type="hidden" name="symbol" value={t.symbol} />

                  <fieldset className="grid gap-2 sm:grid-cols-3">
                    <legend className="mb-1 text-sm font-medium">
                      <Explain entry={GLOSSARY.range_position}>52-week range</Explain> — copy both from the quote page
                    </legend>
                    <label className="text-sm">
                      52-week LOW, $
                      <input name="low52" type="number" step="0.01" min="0" defaultValue={raw?.low52 ?? ''} className="mt-1 w-full" />
                    </label>
                    <label className="text-sm">
                      52-week HIGH, $
                      <input name="high52" type="number" step="0.01" min="0" defaultValue={raw?.high52 ?? ''} className="mt-1 w-full" />
                    </label>
                    <label className="text-sm">
                      Today’s price, $ {spot != null ? <span style={{ color: 'var(--muted)' }}>(blank = use ${spot.toFixed(2)})</span> : ''}
                      <input name="currentPrice" type="number" step="0.01" min="0" defaultValue={raw?.currentPrice ?? ''} className="mt-1 w-full" />
                    </label>
                  </fieldset>

                  <label className="text-sm">
                    <Explain entry={GLOSSARY.analyst_target}>Analyst average price target</Explain>, $
                    <input name="targetPrice" type="number" step="0.01" min="0" defaultValue={raw?.targetPrice ?? ''} className="mt-1 w-full sm:w-56" />
                  </label>

                  <fieldset className="grid gap-2 sm:grid-cols-2">
                    <legend className="mb-1 text-sm font-medium">
                      <Explain entry={GLOSSARY.pe_vs_median}>P/E ratio</Explain> — skip for REITs and funds
                    </legend>
                    <label className="text-sm">
                      Forward P/E today
                      <input name="fwdPe" type="number" step="0.1" min="0" defaultValue={raw?.fwdPe ?? ''} className="mt-1 w-full" />
                    </label>
                    <label className="text-sm">
                      Its typical P/E (5-year median)
                      <input name="typicalPe" type="number" step="0.1" min="0" defaultValue={raw?.typicalPe ?? ''} className="mt-1 w-full" />
                    </label>
                  </fieldset>

                  <fieldset className="grid gap-2 sm:grid-cols-2">
                    <legend className="mb-1 text-sm font-medium">
                      <Explain entry={GLOSSARY.yield_vs_median}>Dividend yield</Explain> — the main input for income names
                    </legend>
                    <label className="text-sm">
                      Yield today, %
                      <input name="yieldNow" type="number" step="0.01" min="0" defaultValue={raw?.yieldNow ?? ''} className="mt-1 w-full" />
                    </label>
                    <label className="text-sm">
                      Its typical yield, %
                      <input name="yieldTypical" type="number" step="0.01" min="0" defaultValue={raw?.yieldTypical ?? ''} className="mt-1 w-full" />
                    </label>
                  </fieldset>

                  <fieldset className="grid gap-2">
                    <legend className="mb-1 text-sm font-medium">
                      <Explain entry={GLOSSARY.thesis}>Your own view</Explain> — counts double, needs a written reason
                    </legend>
                    <select name="view" defaultValue={raw?.view ?? ''} className="w-full sm:w-64" aria-label="Your view of the price">
                      <option value="">— no view —</option>
                      {Object.entries(VIEW_LABELS).map(([k, label]) => (
                        <option key={k} value={k}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      name="viewWhy"
                      rows={2}
                      placeholder="Why? (required for the view to count)"
                      defaultValue={raw?.viewWhy ?? ''}
                      aria-label="Reason for your view"
                    />
                  </fieldset>

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
          <li>
            Deep value / Undervalued → <strong>puts only</strong> —{' '}
            <Explain entry={GLOSSARY.assignment}>assignment</Explain> is the goal.
          </li>
          <li>Fair → <strong>both sides</strong> — and this should be the common state.</li>
          <li>Rich / Overvalued → <strong>calls only</strong> — happy to be trimmed.</li>
        </ul>
        <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
          Valuation may shade the strike to ~7 <Explain entry={GLOSSARY.delta}>delta</Explain> when deep value
          meets puts or overvalued meets calls. Never past 8.
        </p>
      </Card>
    </div>
  )
}
