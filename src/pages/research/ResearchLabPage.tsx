import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { coverageUniverse, seriesFor, loadWeights } from '@/research/providers'
import { categoryScores, overallScore, dcfValue, classifyTrend, DEFAULT_WEIGHTS } from '@/research/engine'
import { FRAMEWORKS } from '@/research/frameworks'
import { fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Button, EmptyState } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

const TIER_META = {
  deep: { label: 'Deep coverage', tone: 'brand' as const },
  standard: { label: 'Standard', tone: 'info' as const },
  technical: { label: 'Technical only', tone: 'warn' as const },
  none: { label: 'Not covered', tone: 'neutral' as const },
}

export default function ResearchLabPage() {
  const app = useApp()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<'all' | 'portfolio' | 'watchlist'>('all')
  const weights = loadWeights() ?? DEFAULT_WEIGHTS

  const rows = useMemo(() => {
    return coverageUniverse()
      .filter((r) => (filter === 'portfolio' ? r.inPortfolio : filter === 'watchlist' ? r.onWatchlist : true))
      .map((r) => {
        if (!r.dossier) return { ...r, score: null as number | null, upside: null as number | null, method: '', trend: null as string | null }
        const { price, bench, current } = seriesFor(r.symbol)
        const scores = categoryScores(r.dossier, current, price, bench)
        // Use the dossier's primary method: SOTP when present (e.g. conglomerates), else DCF
        const sotp = r.dossier.valuation.sotp
        const modelValue = sotp
          ? sotp.reduce((s, x) => s + x.value, 0) / r.dossier.valuation.dcf.shares
          : dcfValue(r.dossier.valuation.dcf)
        return {
          ...r,
          score: overallScore(scores, weights),
          upside: ((modelValue - current) / current) * 100,
          method: sotp ? 'SOTP' : 'DCF',
          trend: classifyTrend(price),
        }
      })
  }, [filter, weights])

  const covered = rows.filter((r) => r.dossier)
  const lensRows = coverageUniverse().filter((r) => r.dossier)

  return (
    <div className="fade-up space-y-5">
      {/* Data integrity banner — always visible, never dismissible */}
      <Card pad className="border-info/30 bg-info-soft/30">
        <div className="flex items-start gap-3">
          <Icon name="info" size={16} className="mt-0.5 shrink-0 text-info" />
          <p className="text-[12px] leading-relaxed text-ink2">
            <b className="text-ink">Research data source: bundled sample dataset.</b> Historical figures are approximate,
            authored as of the labeled dates, and every claim is tagged by type (fact / management statement / consensus /
            model inference). No live data is being fetched. Connecting a licensed provider (see{' '}
            <span className="font-medium">docs/RESEARCH-LAB.md</span>) replaces this dataset without changing any analytics.
          </p>
        </div>
      </Card>

      {/* Coverage stats + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(['all', 'portfolio', 'watchlist'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn('rounded-full border px-3 py-1.5 text-[12px] font-medium capitalize transition-colors', filter === f ? 'border-brand bg-brand text-invert' : 'border-line bg-surface text-ink2 hover:border-brand')}
            >
              {f === 'all' ? 'Full universe' : f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11.5px] text-ink3">
          {covered.length} of {rows.length} names covered · {coverageUniverse().filter((r) => r.tier === 'deep').length} deep dossiers
        </span>
        <Link to="/research/compare"><Button size="sm" variant="secondary" icon="layers">Compare</Button></Link>
      </div>

      {/* Coverage table */}
      <Card pad={false} className="overflow-hidden">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[860px] text-[12.5px]">
            <thead className="border-b border-line bg-surface2/60 text-[10.5px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Security</th>
                <th className="px-3 py-2.5 text-left font-semibold">Coverage</th>
                <th className="px-3 py-2.5 text-left font-semibold">Held</th>
                <th className="px-3 py-2.5 text-right font-semibold">Overall score</th>
                <th className="px-3 py-2.5 text-right font-semibold">Model value vs price</th>
                <th className="px-3 py-2.5 text-left font-semibold">Trend</th>
                <th className="px-3 py-2.5 text-left font-semibold">Status</th>
                <th className="px-3 py-2.5 text-left font-semibold">Next catalyst</th>
                <th className="px-3 py-2.5 text-right font-semibold">Refreshed</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const cat = r.dossier?.memo.catalysts.find((c) => c.date >= '2026-07-20')
                const inner = (
                  <>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2.5">
                        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[9.5px] font-bold', r.dossier ? 'bg-brand-soft text-brand' : 'bg-surface2 text-ink3')}>{r.symbol.slice(0, 4)}</span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">{r.symbol}</span>
                          <span className="block max-w-[180px] truncate text-[10.5px] text-ink3">{r.name}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-3"><Badge tone={TIER_META[r.tier].tone}>{TIER_META[r.tier].label}</Badge></td>
                    <td className="px-3 py-3 text-[11px] text-ink2">{r.inPortfolio ? 'Portfolio' : ''}{r.inPortfolio && r.onWatchlist ? ' + ' : ''}{r.onWatchlist ? 'Watchlist' : ''}</td>
                    <td className="tnum px-3 py-3 text-right">
                      {r.score !== null ? (
                        <span className={cn('font-bold', r.score >= 7 ? 'text-gain' : r.score >= 5 ? 'text-ink' : 'text-warn')}>{r.score.toFixed(1)}<span className="text-[10px] font-normal text-ink3">/10</span></span>
                      ) : <span className="text-ink3">—</span>}
                    </td>
                    <td className="tnum px-3 py-3 text-right">
                      {r.upside !== null ? (
                        <span className={r.upside >= 0 ? 'text-gain' : 'text-loss'} title={`Primary method: ${(r as any).method}`}>
                          {r.upside >= 0 ? '+' : ''}{r.upside.toFixed(0)}% <span className="text-[9.5px] text-ink3">{(r as any).method}</span>
                        </span>
                      ) : <span className="text-ink3">—</span>}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] capitalize text-ink2">{r.trend ?? '—'}</td>
                    <td className="px-3 py-3">
                      {r.dossier ? (
                        <Badge tone={r.dossier.memo.status === 'Accumulate' ? 'gain' : r.dossier.memo.status === 'Reduce' || r.dossier.memo.status === 'Exit' || r.dossier.memo.status === 'Avoid' ? 'loss' : 'neutral'}>
                          {r.dossier.memo.status}
                        </Badge>
                      ) : <span className="block max-w-[220px] text-[11px] leading-snug text-ink3">{r.note}</span>}
                    </td>
                    <td className="px-3 py-3 text-[11.5px] text-ink2">{cat ? `${fmtDate(cat.date, 'short')} · ${cat.label.slice(0, 26)}` : '—'}</td>
                    <td className="tnum px-3 py-3 text-right text-[11px] text-ink3">{r.dossier ? relDate(r.dossier.dataProfile.asOf) : '—'}</td>
                  </>
                )
                return r.dossier ? (
                  <tr
                    key={r.symbol}
                    onClick={() => navigate(`/research/${r.symbol}`)}
                    className="cursor-pointer border-b border-line last:border-0 hover:bg-surface2/60"
                  >
                    {inner}
                  </tr>
                ) : (
                  <tr key={r.symbol} className="border-b border-line opacity-60 last:border-0" title={r.note}>{inner}</tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Investor Lens Matrix */}
      <Card pad={false} className="overflow-hidden">
        <div className="px-5 pt-4">
          <SectionHead
            title="Investor Lens Matrix"
            sub="Each company scored through 11 documented investor frameworks. Cells answer: would this lens own it? Hover a framework name for its focus."
          />
        </div>
        <div className="scroll-thin overflow-x-auto pb-2">
          <table className="w-full min-w-[900px] text-[12px]">
            <thead className="text-[10px] uppercase tracking-wide text-ink3">
              <tr>
                <th className="px-5 py-2 text-left font-semibold">Framework</th>
                {lensRows.map((r) => (
                  <th key={r.symbol} className="px-2 py-2 text-center font-semibold"><Link to={`/research/${r.symbol}`} className="hover:text-brand">{r.symbol}</Link></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRAMEWORKS.map((fw) => (
                <tr key={fw.id} className="border-t border-line">
                  <td className="px-5 py-2 text-ink2" title={fw.focus}>{fw.name}</td>
                  {lensRows.map((r) => {
                    const ev = r.dossier!.frameworks.find((f) => f.id === fw.id)
                    const s = ev?.score ?? null
                    return (
                      <td key={r.symbol} className="px-2 py-1.5 text-center">
                        {s !== null ? (
                          <span
                            title={ev!.verdict}
                            className={cn('tnum inline-flex h-7 w-9 items-center justify-center rounded-md text-[11.5px] font-bold',
                              s >= 7.5 ? 'bg-gain-soft text-gain' : s >= 5.5 ? 'bg-surface2 text-ink' : s >= 4 ? 'bg-warn-soft text-warn' : 'bg-loss-soft text-loss')}
                          >
                            {s.toFixed(1)}
                          </span>
                        ) : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-line bg-surface2/50 font-semibold">
                <td className="px-5 py-2">Average</td>
                {lensRows.map((r) => {
                  const avg = r.dossier!.frameworks.reduce((s, f) => s + f.score, 0) / r.dossier!.frameworks.length
                  return <td key={r.symbol} className="tnum px-2 py-2 text-center">{avg.toFixed(1)}</td>
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-5 py-3 text-[11px] leading-relaxed text-ink3">
          Low scores are informative, not disqualifying — Graham penalizes every intangible-moat compounder and Fundsmith
          structurally rejects REITs and conglomerates. Contradictions between lenses are highlighted on each dossier's Lenses tab.
        </p>
      </Card>
    </div>
  )
}
