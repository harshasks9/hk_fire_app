import React from 'react'
import { Link } from 'react-router-dom'
import {
  FORENSIC_MEMOS,
  weightedValue,
  weightedUpsidePct,
  weightedIrrPct,
  aumQualityScore,
  type ForensicMemo,
} from '@/research/forensic'
import { Card, SectionHead, Badge, Button, Divider, type BadgeTone } from '@/components/ui'
import { AreaChart } from '@/components/charts'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

const RATING_TONE: Record<string, BadgeTone> = {
  'Materially undervalued': 'gain',
  'Moderately undervalued': 'gain',
  'Fairly valued': 'neutral',
  'Moderately overvalued': 'loss',
  'Materially overvalued': 'loss',
}

export default function ForensicIndexPage() {
  return (
    <div className="fade-up space-y-5 pb-10">
      <Card pad className="border-brand/30 bg-brand-soft/20">
        <div className="flex items-start gap-3">
          <Icon name="peak" size={18} className="mt-0.5 shrink-0 text-brand" />
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight text-ink">Forensic memoranda — alternative asset managers</h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink2">
              Adversarial investment-committee memoranda on listed alternative asset managers, written to a single
              standard: value the business on manager economics — fee-paying capital, fee rates, fee-related earnings,
              distributable earnings, duration, dilution — and judge every claim against{' '}
              <b className="text-ink">what reached the listed share</b>, not what reached assets under management.
            </p>
            <p className="mt-2 max-w-3xl text-[12.5px] leading-relaxed text-ink2">
              Each memo carries a confidence tier on every figure, an explicit per-share bridge, a dividend-coverage
              test, a red-team case against its own conclusion, three dated falsifiable predictions, and pre-committed
              kill criteria. The methodology is versioned at{' '}
              <span className="font-medium text-ink">docs/FORENSIC-ASSET-MANAGER-PROMPT.md</span>.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        {FORENSIC_MEMOS.map((m) => (
          <MemoCard key={m.symbol} memo={m} />
        ))}
      </div>

      <Card pad>
        <SectionHead
          title="Side by side"
          sub="Two cheap alternative managers, cheap for opposite reasons. Read the pair, not either alone."
        />
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
            <thead>
              <tr>
                <th className="border-b border-line pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink3">
                  Dimension
                </th>
                {FORENSIC_MEMOS.map((m) => (
                  <th
                    key={m.symbol}
                    className="border-b border-line pb-2 text-right text-[11px] font-semibold uppercase tracking-wide text-ink3"
                  >
                    {m.symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="border-b border-line/60 py-2.5 align-top text-ink2">
                    {row.label}
                    {row.note && <div className="mt-0.5 text-[11px] leading-snug text-ink3">{row.note}</div>}
                  </td>
                  {FORENSIC_MEMOS.map((m) => (
                    <td key={m.symbol} className="tnum border-b border-line/60 py-2.5 text-right align-top text-ink">
                      {row.get(m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 rounded-ctl border border-line bg-surface2 p-4 text-[12.5px] leading-relaxed text-ink2">
          <b className="text-ink">If forced to own one.</b> Patria, on the arithmetic — a wider discount, a dividend
          covered twice over, no gated vehicles, and a per-share stagnation whose single dominant cause (a
          distributable-earnings-to-fee-earnings ratio that fell from 164% to 99%) cannot repeat, because it has already
          fully played out. Blue Owl owns the better franchise and the better fee rate, but it must both rebase a
          dividend it has over-paid for two years and clear a redemption queue before the market will re-rate it. Own
          both only if you accept that they share one macro exposure: the multiple the market pays for private-markets
          fee streams.
        </p>
      </Card>
    </div>
  )
}

const COMPARE_ROWS: { label: string; note?: string; get: (m: ForensicMemo) => string }[] = [
  { label: 'Share price', get: (m) => `$${m.price.toFixed(2)}` },
  { label: 'Market capitalisation', get: (m) => `$${m.marketCap.toFixed(2)}bn` },
  { label: 'Price / fee-related earnings', get: (m) => `${(m.peers.find((p) => p.ticker === m.symbol)?.pFre ?? 0).toFixed(1)}×` },
  { label: 'FRE growth, latest quarter', get: (m) => `${m.peers.find((p) => p.ticker === m.symbol)?.freGrowthPct ?? 0}%` },
  { label: 'FRE margin', get: (m) => `${(m.peers.find((p) => p.ticker === m.symbol)?.freMarginPct ?? 0).toFixed(1)}%` },
  { label: 'Dividend yield', get: (m) => `${m.dividendYieldPct.toFixed(1)}%` },
  {
    label: 'Dividend as % of DE',
    note: 'The single sharpest difference between the two',
    get: (m) => {
      const last = [...m.dividendCoverage].reverse().find((d) => d.payoutPct !== null)
      return last?.payoutPct ? `${last.payoutPct}%` : '—'
    },
  },
  { label: 'Permanent capital', get: (m) => m.peers.find((p) => p.ticker === m.symbol)?.permCapital ?? '—' },
  { label: 'AUM quality score', note: 'Mean of eight economic dimensions, 0–10', get: (m) => `${aumQualityScore(m).toFixed(1)}` },
  { label: 'Gated vehicles', get: (m) => (m.redemptions ? `Yes — ${m.redemptions.length}` : 'None') },
  { label: 'Base-case value', get: (m) => `$${(m.scenarios.find((s) => s.name === 'Base')?.targetPrice ?? 0).toFixed(2)}` },
  { label: 'Probability-weighted value', get: (m) => `$${weightedValue(m).toFixed(2)}` },
  { label: 'Upside to weighted value', get: (m) => `${weightedUpsidePct(m) > 0 ? '+' : ''}${weightedUpsidePct(m).toFixed(0)}%` },
  { label: 'Expected 5-year annualised', get: (m) => `${weightedIrrPct(m).toFixed(1)}%` },
  { label: 'Rating', get: (m) => m.rating },
]

function MemoCard({ memo }: { memo: ForensicMemo }) {
  const upside = weightedUpsidePct(memo)
  const base = memo.scenarios.find((s) => s.name === 'Base')?.targetPrice ?? 0

  return (
    <Card pad className="flex min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[16px] font-semibold tracking-tight text-ink">
              {memo.symbol} <span className="font-normal text-ink3">{memo.exchange}</span>
            </h2>
            <Badge tone={RATING_TONE[memo.rating] ?? 'neutral'}>{memo.rating}</Badge>
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink2">{memo.name}</p>
        </div>
        <div className="shrink-0 text-right">
          <div className="tnum text-[18px] font-semibold leading-none text-ink">${memo.price.toFixed(2)}</div>
          <div className={cn('tnum mt-1 text-[12px]', upside > 0 ? 'text-gain' : 'text-loss')}>
            {upside > 0 ? '+' : ''}
            {upside.toFixed(0)}%
          </div>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed text-ink">{memo.headline}</p>

      <div className="mt-4 min-w-0">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[11.5px] text-ink3">
            {memo.symbol === 'OWL' ? 'AUM' : 'Fee-related earnings'} vs. DE per share, indexed to{' '}
            {memo.indexed.labels[0]} = 100
          </span>
          <span className="tnum text-[11.5px] text-ink2">
            {memo.indexed.aum[memo.indexed.aum.length - 1]} vs {memo.indexed.dePs[memo.indexed.dePs.length - 1]}
          </span>
        </div>
        <AreaChart
          data={memo.indexed.aum}
          compare={memo.indexed.dePs}
          labels={memo.indexed.labels}
          height={140}
          color="var(--m-chart-2)"
          compareColor="var(--m-chart-4)"
          seriesLabel={memo.symbol === 'OWL' ? 'AUM' : 'FRE'}
          compareLabel="DE/share"
          valueFormat={(v) => v.toFixed(0)}
          summary={`${memo.symbol}: platform growth versus distributable earnings per share, indexed`}
        />
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {[
            { label: memo.symbol === 'OWL' ? 'Total AUM' : 'Fee-related earnings', color: 'var(--m-chart-2)', dashed: false },
            { label: 'DE per share', color: 'var(--m-chart-4)', dashed: true },
          ].map((i) => (
            <span key={i.label} className="inline-flex items-center gap-1.5 text-[11px] text-ink2">
              <span
                aria-hidden
                className="h-0 w-4 rounded-full border-t-2"
                style={{ borderColor: i.color, borderTopStyle: i.dashed ? 'dashed' : 'solid' }}
              />
              {i.label}
            </span>
          ))}
        </div>
      </div>

      <Divider className="my-4" />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px] sm:grid-cols-4">
        {memo.headlineStats.slice(0, 4).map((s) => (
          <div key={s.label}>
            <div className="text-[11px] leading-tight text-ink3">{s.label}</div>
            <div
              className={cn(
                'tnum mt-0.5 text-[15px] font-semibold',
                s.tone === 'gain' && 'text-gain',
                s.tone === 'loss' && 'text-loss',
                s.tone === 'warn' && 'text-warn',
                (!s.tone || s.tone === 'neutral') && 'text-ink',
              )}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-ctl border border-loss/25 bg-loss-soft/15 p-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-wide text-loss">The bear&apos;s single best fact</span>
        <p className="mt-1 text-[12px] leading-relaxed text-ink2">{memo.debate.bearsBestFact}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pt-1">
        <div className="tnum text-[12px] text-ink2">
          Base case <b className="text-ink">${base.toFixed(2)}</b> · {memo.latestPeriod.split(' (')[0]}
        </div>
        <Link to={`/research/forensic/${memo.symbol.toLowerCase()}`}>
          <Button variant="primary" size="sm" icon="book">
            Read the memo
          </Button>
        </Link>
      </div>
    </Card>
  )
}
