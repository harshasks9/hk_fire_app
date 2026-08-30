import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { activeProvider, seriesFor, loadUserState, saveUserState, loadWeights, saveWeights } from '@/research/providers'
import {
  categoryScores, overallScore, dataConfidence, dcfValue, reverseDcfImpliedGrowth, runScenarios,
  sensitivityTable, summarizeFundamentals, sma, rsi, macd, atrApprox, bollinger, annualizedVol,
  betaVs, drawdowns, classifyTrend, keyLevels, DEFAULT_WEIGHTS,
} from '@/research/engine'
import { FRAMEWORKS, frameworkById } from '@/research/frameworks'
import { POSITIONS } from '@/data/portfolio'
import { fmtDate, fmtNum, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, EmptyState, KV, ProgressBar } from '@/components/ui'
import { AreaChart, MonthBars, HBarStack, ProgressRing, RangeBar } from '@/components/charts'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { anyInstrument } from '@/data/watchlist'
import type { DcfInputs, Memo } from '@/research/types'

const TABS = ['Overview', 'Financials', 'Valuation', 'Lenses', 'Technicals', 'Memo', 'News'] as const
type Tab = (typeof TABS)[number]

const CLAIM_LABEL: Record<string, string> = {
  verified_fact: 'Verified fact',
  management_statement: 'Mgmt statement',
  consensus: 'Consensus',
  market_expectation: 'Market expectation',
  model_inference: 'Model inference',
  speculation: 'Speculation',
  sample_data: 'Sample data',
}

export default function ResearchDossierPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const app = useApp()
  const [tab, setTab] = useState<Tab>('Overview')
  const dossier = symbol ? activeProvider.getDossier(symbol) : null

  if (!dossier) {
    return (
      <Card>
        <EmptyState
          icon="search"
          title={`No research dossier for ${symbol}`}
          body="This name has technical-only or no coverage in the bundled sample dataset. Full dossiers require the live data provider (see docs/RESEARCH-LAB.md)."
          action={<Button variant="primary" onClick={() => navigate('/research')}>Back to Research Lab</Button>}
        />
      </Card>
    )
  }

  const { price, bench, current } = seriesFor(dossier.symbol)
  const weights = loadWeights() ?? DEFAULT_WEIGHTS
  const scores = useMemo(() => categoryScores(dossier, current, price, bench), [dossier, current])
  const overall = overallScore(scores, weights)
  const conf = dataConfidence(dossier)
  const held = POSITIONS.some((p) => p.symbol === dossier.symbol)
  const sym = dossier.profile.currency === 'INR' ? '₹' : '$'

  return (
    <div className="fade-up space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate('/research')} className="rounded-lg border border-line p-2 text-ink2 hover:bg-surface2" aria-label="Back to lab">
            <Icon name="chevronLeft" size={16} />
          </button>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-[12px] font-bold text-brand">{dossier.symbol.slice(0, 4)}</span>
          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-tight text-ink">{dossier.profile.name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-ink2">
              <Badge tone="brand">{dossier.tier === 'deep' ? 'Deep coverage' : 'Standard coverage'}</Badge>
              <Badge tone={dossier.memo.status === 'Accumulate' ? 'gain' : ['Reduce', 'Exit', 'Avoid'].includes(dossier.memo.status) ? 'loss' : 'neutral'}>{dossier.memo.status}</Badge>
              {held && <Badge tone="brass">In portfolio</Badge>}
              <span className="text-ink3">{dossier.profile.sector} · {dossier.profile.country} · vs {dossier.profile.benchmark}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="tnum font-display text-[22px] font-semibold text-ink">{sym}{fmtNum(current)}</div>
            <div className="text-[10.5px] text-ink3">sample market data · {relDate(dossier.dataProfile.asOf)}</div>
          </div>
          <ProgressRing pct={overall * 10} size={56} label={overall.toFixed(1)} tone={overall >= 7 ? 'var(--m-gain)' : overall >= 5 ? 'var(--m-chart-1)' : 'var(--m-warn)'} />
        </div>
      </div>

      {/* Data profile strip */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface2/50 px-3.5 py-2 text-[11px] text-ink2">
        <Icon name="shield" size={12} className="text-info" />
        <span><b className="text-ink">{activeProvider.label}</b> · as of {fmtDate(dossier.dataProfile.asOf)} · data confidence {conf.pct}%</span>
        <span className="hidden text-ink3 sm:inline">· {dossier.dataProfile.note}</span>
        <button className="ml-auto font-medium text-brand hover:underline" onClick={() => setTab('Overview')} title={conf.gaps.join('\n')}>
          {conf.gaps.length} data gaps
        </button>
      </div>

      {/* Tabs */}
      <div className="scroll-thin -mx-1 flex gap-1 overflow-x-auto border-b border-line px-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn('shrink-0 border-b-2 px-3.5 py-2.5 text-[13px] font-medium transition-colors', tab === t ? 'border-brand text-brand' : 'border-transparent text-ink2 hover:text-ink')}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab d={dossier} scores={scores} weights={weights} conf={conf} />}
      {tab === 'Financials' && <FinancialsTab d={dossier} />}
      {tab === 'Valuation' && <ValuationTab d={dossier} current={current} sym={sym} />}
      {tab === 'Lenses' && <LensesTab d={dossier} />}
      {tab === 'Technicals' && <TechnicalsTab d={dossier} price={price} bench={bench} current={current} sym={sym} />}
      {tab === 'Memo' && <MemoTab d={dossier} sym={sym} />}
      {tab === 'News' && <NewsTab d={dossier} />}
    </div>
  )
}

