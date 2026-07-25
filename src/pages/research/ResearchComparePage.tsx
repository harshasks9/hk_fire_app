import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { activeProvider, seriesFor, loadWeights } from '@/research/providers'
import { categoryScores, overallScore, dcfValue, summarizeFundamentals, classifyTrend, runScenarios, DEFAULT_WEIGHTS } from '@/research/engine'
import { fmtNum } from '@/lib/format'
import { Card, SectionHead, Badge, Button } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

const MAX = 5

export default function ResearchComparePage() {
  const navigate = useNavigate()
  const covered = activeProvider.listCovered()
  const [selected, setSelected] = useState<string[]>(['AAPL', 'NVDA', 'AMD'])
  const weights = loadWeights() ?? DEFAULT_WEIGHTS

  const cols = useMemo(
    () =>
      selected.map((symbol) => {
        const d = activeProvider.getDossier(symbol)!
        const { price, bench, current } = seriesFor(symbol)
        const f = summarizeFundamentals(d.financials)
        const scores = categoryScores(d, current, price, bench)
        const dcf = dcfValue(d.valuation.dcf)
        const scen = runScenarios(current, d.valuation.scenarios)
        const latest = d.financials[d.financials.length - 1]
        return {
          symbol, d, f, current,
          overall: overallScore(scores, weights),
          upside: ((dcf - current) / current) * 100,
          trend: classifyTrend(price),
          expectedIrr: scen.expectedIrr,
          gm: latest.grossMarginPct,
          roic: latest.roicPct,
          ndFcf: f.netDebtToFcf,
          lensAvg: d.frameworks.reduce((s, x) => s + x.score, 0) / d.frameworks.length,
          moat: d.profile.moat,
          mgmt: d.qualityScores.find((q) => q.key === 'managementCapital')?.score ?? null,
          revisions: d.estimateRevisions?.[0]?.direction ?? null,
        }
      }),
    [selected, weights],
  )

  const toggle = (s: string) =>
    setSelected((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : cur.length < MAX ? [...cur, s] : cur))

  const rows: { label: string; render: (c: (typeof cols)[0]) => React.ReactNode; higherBetter?: boolean; value?: (c: (typeof cols)[0]) => number | null }[] = [
    { label: 'Overall score', value: (c) => c.overall, render: (c) => <b className="tnum">{c.overall.toFixed(1)}/10</b>, higherBetter: true },
    { label: 'Revenue CAGR (5y)', value: (c) => c.f.revCagr5, render: (c) => <span className="tnum">{c.f.revCagr5.toFixed(1)}%</span>, higherBetter: true },
    { label: 'EPS CAGR (5y)', value: (c) => c.f.epsCagr5, render: (c) => <span className="tnum">{c.f.epsCagr5.toFixed(1)}%</span>, higherBetter: true },
    { label: 'Gross margin', value: (c) => c.gm ?? null, render: (c) => <span className="tnum">{c.gm?.toFixed(0) ?? '—'}%</span>, higherBetter: true },
    { label: 'ROIC (latest)', value: (c) => c.roic ?? null, render: (c) => <span className="tnum">{c.roic?.toFixed(0) ?? '—'}%</span>, higherBetter: true },
    { label: 'FCF conversion', value: (c) => c.f.fcfConversion, render: (c) => <span className="tnum">{(c.f.fcfConversion * 100).toFixed(0)}%</span>, higherBetter: true },
    { label: 'Net debt / FCF', render: (c) => <span className="tnum">{c.ndFcf === null ? 'n/a' : c.ndFcf <= 0 ? 'net cash' : c.ndFcf.toFixed(1)}</span> },
    { label: 'DCF vs price', value: (c) => c.upside, render: (c) => <span className={cn('tnum font-medium', c.upside >= 0 ? 'text-gain' : 'text-loss')}>{c.upside >= 0 ? '+' : ''}{c.upside.toFixed(0)}%</span>, higherBetter: true },
    { label: 'Expected IRR (5y, weighted)', value: (c) => c.expectedIrr, render: (c) => <span className="tnum">{c.expectedIrr.toFixed(1)}%/yr</span>, higherBetter: true },
    { label: 'Estimate revisions', render: (c) => c.revisions ? <Badge tone={c.revisions === 'up' ? 'gain' : c.revisions === 'down' ? 'loss' : 'neutral'}>{c.revisions}</Badge> : '—' },
    { label: 'Technical trend', render: (c) => <span className="capitalize">{c.trend}</span> },
    { label: 'Moat', render: (c) => <Badge tone={c.moat.rating === 'wide' ? 'gain' : c.moat.rating === 'narrow' ? 'warn' : 'loss'}>{c.moat.rating} · {c.moat.direction}</Badge> },
    { label: 'Management score', value: (c) => c.mgmt, render: (c) => <span className="tnum">{c.mgmt?.toFixed(0) ?? '—'}/10</span>, higherBetter: true },
    { label: 'Investor-lens average', value: (c) => c.lensAvg, render: (c) => <span className="tnum">{c.lensAvg.toFixed(1)}/10</span>, higherBetter: true },
    { label: 'Research status', render: (c) => <Badge tone={c.d.memo.status === 'Accumulate' ? 'gain' : ['Reduce', 'Exit', 'Avoid'].includes(c.d.memo.status) ? 'loss' : 'neutral'}>{c.d.memo.status}</Badge> },
  ]

  return (
    <div className="fade-up space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => navigate('/research')} className="rounded-lg border border-line p-2 text-ink2 hover:bg-surface2" aria-label="Back to lab">
          <Icon name="chevronLeft" size={16} />
        </button>
        <SectionHead title="Comparison workspace" sub={`Up to ${MAX} covered names, side by side — peer group is yours to edit`} className="mb-0" />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {covered.map((s) => (
          <button
            key={s}
            onClick={() => toggle(s)}
            className={cn('rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-colors', selected.includes(s) ? 'border-brand bg-brand text-invert' : 'border-line bg-surface text-ink2 hover:border-brand')}
            aria-pressed={selected.includes(s)}
          >
            {s}
          </button>
        ))}
        <span className="ml-2 self-center text-[11px] text-ink3">{selected.length}/{MAX} selected</span>
      </div>

      {cols.length === 0 ? (
        <Card pad className="py-14 text-center text-[13px] text-ink2">Select at least one covered name above.</Card>
      ) : (
        <Card pad={false} className="overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[680px] text-[12.5px]">
              <thead className="border-b border-line bg-surface2/60">
                <tr>
                  <th className="px-4 py-3 text-left text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Dimension</th>
                  {cols.map((c) => (
                    <th key={c.symbol} className="px-3 py-3 text-center">
                      <Link to={`/research/${c.symbol}`} className="font-bold text-ink hover:text-brand">{c.symbol}</Link>
                      <div className="tnum text-[10.5px] font-normal text-ink3">{c.d.profile.currency === 'INR' ? '₹' : '$'}{fmtNum(c.current)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const values = row.value ? cols.map((c) => row.value!(c)) : []
                  const best = row.higherBetter && values.length > 1 ? Math.max(...(values.filter((v) => v !== null) as number[])) : null
                  return (
                    <tr key={row.label} className="border-b border-line last:border-0">
                      <td className="px-4 py-2.5 text-ink2">{row.label}</td>
                      {cols.map((c, i) => (
                        <td key={c.symbol} className={cn('px-3 py-2.5 text-center', best !== null && values[i] === best && 'bg-gain-soft/40')}>
                          {row.render(c)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink3">
            Highlighted cells lead on that dimension. A higher score is never by itself a reason to trade — position sizing,
            taxes on embedded gains, diversification and time horizon are evaluated in the portfolio command center, not here.
          </p>
        </Card>
      )}
    </div>
  )
}