/* ---------------- Overview ---------------- */

function OverviewTab({ d, scores, weights, conf }: any) {
  const app = useApp()
  const [w, setW] = useState<Record<string, number>>(weights)
  const [showFormulas, setShowFormulas] = useState(false)
  const overall = overallScore(scores, w)
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card pad>
          <SectionHead title="What this company is" />
          <p className="text-[13.5px] leading-relaxed text-ink">{d.profile.description}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-surface2/70 p-3">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Market narrative</div>
              <p className="text-[12.5px] leading-relaxed text-ink2">{d.profile.marketNarrative}</p>
            </div>
            <div className="rounded-xl bg-brand-soft/50 p-3">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-brand">Variant perception</div>
              <p className="text-[12.5px] leading-relaxed text-ink2">{d.memo.variantPerception}</p>
            </div>
          </div>
        </Card>

        <Card pad>
          <SectionHead title="Revenue mix" sub="Segments and geographies — where the money actually comes from" />
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">By segment</div>
              <HBarStack slices={d.profile.segments.map((s: any) => ({ label: s.name, value: s.revenuePct }))} height={12} />
            </div>
            <div>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">By geography</div>
              <HBarStack slices={d.profile.geographies.map((s: any) => ({ label: s.name, value: s.revenuePct }))} height={12} />
            </div>
          </div>
        </Card>

        <Card pad>
          <SectionHead title="Moat & risks" />
          <div className="mb-3 flex items-center gap-2">
            <Badge tone={d.profile.moat.rating === 'wide' ? 'gain' : d.profile.moat.rating === 'narrow' ? 'warn' : 'loss'}>
              {d.profile.moat.rating} moat · {d.profile.moat.direction}
            </Badge>
          </div>
          <p className="text-[12.5px] leading-relaxed text-ink2">{d.profile.moat.basis}</p>
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            {d.profile.risks.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-2.5">
                <Icon name="alert" size={13} className={cn('mt-0.5 shrink-0', r.underappreciated ? 'text-loss' : 'text-warn')} />
                <p className="text-[12.5px] leading-relaxed text-ink2">
                  <b className="text-ink">{r.label}{r.underappreciated && ' (underappreciated)'}: </b>{r.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-line pt-3">
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Management & capital allocation</div>
            <p className="text-[12.5px] leading-relaxed text-ink2">{d.profile.management.assessment} {d.profile.management.capitalAllocation}</p>
          </div>
          {d.profile.accountingFlags.length > 0 && (
            <div className="mt-3 rounded-lg bg-surface2 p-3">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Forensic notes</div>
              {d.profile.accountingFlags.map((f: any, i: number) => (
                <p key={i} className="py-0.5 text-[12px] leading-relaxed text-ink2">
                  <Badge tone={f.severity === 'high' ? 'loss' : f.severity === 'medium' ? 'warn' : 'neutral'} className="mr-1.5">{f.severity}</Badge>
                  <b className="text-ink">{f.label}:</b> {f.detail}
                </p>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <Card pad>
          <SectionHead
            title="Score breakdown"
            sub="Weights are yours to edit — raw research never changes"
            right={<span className="tnum font-display text-[20px] font-bold text-ink">{overall.toFixed(1)}</span>}
          />
          {scores.map((s: any) => (
            <div key={s.key} className="mb-2.5">
              <div className="mb-0.5 flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 text-ink2">
                  {s.label}
                  {!s.computed && <Badge tone="warn">authored</Badge>}
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="number" min={0} max={40} value={w[s.key] ?? 0}
                    onChange={(e) => { const nw = { ...w, [s.key]: Number(e.target.value) }; setW(nw); saveWeights(nw) }}
                    className="tnum h-6 w-12 rounded border border-line bg-bg px-1 text-right text-[11px] outline-none focus:border-brand"
                    aria-label={`Weight for ${s.label}`}
                  />
                  <span className="tnum w-8 text-right font-semibold text-ink">{s.score.toFixed(1)}</span>
                </span>
              </div>
              <ProgressBar pct={s.score * 10} tone={s.score >= 7 ? 'gain' : s.score >= 5 ? 'brand' : 'warn'} height="h-1" />
              {showFormulas && (
                <div className="mt-1 rounded bg-surface2/70 p-2 text-[10.5px] leading-relaxed text-ink3">
                  <div className="font-medium text-ink2">{s.formula}</div>
                  {s.inputs.map((inp: any, i: number) => (
                    <div key={i} className="tnum">{inp.label}: {inp.value} → {inp.contribution.toFixed(1)}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setShowFormulas((v) => !v)} className="text-[11.5px] font-medium text-brand hover:underline">
            {showFormulas ? 'Hide formulas & inputs' : 'Show formulas & inputs'}
          </button>
        </Card>

        <Card pad>
          <SectionHead title="Data confidence" right={<span className="tnum text-[15px] font-bold text-ink">{conf.pct}%</span>} />
          {conf.gaps.map((g: string, i: number) => (
            <p key={i} className="flex items-start gap-2 py-1 text-[11.5px] leading-relaxed text-ink2">
              <Icon name="alert" size={11} className="mt-0.5 shrink-0 text-warn" />{g}
            </p>
          ))}
        </Card>

        <Card pad>
          <SectionHead title="Research timeline" sub="How the view evolved" />
          {d.snapshots.map((s: any, i: number) => (
            <div key={i} className="flex gap-2.5 border-b border-line py-2 text-[12px] last:border-0">
              <span className="tnum shrink-0 text-ink3">{fmtDate(s.date, 'short')}</span>
              <span className="min-w-0">
                <Badge tone="neutral" className="mr-1.5">{s.status}</Badge>
                <span className="leading-relaxed text-ink2">{s.note}</span>
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Financials ---------------- */

function FinancialsTab({ d }: any) {
  const f = summarizeFundamentals(d.financials)
  const years = d.financials.map((y: any) => y.fy.replace('FY', ''))
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat label="Revenue CAGR (5y)" v={`${f.revCagr5.toFixed(1)}%`} />
      <Stat label="EPS CAGR (5y)" v={`${f.epsCagr5.toFixed(1)}%`} />
      <Stat label="FCF conversion" v={`${(f.fcfConversion * 100).toFixed(0)}%`} sub="of net income" />
      <Stat label="Share count (5y)" v={`${f.buybackPct5 > 0 ? '+' : ''}${f.buybackPct5.toFixed(1)}%`} sub={f.buybackPct5 < 0 ? 'buybacks shrinking count' : 'dilution'} />
      <Stat label="Net debt / FCF" v={f.netDebtToFcf === null ? 'n/a' : f.netDebtToFcf <= 0 ? 'net cash' : f.netDebtToFcf.toFixed(1)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Revenue & profitability" sub={`${d.profile.unit} · does growth reach the bottom line?`} />
          <MonthBars
            months={d.financials.map((y: any) => ({ label: y.fy.slice(-2), a: y.netIncome, b: Math.max(0, y.revenue - y.netIncome) }))}
            labelA="Net income"
            labelB="Revenue (remainder)"
            height={170}
          />
        </Card>
        <Card pad>
          <SectionHead title="Free cash flow vs net income" sub="Cash conversion is the forensic heartbeat" />
          <MonthBars
            months={d.financials.map((y: any) => ({ label: y.fy.slice(-2), a: y.fcf, b: 0 }))}
            labelA="Free cash flow"
            labelB=""
            height={170}
            colorA="var(--m-chart-2)"
          />
        </Card>
      </div>

      <Card pad={false} className="overflow-hidden">
        <div className="px-5 pt-4"><SectionHead title="Financial history" sub={`${d.profile.unit} · per-share figures absolute · sample dataset, approximate`} /></div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[820px] text-[12px]">
            <thead className="border-b border-line bg-surface2/60 text-[10px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">FY</th>
                <th className="px-2 py-2 text-right font-semibold">Revenue</th>
                <th className="px-2 py-2 text-right font-semibold">GM%</th>
                <th className="px-2 py-2 text-right font-semibold">EBIT%</th>
                <th className="px-2 py-2 text-right font-semibold">Net income</th>
                <th className="px-2 py-2 text-right font-semibold">EPS</th>
                <th className="px-2 py-2 text-right font-semibold">FCF</th>
                <th className="px-2 py-2 text-right font-semibold">Shares</th>
                <th className="px-2 py-2 text-right font-semibold">ROIC%</th>
                <th className="px-2 py-2 text-right font-semibold">Net debt</th>
                <th className="px-2 py-2 text-right font-semibold">DPS</th>
              </tr>
            </thead>
            <tbody>
              {[...d.financials].reverse().map((y: any) => (
                <tr key={y.fy} className="tnum border-b border-line last:border-0">
                  <td className="px-5 py-2 font-medium">{y.fy}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(y.revenue, 1)}</td>
                  <td className="px-2 py-2 text-right">{y.grossMarginPct?.toFixed(1) ?? '—'}</td>
                  <td className="px-2 py-2 text-right">{y.ebitMarginPct?.toFixed(1) ?? '—'}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(y.netIncome, 1)}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(y.eps, 2)}</td>
                  <td className={cn('px-2 py-2 text-right', y.fcf < 0 && 'text-loss')}>{fmtNum(y.fcf, 1)}</td>
                  <td className="px-2 py-2 text-right">{fmtNum(y.shares, 2)}</td>
                  <td className="px-2 py-2 text-right">{y.roicPct?.toFixed(0) ?? '—'}</td>
                  <td className={cn('px-2 py-2 text-right', (y.netDebt ?? 0) < 0 && 'text-gain')}>{y.netDebt !== undefined ? fmtNum(y.netDebt, 0) : '—'}</td>
                  <td className="px-2 py-2 text-right">{y.dividendsPerShare?.toFixed(2) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-2.5 text-[10.5px] text-ink3">Years marked “e” are sample estimates, not reported results.</p>
      </Card>

      {d.estimateRevisions && (
        <Card pad>
          <SectionHead title="Estimate revisions" sub="Direction of consensus — sample data" />
          {d.estimateRevisions.map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
              <Icon name={r.direction === 'up' ? 'arrowUpRight' : r.direction === 'down' ? 'arrowDownRight' : 'chevronRight'} size={14} className={r.direction === 'up' ? 'text-gain' : r.direction === 'down' ? 'text-loss' : 'text-ink3'} />
              <span className="text-[12.5px] font-medium text-ink">{r.period}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-ink2">{r.note}</span>
              <Badge tone="info">Consensus</Badge>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function Stat({ label, v, sub }: { label: string; v: string; sub?: string }) {
  return (
    <Card pad className="py-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-ink3">{label}</div>
      <div className="tnum mt-0.5 font-display text-[19px] font-semibold text-ink">{v}</div>
      {sub && <div className="text-[10.5px] text-ink3">{sub}</div>}
    </Card>
  )
}

/* ---------------- Valuation ---------------- */

function ValuationTab({ d, current, sym }: any) {
  const [inp, setInp] = useState<DcfInputs>({ ...d.valuation.dcf })
  const value = dcfValue(inp)
  const upside = ((value - current) / current) * 100
  const implied = reverseDcfImpliedGrowth(current, d.valuation.dcf)
  const scen = runScenarios(current, d.valuation.scenarios)
  const growths = [inp.growthY1_5 - 6, inp.growthY1_5 - 3, inp.growthY1_5, inp.growthY1_5 + 3, inp.growthY1_5 + 6]
  const discounts = [inp.discountRate - 1.5, inp.discountRate, inp.discountRate + 1.5]
  const sens = sensitivityTable(inp, growths, discounts)

  const slider = (label: string, key: keyof DcfInputs, min: number, max: number, step = 0.5) => (
    <div>
      <div className="mb-0.5 flex justify-between text-[11.5px]">
        <label htmlFor={`dcf-${key}`} className="text-ink2">{label}</label>
        <span className="tnum font-semibold text-ink">{(inp[key] as number).toFixed(1)}{key.includes('growth') || key.includes('Rate') || key === 'terminalGrowth' ? '%' : ''}</span>
      </div>
      <input id={`dcf-${key}`} type="range" min={min} max={max} step={step} value={inp[key] as number} onChange={(e) => setInp({ ...inp, [key]: Number(e.target.value) })} className="w-full accent-(--m-brand)" />
    </div>
  )

  return (
    <div className="space-y-4">
      <Card pad className="border-brass/30 bg-brass-soft/20">
        <div className="flex items-start gap-3">
          <Icon name="bulb" size={16} className="mt-0.5 shrink-0 text-brass" />
          <p className="text-[12.5px] leading-relaxed text-ink2"><b className="text-ink">Why these methods: </b>{d.valuation.methodNotes}</p>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* DCF lab */}
        <Card pad>
          <SectionHead title="DCF lab" sub="Two-stage FCF model — every assumption is yours to move" />
          <div className="mb-4 grid grid-cols-2 items-center gap-4 rounded-xl bg-surface2/70 p-3.5">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Value per share</div>
              <div className="tnum font-display text-[26px] font-bold text-ink">{sym}{value.toFixed(0)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] text-ink3">vs price {sym}{fmtNum(current)}</div>
              <div className={cn('tnum text-[18px] font-bold', upside >= 0 ? 'text-gain' : 'text-loss')}>{upside >= 0 ? '+' : ''}{upside.toFixed(0)}%</div>
            </div>
          </div>
          <div className="space-y-3">
            {slider('Growth years 1–5', 'growthY1_5', -5, 40)}
            {slider('Growth years 6–10', 'growthY6_10', -5, 25)}
            {slider('Terminal growth', 'terminalGrowth', 0, 6, 0.25)}
            {slider('Discount rate', 'discountRate', 6, 16, 0.25)}
          </div>
          <Button size="sm" variant="ghost" className="mt-3" onClick={() => setInp({ ...d.valuation.dcf })}>Reset to analyst assumptions</Button>
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Sensitivity — value per share</div>
            <table className="tnum w-full text-[11px]">
              <thead><tr className="text-ink3"><th className="py-1 text-left font-medium">disc \ growth</th>{growths.map((g) => <th key={g} className="py-1 text-right font-medium">{g.toFixed(0)}%</th>)}</tr></thead>
              <tbody>
                {discounts.map((dr, i) => (
                  <tr key={dr} className="border-t border-line">
                    <td className="py-1.5 text-ink2">{dr.toFixed(1)}%</td>
                    {sens[i].map((v2, j) => (
                      <td key={j} className={cn('py-1.5 text-right', v2 >= current ? 'text-gain' : 'text-ink2')}>{sym}{v2.toFixed(0)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card pad>
            <SectionHead title="Reverse DCF" sub="What the current price already believes" />
            <div className="flex items-center gap-4">
              <div className="tnum font-display text-[30px] font-bold text-ink">{implied.toFixed(1)}%</div>
              <p className="text-[12px] leading-relaxed text-ink2">
                FCF growth for years 1–5 (then half that for 5 more) is required to justify {sym}{fmtNum(current)} at a {d.valuation.dcf.discountRate}% discount rate.
                Compare with the analyst base case of {d.valuation.dcf.growthY1_5}%.
              </p>
            </div>
            <Badge tone={implied > d.valuation.dcf.growthY1_5 + 2 ? 'warn' : 'gain'} className="mt-2">
              {implied > d.valuation.dcf.growthY1_5 + 2 ? 'Price demands more than the base case' : 'Price consistent with base case'}
            </Badge>
          </Card>

          <Card pad>
            <SectionHead title="Bull / base / bear" sub="5-year scenario targets · probability-weighted" />
            <div className="space-y-2">
              {scen.cases.map((c) => (
                <div key={c.label} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between">
                    <Badge tone={c.label === 'Bull' ? 'gain' : c.label === 'Bear' ? 'loss' : 'neutral'}>{c.label} · {c.probabilityPct}%</Badge>
                    <span className="tnum text-[13px] font-bold text-ink">{sym}{c.target5y.toFixed(0)} <span className={cn('text-[11px] font-medium', c.irrPct >= 0 ? 'text-gain' : 'text-loss')}>({c.irrPct >= 0 ? '+' : ''}{c.irrPct.toFixed(1)}%/yr)</span></span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-ink2">{c.narrative}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-baseline justify-between rounded-xl bg-surface2/70 p-3">
              <span className="text-[12px] font-semibold text-ink">Expected value (weighted)</span>
              <span className={cn('tnum text-[16px] font-bold', scen.expectedIrr >= 8 ? 'text-gain' : scen.expectedIrr >= 4 ? 'text-ink' : 'text-warn')}>{scen.expectedIrr.toFixed(1)}%/yr · {scen.expectedReturn >= 0 ? '+' : ''}{scen.expectedReturn.toFixed(0)}% total</span>
            </div>
            <p className="mt-1.5 text-[10.5px] text-ink3">Model inference — probabilities are analyst judgments, not measurements.</p>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Valuation vs own history" sub="Where today sits in the company's historical bands" />
          {d.valuation.historicalMultiples.map((m: any) => (
            <div key={m.label} className="mb-3.5">
              <div className="mb-1 flex justify-between text-[11.5px]"><span className="text-ink2">{m.label}</span><span className="tnum font-semibold text-ink">now {m.current}</span></div>
              <RangeBar low={m.low} high={m.high} current={m.current} target={m.median} />
              <div className="tnum mt-0.5 text-[10px] text-ink3">low {m.low} · median {m.median} (marker) · high {m.high}</div>
            </div>
          ))}
        </Card>
        <Card pad>
          <SectionHead title="Peers" sub="Relative context — peer group editable in live mode" />
          {d.valuation.peers.map((p: any) => (
            <div key={p.symbol} className="flex items-center justify-between border-b border-line py-2 text-[12.5px] last:border-0">
              <span className="text-ink"><b>{p.symbol}</b> <span className="text-ink3">{p.name}</span></span>
              <span className="tnum font-medium text-ink">{p.multiple}× <span className="text-[10.5px] text-ink3">{p.metric}</span></span>
            </div>
          ))}
          {d.valuation.sotp && (
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Sum of the parts ({d.profile.unit})</div>
              {d.valuation.sotp.map((s: any) => (
                <div key={s.part} className="flex items-baseline justify-between py-1 text-[12px]">
                  <span className="text-ink2">{s.part} <span className="text-[10px] text-ink3">— {s.basis}</span></span>
                  <span className={cn('tnum font-medium', s.value < 0 ? 'text-loss' : 'text-ink')}>{fmtNum(s.value, 0)}</span>
                </div>
              ))}
              <div className="mt-1 flex justify-between border-t-2 border-line pt-1.5 text-[12.5px] font-bold">
                <span>Total → per share</span>
                <span className="tnum">{sym}{(d.valuation.sotp.reduce((s: number, x: any) => s + x.value, 0) / d.valuation.dcf.shares).toFixed(0)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/* ---------------- Lenses ---------------- */

function LensesTab({ d }: any) {
  const [open, setOpen] = useState<string | null>(null)
  const sorted = [...d.frameworks].sort((a: any, b: any) => b.score - a.score)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]
  return (
    <div className="space-y-4">
      <Card pad className="border-violet/25 bg-violet-soft/30">
        <div className="flex items-start gap-3">
          <Icon name="eye" size={16} className="mt-0.5 shrink-0 text-violet" />
          <p className="text-[12.5px] leading-relaxed text-ink2">
            <b className="text-ink">Contradiction to hold in mind: </b>
            {frameworkById(best.id).name} scores this {best.score.toFixed(1)}/10 ({best.verdict.toLowerCase()}) while{' '}
            {frameworkById(worst.id).name} scores it {worst.score.toFixed(1)}/10. Both can be right — they optimize for different
            outcomes. The disagreement itself is information about what kind of bet this is.
          </p>
        </div>
      </Card>
      <div className="grid gap-3 lg:grid-cols-2">
        {sorted.map((ev: any) => {
          const def = frameworkById(ev.id)
          const isOpen = open === ev.id
          return (
            <Card key={ev.id} pad>
              <button onClick={() => setOpen(isOpen ? null : ev.id)} className="flex w-full items-start justify-between gap-3 text-left">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-ink">{def.name}</span>
                    <span className={cn('tnum rounded-md px-1.5 py-0.5 text-[11.5px] font-bold', ev.score >= 7.5 ? 'bg-gain-soft text-gain' : ev.score >= 5.5 ? 'bg-surface2 text-ink' : ev.score >= 4 ? 'bg-warn-soft text-warn' : 'bg-loss-soft text-loss')}>{ev.score.toFixed(1)}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink2">{ev.verdict}</p>
                </div>
                <Icon name="chevronDown" size={14} className={cn('mt-1 shrink-0 text-ink3 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="fade-up mt-3 space-y-3 border-t border-line pt-3">
                  <p className="text-[10.5px] text-ink3">Principles from: {def.basis} · Focus: {def.focus}</p>
                  {(ev.answers ?? []).map((ans: any, i: number) => (
                    <div key={i}>
                      <div className="text-[11.5px] font-semibold text-ink">{ans.q}</div>
                      <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">{ans.a}</p>
                      {ans.source && (
                        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-ink3">
                          <Icon name="file" size={9} />{ans.source.label} · {CLAIM_LABEL[ans.source.kind]}
                        </span>
                      )}
                    </div>
                  ))}
                  {!ev.answers?.length && (
                    <div>
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Framework questions</div>
                      {def.questions.map((q, i) => <p key={i} className="py-0.5 text-[11.5px] text-ink2">· {q}</p>)}
                      <p className="mt-1 text-[10.5px] text-ink3">Per-question evidence is authored for deep-coverage names; this is a standard-tier verdict.</p>
                    </div>
                  )}
                  {ev.applicability && (
                    <p className="rounded-lg bg-warn-soft p-2.5 text-[11.5px] leading-relaxed text-ink2"><b className="text-warn">Applicability: </b>{ev.applicability}</p>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Technicals ---------------- */

function TechnicalsTab({ d, price, bench, current, sym }: any) {
  const s50 = sma(price, 50)
  const s200 = sma(price, 200)
  const r = rsi(price)
  const m = macd(price)
  const bb = bollinger(price)
  const atr = atrApprox(price)
  const vol = annualizedVol(price.slice(-252))
  const beta = betaVs(price, bench)
  const dd = drawdowns(price)
  const trend = classifyTrend(price)
  const levels = keyLevels(price, current)
  const hi52 = Math.max(...price.slice(-252))
  const lo52 = Math.min(...price.slice(-252))
  const rs = price.map((v: number, i: number) => v / price[0] / (bench[i] / bench[0]))
  const support = levels.filter((l: any) => l.kind === 'support').pop()

  return (
    <div className="space-y-4">
      <Card pad className="border-info/25 bg-info-soft/20">
        <p className="text-[11.5px] leading-relaxed text-ink2">
          <Icon name="info" size={12} className="mr-1 inline text-info" />
          Computed from the bundled sample price series (closes only — ATR is a close-to-close approximation). Signals are
          probabilities with invalidation levels, never certainties.
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Trend regime" v={trend} />
        <Stat label="RSI (14)" v={r.toFixed(0)} sub={r > 70 ? 'overbought zone' : r < 30 ? 'oversold zone' : 'neutral'} />
        <Stat label="MACD hist" v={m.hist >= 0 ? `+${m.hist.toFixed(2)}` : m.hist.toFixed(2)} sub={m.hist >= 0 ? 'momentum positive' : 'momentum negative'} />
        <Stat label="Volatility (1y)" v={`${vol.toFixed(0)}%`} sub={`ATR ≈ ${sym}${atr.toFixed(1)}/day`} />
        <Stat label={`Beta vs ${d.profile.benchmark}`} v={beta.toFixed(2)} />
        <Stat label="Max drawdown (1y)" v={`${dd.maxDrawdownPct.toFixed(0)}%`} sub={`now ${dd.currentDrawdownPct.toFixed(0)}% off high`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card pad className="lg:col-span-2">
          <SectionHead title="Price vs 200-day average" sub="Is the long-term trend intact?" />
          <AreaChart data={price} compare={s200.map((v: number | null) => v ?? price[0])} compareLabel="SMA 200" height={220} currency={d.profile.currency} seriesLabel="Price" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">52-week range</div>
              <RangeBar low={lo52} high={hi52} current={current} />
            </div>
            <div>
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Bollinger position</div>
              <ProgressBar pct={bb.pctB * 100} tone={bb.pctB > 0.95 ? 'warn' : 'brand'} />
              <div className="tnum mt-0.5 text-[10px] text-ink3">%B {(bb.pctB * 100).toFixed(0)} · band {sym}{bb.lower.toFixed(0)}–{sym}{bb.upper.toFixed(0)}</div>
            </div>
          </div>
        </Card>

        <Card pad>
          <SectionHead title="Key levels" sub="Clustered extrema — heuristic" />
          {levels.map((l: any, i: number) => (
            <div key={i} className="flex items-center justify-between border-b border-line py-2 text-[12.5px] last:border-0">
              <Badge tone={l.kind === 'support' ? 'gain' : 'loss'}>{l.kind}</Badge>
              <span className="tnum font-semibold text-ink">{sym}{l.price.toFixed(0)}</span>
              <span className="max-w-[120px] text-right text-[10px] text-ink3">{l.basis}</span>
            </div>
          ))}
          <div className="mt-3 space-y-2 border-t border-line pt-3 text-[11.5px] leading-relaxed">
            <p><b className="text-gain">Technical bull case:</b> hold above SMA-200 with RSI resetting below 60 → trend continuation. <b>Invalidation:</b> close below {sym}{support ? support.price.toFixed(0) : (current * 0.93).toFixed(0)}.</p>
            <p><b className="text-ink2">Neutral:</b> range between the clustered levels; momentum flat.</p>
            <p><b className="text-loss">Technical bear case:</b> lose the 200-day on expanding volatility → regime change to distribution. Reliability: moderate — sample-series heuristics, one timeframe.</p>
          </div>
        </Card>
      </div>

      <Card pad>
        <SectionHead title={`Relative strength vs ${d.profile.benchmark}`} sub="Above 1.0 = outperforming the benchmark over the window" />
        <AreaChart data={rs} height={130} showAxis={false} color="var(--m-chart-5)" summary="Relative strength ratio" />
      </Card>

      <Card pad>
        <SectionHead title="Drawdown profile" sub="How painful has ownership been over the past year?" />
        <AreaChart data={dd.series.slice(-252)} height={130} showAxis={false} color="var(--m-chart-4)" summary="Drawdown from rolling peak" />
      </Card>
    </div>
  )
}

/* ---------------- Memo ---------------- */

function MemoTab({ d, sym }: any) {
  const [editing, setEditing] = useState(false)
  const [userState, setUserState] = useState(() => loadUserState(d.symbol))
  const memo: Memo = { ...d.memo, ...(userState.editedMemo ?? {}) }
  const edited = !!userState.editedMemo && Object.keys(userState.editedMemo).length > 0

  const save = (patch: Partial<Memo>) => {
    const next = { ...userState, editedMemo: { ...(userState.editedMemo ?? {}), ...patch } }
    setUserState(next)
    saveUserState(d.symbol, next)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card pad>
          <div className="flex items-start justify-between gap-3">
            <SectionHead title="Investment memo" sub={edited ? `Edited by you · saved ${userState.savedAt ? relDate(userState.savedAt.slice(0, 10)) : ''}` : 'Analyst baseline — edit to make it yours'} className="mb-0" />
            <div className="flex gap-2">
              {edited && <Button size="sm" variant="ghost" onClick={() => { setUserState({}); saveUserState(d.symbol, {}) }}>Revert to baseline</Button>}
              <Button size="sm" variant={editing ? 'primary' : 'secondary'} icon={editing ? 'check' : 'file'} onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</Button>
            </div>
          </div>
          <p className="mt-3 font-display text-[16px] font-medium leading-snug text-ink">{memo.oneLiner}</p>
          <div className="mt-4 space-y-3">
            {(['bull', 'base', 'bear'] as const).map((k) => (
              <div key={k} className={cn('rounded-xl border p-3', k === 'bull' ? 'border-gain/30 bg-gain-soft/30' : k === 'bear' ? 'border-loss/30 bg-loss-soft/30' : 'border-line bg-surface2/50')}>
                <div className={cn('mb-1 text-[10.5px] font-bold uppercase tracking-wide', k === 'bull' ? 'text-gain' : k === 'bear' ? 'text-loss' : 'text-ink2')}>{k} thesis</div>
                {editing ? (
                  <textarea
                    value={memo[k]}
                    onChange={(e) => save({ [k]: e.target.value } as any)}
                    className="min-h-[54px] w-full rounded-lg border border-line bg-bg p-2 text-[12.5px] leading-relaxed text-ink outline-none focus:border-brand"
                    aria-label={`${k} thesis`}
                  />
                ) : (
                  <p className="text-[12.5px] leading-relaxed text-ink2">{memo[k]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ListBlock title="Reasons to own" items={memo.reasonsToOwn} icon="check" tone="text-gain" />
            <ListBlock title="Reasons not to own" items={memo.reasonsNotToOwn} icon="x" tone="text-loss" />
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Key assumptions</div>
            {memo.assumptions.map((a, i) => <p key={i} className="py-0.5 text-[12.5px] leading-relaxed text-ink2">· {a}</p>)}
          </div>
          <div className="mt-3 rounded-xl bg-loss-soft/40 p-3">
            <div className="mb-1 text-[10.5px] font-bold uppercase tracking-wide text-loss">Thesis breakers — exit triggers, decided in advance</div>
            {memo.thesisBreakers.map((a, i) => <p key={i} className="py-0.5 text-[12.5px] leading-relaxed text-ink2">· {a}</p>)}
          </div>
        </Card>

        <Card pad>
          <SectionHead title="What changed vs the saved thesis" sub="Latest evidence mapped against assumptions" />
          {d.news.filter((n: any) => n.affectsAssumption).map((n: any, i: number) => (
            <div key={i} className="flex items-start gap-3 border-b border-line py-2.5 last:border-0">
              <Icon name={n.materiality === 'material' ? 'alert' : 'info'} size={14} className={cn('mt-0.5 shrink-0', n.materiality === 'material' ? 'text-warn' : 'text-info')} />
              <div className="min-w-0">
                <p className="text-[12.5px] leading-relaxed text-ink"><b>{n.title}</b> ({fmtDate(n.date, 'short')})</p>
                <p className="text-[11.5px] text-ink2">Tests assumption: <i>{n.affectsAssumption}</i> — {n.why}</p>
              </div>
            </div>
          ))}
          <p className="mt-2 text-[11px] text-ink3">
            Latest snapshot: {d.snapshots[d.snapshots.length - 1].note} No thesis-breaking condition triggered.
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <Card pad>
          <SectionHead title="Verdict" />
          <Badge tone={memo.status === 'Accumulate' ? 'gain' : ['Reduce', 'Exit', 'Avoid'].includes(memo.status) ? 'loss' : 'neutral'} className="text-[12px]">{memo.status}</Badge>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">{memo.statusRationale}</p>
          <div className="mt-3 space-y-0.5 border-t border-line pt-3">
            <KV k="Valuation range" v={`${sym}${memo.valuationRange.low} – ${sym}${memo.valuationRange.high}`} />
            <KV k="Expected return 1y" v={`${memo.expectedReturnPct.y1 >= 0 ? '+' : ''}${memo.expectedReturnPct.y1}%`} />
            <KV k="Expected return 3y" v={`+${memo.expectedReturnPct.y3}%`} />
            <KV k="Expected return 5y" v={`+${memo.expectedReturnPct.y5}%`} />
          </div>
          <p className="mt-2 text-[10.5px] text-ink3">Expected returns are model inferences from the scenario table — not promises.</p>
        </Card>

        <Card pad>
          <SectionHead title="Catalyst timeline" />
          {memo.catalysts.map((c, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-line py-2 last:border-0">
              <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface2/60">
                <span className="text-[8px] font-semibold uppercase text-ink3">{fmtDate(c.date, 'short').split(' ')[0]}</span>
                <span className="tnum text-[12px] font-bold leading-none text-ink">{fmtDate(c.date, 'short').split(' ')[1]}</span>
              </div>
              <span className="min-w-0 flex-1 text-[12px] leading-snug text-ink">{c.label}</span>
              <Badge tone="neutral">{c.kind}</Badge>
            </div>
          ))}
        </Card>

        <Card pad>
          <SectionHead title="Leading indicators to monitor" />
          {memo.leadingIndicators.map((l, i) => (
            <p key={i} className="flex items-center gap-2 py-1 text-[12px] text-ink2"><Icon name="eye" size={12} className="shrink-0 text-ink3" />{l}</p>
          ))}
        </Card>

        <Card pad>
          <SectionHead title="Your notes" sub="Device-local until the backend lands" />
          <textarea
            value={userState.notes ?? ''}
            onChange={(e) => { const next = { ...userState, notes: e.target.value }; setUserState(next); saveUserState(d.symbol, next) }}
            placeholder="Private research notes…"
            className="min-h-[90px] w-full rounded-lg border border-line bg-bg p-2.5 text-[12.5px] leading-relaxed text-ink outline-none focus:border-brand"
          />
        </Card>
      </div>
    </div>
  )
}

function ListBlock({ title, items, icon, tone }: { title: string; items: string[]; icon: any; tone: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">{title}</div>
      {items.map((x, i) => (
        <p key={i} className="flex items-start gap-2 py-0.5 text-[12.5px] leading-relaxed text-ink2">
          <Icon name={icon} size={12} className={cn('mt-1 shrink-0', tone)} />{x}
        </p>
      ))}
    </div>
  )
}

/* ---------------- News ---------------- */

function NewsTab({ d }: any) {
  const [showNoise, setShowNoise] = useState(false)
  const items = d.news.filter((n: any) => showNoise || n.materiality !== 'noise')
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[12px] text-ink2">{items.length} developments · classified by thesis impact, deduplicated</p>
          <button onClick={() => setShowNoise(!showNoise)} className="text-[11.5px] font-medium text-brand hover:underline">{showNoise ? 'Hide noise' : 'Show filtered noise'}</button>
        </div>
        {items.map((n: any, i: number) => (
          <Card key={i} pad>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={n.materiality === 'material' ? 'loss' : n.materiality === 'relevant' ? 'info' : 'neutral'}>{n.materiality}</Badge>
              <span className="tnum text-[11px] text-ink3">{fmtDate(n.date)}</span>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[10px] text-ink3">
                <Icon name="file" size={9} />{n.source.label} · {CLAIM_LABEL[n.source.kind]}
              </span>
            </div>
            <h3 className="mt-1.5 text-[13.5px] font-semibold leading-snug text-ink">{n.title}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink2"><b className="text-ink">Why it matters: </b>{n.why}</p>
            {n.affectsAssumption && <p className="mt-1 text-[11.5px] text-brand">→ maps to assumption: {n.affectsAssumption}</p>}
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {d.insiders && (
          <Card pad>
            <SectionHead title="Insider activity" sub="Sample data — live feed requires licensed provider" />
            {d.insiders.map((ins: any, i: number) => (
              <div key={i} className="flex items-center gap-3 border-b border-line py-2 text-[12px] last:border-0">
                <Badge tone={ins.action === 'buy' ? 'gain' : 'neutral'}>{ins.action}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{ins.who} · ${(ins.valueUsd / 1e6).toFixed(1)}M</span>
                  {ins.note && <span className="text-[10.5px] text-ink3">{ins.note}</span>}
                </span>
                <span className="tnum text-[10.5px] text-ink3">{fmtDate(ins.date, 'short')}</span>
              </div>
            ))}
          </Card>
        )}
        <Card pad>
          <SectionHead title="Claim types on this page" />
          {Object.entries(CLAIM_LABEL).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1 text-[11.5px]">
              <span className="text-ink2">{v}</span>
              <span className="text-[10px] text-ink3">{k === 'sample_data' ? 'this build' : 'live mode'}</span>
            </div>
          ))}
          <p className="mt-2 text-[10.5px] leading-relaxed text-ink3">
            Research disclaimer: this is decision-support tooling, not investment advice. Verify material figures against
            primary filings before acting.
          </p>
        </Card>
      </div>
    </div>
  )
}
