import React, { useMemo, useState } from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  forensicMemo,
  weightedValue,
  weightedUpsidePct,
  weightedIrrPct,
  sotpTotal,
  sotpPerShare,
  aumQualityScore,
  TIER_META,
  type Tier,
  type ForensicMemo,
} from '@/research/forensic'
import { Card, SectionHead, Badge, Button, Divider, type BadgeTone } from '@/components/ui'
import { AreaChart, Waterfall, DonutRing, CHART_COLORS } from '@/components/charts'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

/* ------------------------------------------------------------------ helpers */

function TierChip({ tier, className }: { tier: Tier; className?: string }) {
  return (
    <span
      title={`${TIER_META[tier].label} — ${TIER_META[tier].desc}`}
      className={cn(
        'tnum inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[9.5px] font-semibold leading-none',
        tier === 'A' && 'border-transparent bg-gain-soft text-gain',
        tier === 'B' && 'border-transparent bg-brand-soft text-brand',
        tier === 'C' && 'border-transparent bg-warn-soft text-warn',
        tier === 'D' && 'border-line bg-surface2 text-ink3',
        className,
      )}
    >
      {tier}
    </span>
  )
}

const RATING_TONE: Record<string, BadgeTone> = {
  'Materially undervalued': 'gain',
  'Moderately undervalued': 'gain',
  'Fairly valued': 'neutral',
  'Moderately overvalued': 'loss',
  'Materially overvalued': 'loss',
}

const STATUS_TONE: Record<string, BadgeTone> = {
  Exceeded: 'gain',
  'On track': 'brand',
  Met: 'brand',
  'Behind plan': 'loss',
  'Achieved by acquisition': 'warn',
  'No longer measurable': 'neutral',
  Improved: 'gain',
  'In line': 'neutral',
  Deteriorated: 'loss',
  Deferred: 'warn',
  'Pulled forward': 'warn',
  Premium: 'gain',
  Market: 'neutral',
  Discount: 'loss',
  High: 'loss',
  Medium: 'warn',
  Low: 'neutral',
  Conservative: 'gain',
  Reasonable: 'neutral',
  Aggressive: 'loss',
}

function Section({
  id,
  n,
  title,
  sub,
  children,
  right,
}: {
  id: string
  n: number
  title: string
  sub?: string
  children: React.ReactNode
  right?: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionHead
        title={
          <span className="flex items-baseline gap-2">
            <span className="tnum text-[11px] font-semibold text-ink3">{String(n).padStart(2, '0')}</span>
            {title}
          </span>
        }
        sub={sub}
        right={right}
      />
      {children}
    </section>
  )
}

/** Horizontally scrollable table shell — dense tables must never scroll the page body.
 *  `minW` shrinks for tables nested inside a half-width column, so their right-hand
 *  columns stay on screen instead of disappearing behind a scrollbar. */
function TableWrap({
  children,
  className,
  minW = 640,
  bleed = true,
}: {
  children: React.ReactNode
  className?: string
  minW?: number
  /** Full-width tables bleed into the card padding; tables nested in a column must not.
   *  This is a prop rather than an override class because `cn` is a plain join with no
   *  Tailwind conflict resolution — "mx-0" would not reliably cancel "-mx-5". */
  bleed?: boolean
}) {
  return (
    <div className={cn('overflow-x-auto', bleed && '-mx-5 px-5', className)}>
      <table className="w-full border-collapse text-[12.5px]" style={{ minWidth: minW }}>
        {children}
      </table>
    </div>
  )
}

const TH = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <th className={cn('border-b border-line pb-2 pl-3 text-left text-[11px] font-semibold uppercase tracking-wide text-ink3 first:pl-0', className)}>
    {children}
  </th>
)
const TD = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <td className={cn('border-b border-line/60 py-2.5 pl-3 align-top text-ink2 first:pl-0', className)}>{children}</td>
)

const num = (v: number | null, d = 1, suffix = '') => (v === null || v === undefined ? '—' : `${v.toFixed(d)}${suffix}`)

/** Per-share and index series are outside the money formatter's useful range — format them explicitly. */
const fmtPerShare = (v: number) => `$${v.toFixed(2)}`
const fmtIndex = (v: number) => v.toFixed(0)

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink2">
          <span
            aria-hidden
            className="h-0 w-4 rounded-full border-t-2"
            style={{ borderColor: i.color, borderTopStyle: i.dashed ? 'dashed' : 'solid' }}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ page */

const SECTIONS = [
  { id: 'summary', label: 'Summary' },
  { id: 'debate', label: 'The debate' },
  { id: 'quarter', label: 'This quarter' },
  { id: 'trajectory', label: 'Trajectory' },
  { id: 'pershare', label: 'Per-share bridge' },
  { id: 'scorecard', label: 'Since listing' },
  { id: 'segments', label: 'Business lines' },
  { id: 'capital', label: 'Capital quality' },
  { id: 'quality', label: 'Earnings quality' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'peers', label: 'Peers' },
  { id: 'valuation', label: 'Valuation' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'redteam', label: 'Red team' },
  { id: 'risks', label: 'Risks' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'conclusion', label: 'Conclusion' },
  { id: 'sources', label: 'Sources' },
]

export default function ForensicMemoPage() {
  const { symbol = '' } = useParams()
  const memo = forensicMemo(symbol)
  if (!memo) return <Navigate to="/research/forensic" replace />
  return <Memo memo={memo} key={memo.symbol} />
}

function Memo({ memo }: { memo: ForensicMemo }) {
  const [showAllQuarter, setShowAllQuarter] = useState(false)

  const wv = weightedValue(memo)
  const upside = weightedUpsidePct(memo)
  const irr = weightedIrrPct(memo)
  const sotpPs = sotpPerShare(memo)
  const quality = aumQualityScore(memo)

  const quarterRows = showAllQuarter ? memo.quarter : memo.quarter.slice(0, 7)

  const feeSlices = useMemo(
    () => memo.segments.map((s, i) => ({ label: s.name, value: s.share, color: CHART_COLORS[i % CHART_COLORS.length] })),
    [memo.segments],
  )

  // Scenario range for the value bar
  const lo = Math.min(...memo.scenarios.map((s) => s.targetPrice), memo.price)
  const hi = Math.max(...memo.scenarios.map((s) => s.targetPrice), memo.price)
  const pos = (v: number) => ((v - lo) / (hi - lo || 1)) * 100

  return (
    <div className="fade-up space-y-6 pb-10">
      {/* ---------------------------------------------------------- integrity */}
      <Card pad className="border-warn/30 bg-warn-soft/25">
        <div className="flex items-start gap-3">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
          <div className="space-y-2 text-[12px] leading-relaxed text-ink2">
            <p>
              <b className="text-ink">Independent research, not investment advice.</b> Every figure carries a confidence
              tier: <TierChip tier="A" /> reported · <TierChip tier="B" /> our arithmetic on reported figures ·{' '}
              <TierChip tier="C" /> secondary source · <TierChip tier="D" /> our estimate. No valuation conclusion here
              rests on a tier C or D figure alone.
            </p>
            <p>{memo.sourceCaveat}</p>
          </div>
        </div>
      </Card>

      {/* ---------------------------------------------------------- masthead */}
      <Card pad>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-tight text-ink">
                {memo.name} <span className="text-ink3">({memo.exchange}: {memo.symbol})</span>
              </h1>
              <Badge tone={RATING_TONE[memo.rating] ?? 'neutral'}>{memo.rating}</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-ink">{memo.headline}</p>
            <p className="mt-2 text-[12px] text-ink3">
              Analysis cut {memo.asOf} · latest reported period: {memo.latestPeriod}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="tnum text-[26px] font-semibold leading-none text-ink">${memo.price.toFixed(2)}</div>
            <div className="mt-1 text-[11.5px] text-ink3">{memo.priceAsOf}</div>
            <div className="tnum mt-3 text-[13px] font-medium text-ink">
              Base case ${memo.scenarios.find((s) => s.name === 'Base')?.targetPrice.toFixed(2)}
            </div>
            <div className={cn('tnum text-[12px]', upside > 0 ? 'text-gain' : 'text-loss')}>
              {upside > 0 ? '+' : ''}
              {upside.toFixed(0)}% to weighted fair value
            </div>
          </div>
        </div>

        {/* headline stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {memo.headlineStats.map((s) => (
            <div key={s.label} className="rounded-ctl border border-line bg-surface2 p-3">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[11px] leading-tight text-ink3">{s.label}</span>
                <TierChip tier={s.tier} />
              </div>
              <div
                className={cn(
                  'tnum mt-1.5 text-[19px] font-semibold leading-none',
                  s.tone === 'gain' && 'text-gain',
                  s.tone === 'loss' && 'text-loss',
                  s.tone === 'warn' && 'text-warn',
                  (!s.tone || s.tone === 'neutral') && 'text-ink',
                )}
              >
                {s.value}
              </div>
              {s.sub && <div className="mt-1 text-[11px] leading-snug text-ink3">{s.sub}</div>}
            </div>
          ))}
        </div>
      </Card>

      {/* ---------------------------------------------------------- nav
          Buttons, not anchors: the app runs on a HashRouter, so an `href="#id"`
          would overwrite the route hash and navigate away from the memo. */}
      <nav aria-label="Memo sections" className="-mx-1 flex flex-wrap gap-1.5 px-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11.5px] text-ink2 transition-colors hover:border-brand/40 hover:text-ink"
          >
            {s.label}
          </button>
        ))}
      </nav>

      {/* ---------------------------------------------------------- 01 summary */}
      <Card pad>
        <Section id="summary" n={1} title="Investment conclusion" sub="The one page, if you read nothing else.">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0 space-y-3 text-[13px] leading-relaxed text-ink2">
              <p className="text-ink">{memo.headline}</p>
              <p>{memo.debate.marketBelieves}</p>
              <p>
                <b className="text-ink">What the market may be underestimating. </b>
                {memo.debate.underestimated}
              </p>
              <p>
                <b className="text-ink">What could make the discount permanent. </b>
                {memo.debate.deRating}
              </p>
            </div>
            <div className="space-y-3">
              <div className="rounded-ctl border border-line bg-surface2 p-4">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink3">Value range</h3>
                <div className="relative mt-4 h-1.5 rounded-full bg-line">
                  {memo.scenarios.map((s) => (
                    <span
                      key={s.name}
                      title={`${s.name}: $${s.targetPrice.toFixed(2)}`}
                      className={cn(
                        'absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface',
                        s.name === 'Bear' && 'bg-loss',
                        s.name === 'Base' && 'bg-brand',
                        s.name === 'Bull' && 'bg-gain',
                      )}
                      style={{ left: `${pos(s.targetPrice)}%` }}
                    />
                  ))}
                  <span
                    title={`Current price $${memo.price.toFixed(2)}`}
                    className="absolute top-1/2 h-5 w-0.5 -translate-y-1/2 rounded bg-ink"
                    style={{ left: `${pos(memo.price)}%` }}
                  />
                </div>
                <div className="tnum mt-3 space-y-1.5 text-[12px]">
                  {memo.scenarios.map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <span className="text-ink2">
                        {s.name} <span className="text-ink3">({(s.probability * 100).toFixed(0)}%)</span>
                      </span>
                      <span className="font-medium text-ink">${s.targetPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <Divider className="my-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-ink2">Probability-weighted</span>
                    <span className="font-semibold text-ink">${wv.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink2">Current price</span>
                    <span className="font-medium text-ink">${memo.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink2">Expected 5-yr annualised</span>
                    <span className={cn('font-semibold', irr > 0 ? 'text-gain' : 'text-loss')}>{irr.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div className="rounded-ctl border border-line bg-surface2 p-4 text-[12px] leading-relaxed text-ink2">
                <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink3">Position</h3>
                <p className="mt-2">{memo.positionSizing}</p>
                <Divider className="my-2.5" />
                <p>
                  <b className="text-ink">Upgrade at</b> {memo.ratingChangesAt.upgrade}
                </p>
                <p className="mt-1.5">
                  <b className="text-ink">Downgrade at</b> {memo.ratingChangesAt.downgrade}
                </p>
                <Divider className="my-2.5" />
                <p>
                  <b className="text-ink">Horizon</b> {memo.horizon}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 02 debate */}
      <Card pad>
        <Section id="debate" n={2} title="The investment question" sub="Stated once, then tested for the rest of the memo.">
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { t: 'What must go right', b: memo.debate.mustGoRight, tone: 'brand' as BadgeTone },
              { t: "The bear's single best fact", b: memo.debate.bearsBestFact, tone: 'loss' as BadgeTone },
            ].map((x) => (
              <div key={x.t} className="rounded-ctl border border-line bg-surface2 p-4">
                <Badge tone={x.tone}>{x.t}</Badge>
                <p className="mt-2.5 text-[13px] leading-relaxed text-ink2">{x.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wide text-ink3">The two or three variables that decide the return</h3>
            <ol className="mt-2 space-y-2">
              {memo.debate.swingFactors.map((f, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink2">
                  <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                    {i + 1}
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ol>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 03 quarter */}
      <Card pad>
        <Section
          id="quarter"
          n={3}
          title="What changed in the latest quarter"
          sub={memo.latestPeriod}
          right={
            <Button size="sm" variant="ghost" onClick={() => setShowAllQuarter((v) => !v)}>
              {showAllQuarter ? 'Show fewer' : `Show all ${memo.quarter.length}`}
            </Button>
          }
        >
          <p className="mb-4 max-w-4xl text-[13px] leading-relaxed text-ink2">{memo.quarterNarrative}</p>
          <TableWrap>
            <thead>
              <tr>
                <TH>Metric</TH>
                <TH className="text-right">Latest</TH>
                <TH className="text-right">YoY</TH>
                <TH className="text-right">QoQ</TH>
                <TH>Driver</TH>
                <TH>Verdict</TH>
              </tr>
            </thead>
            <tbody>
              {quarterRows.map((r) => (
                <tr key={r.metric}>
                  <TD className="font-medium text-ink">
                    <span className="flex items-center gap-1.5">
                      {r.metric} <TierChip tier={r.tier} />
                    </span>
                    {r.note && <div className="mt-1 max-w-md text-[11.5px] leading-snug text-ink3">{r.note}</div>}
                  </TD>
                  <TD className="tnum whitespace-nowrap text-right font-medium text-ink">{r.latest}</TD>
                  <TD className="tnum whitespace-nowrap text-right">{r.yoy}</TD>
                  <TD className="tnum whitespace-nowrap text-right">{r.qoq}</TD>
                  <TD className="whitespace-nowrap">{r.driver}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[r.verdict] ?? 'neutral'}>{r.verdict}</Badge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <h3 className="mb-3 mt-7 text-[13px] font-semibold text-ink">Management narrative vs. economic reality</h3>
          <div className="space-y-3">
            {memo.narrative.map((n, i) => (
              <div key={i} className="rounded-ctl border border-line bg-surface2 p-4">
                <div className="flex items-start gap-2">
                  <Icon name="alert" size={14} className={cn('mt-0.5 shrink-0', n.challenged ? 'text-warn' : 'text-ink3')} />
                  <p className="text-[13px] font-medium leading-relaxed text-ink">{n.claim}</p>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-gain">Supporting</span>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{n.support}</p>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-loss">Contradicting / qualifying</span>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink2">{n.contradiction}</p>
                  </div>
                </div>
                <p className="mt-3 border-t border-line pt-2.5 text-[12.5px] leading-relaxed text-ink">
                  <b>Verdict. </b>
                  {n.verdict}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 04 trajectory */}
      <Card pad>
        <Section
          id="trajectory"
          n={4}
          title="Twelve-month operating trajectory"
          sub="Per-share earnings by quarter, and the gap between platform growth and shareholder earnings."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="mb-1 text-[12.5px] font-medium text-ink">Per-share FRE and DE by period</h3>
              <p className="mb-3 text-[11.5px] text-ink3">
                The distance between the two lines is everything that sits below fee-related earnings — interest, tax
                and corporate cost.
              </p>
              <AreaChart
                data={memo.trajectory.frePs}
                compare={memo.trajectory.dePs}
                labels={memo.trajectory.labels}
                height={210}
                seriesLabel="FRE/share"
                compareLabel="DE/share"
                compareColor="var(--m-chart-4)"
                valueFormat={fmtPerShare}
                summary={`${memo.symbol} per-share fee-related and distributable earnings across ${memo.trajectory.labels.length} periods`}
              />
              <Legend
                items={[
                  { label: 'FRE per share', color: 'var(--m-chart-1)' },
                  { label: 'DE per share', color: 'var(--m-chart-4)', dashed: true },
                ]}
              />
            </div>
            <div className="min-w-0">
              <h3 className="mb-1 text-[12.5px] font-medium text-ink">
                {memo.symbol === 'OWL' ? 'Total AUM' : 'Fee-related earnings'} vs. DE per share
              </h3>
              <p className="mb-3 text-[11.5px] text-ink3">
                Indexed to {memo.indexed.labels[0]} = 100. The gap between the two lines is the growth that did not
                reach the listed share. We index {memo.symbol === 'OWL' ? 'AUM' : 'FRE'} because that is the series
                reported for every period in this company&apos;s history.
              </p>
              <AreaChart
                data={memo.indexed.aum}
                compare={memo.indexed.dePs}
                labels={memo.indexed.labels}
                height={210}
                color="var(--m-chart-2)"
                compareColor="var(--m-chart-4)"
                seriesLabel={memo.symbol === 'OWL' ? 'AUM index' : 'FRE index'}
                compareLabel="DE/share index"
                valueFormat={fmtIndex}
                summary={`Platform growth index versus distributable earnings per share index for ${memo.symbol}`}
              />
              <Legend
                items={[
                  { label: memo.symbol === 'OWL' ? 'Total AUM' : 'Fee-related earnings', color: 'var(--m-chart-2)' },
                  { label: 'DE per share', color: 'var(--m-chart-4)', dashed: true },
                ]}
              />
              <div className="tnum mt-2 flex justify-between rounded-ctl border border-line bg-surface2 px-3 py-2 text-[12px]">
                <span className="text-ink2">Final period</span>
                <span className="text-ink">
                  Platform <b>{memo.indexed.aum[memo.indexed.aum.length - 1]}</b> · Per share{' '}
                  <b>{memo.indexed.dePs[memo.indexed.dePs.length - 1]}</b>
                </span>
              </div>
            </div>
          </div>

          <h3 className="mb-2 mt-7 text-[13px] font-semibold text-ink">Historical model</h3>
          <TableWrap>
            <thead>
              <tr>
                <TH>Period</TH>
                <TH className="text-right">AUM $bn</TH>
                <TH className="text-right">Fee-paying $bn</TH>
                <TH className="text-right">FRE/sh</TH>
                <TH className="text-right">DE/sh</TH>
                <TH className="text-right">FRE margin</TH>
                <TH className="text-right">Dividend/sh</TH>
              </tr>
            </thead>
            <tbody>
              {memo.history.map((h) => (
                <tr key={h.period}>
                  <TD className="font-medium text-ink">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      {h.period} <TierChip tier={h.tier} />
                    </span>
                    {h.note && <div className="mt-1 max-w-lg text-[11.5px] leading-snug text-ink3">{h.note}</div>}
                  </TD>
                  <TD className="tnum text-right">{num(h.aum, 1)}</TD>
                  <TD className="tnum text-right">{num(h.fpaum, 1)}</TD>
                  <TD className="tnum text-right">{h.frePs === null ? '—' : `$${h.frePs.toFixed(2)}`}</TD>
                  <TD className="tnum text-right font-medium text-ink">{h.dePs === null ? '—' : `$${h.dePs.toFixed(3).replace(/0$/, '')}`}</TD>
                  <TD className="tnum text-right">{num(h.freMarginPct, 1, '%')}</TD>
                  <TD className="tnum text-right">{h.dividendPs === null ? '—' : `$${h.dividendPs.toFixed(2)}`}</TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-2 text-[11.5px] text-ink3">
            Empty cells are figures we could not source. They are never interpolated.
          </p>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 05 per-share bridge */}
      <Card pad>
        <Section
          id="pershare"
          n={5}
          title="Per-share bridge"
          sub={`Where the growth went, ${memo.bridge.period}. This is the arithmetic aggregate headlines hide.`}
        >
          <div className="space-y-2">
            {memo.bridge.terms.map((t, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-wrap items-start justify-between gap-x-4 gap-y-1 rounded-ctl border px-4 py-3',
                  t.effect === 'positive' && 'border-gain/25 bg-gain-soft/25',
                  t.effect === 'negative' && 'border-loss/25 bg-loss-soft/25',
                  t.effect === 'neutral' && 'border-line bg-surface2',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-ink">{t.label}</div>
                  <div className="mt-0.5 text-[11.5px] leading-snug text-ink3">{t.detail}</div>
                </div>
                <div
                  className={cn(
                    'tnum shrink-0 text-[16px] font-semibold',
                    t.effect === 'positive' && 'text-gain',
                    t.effect === 'negative' && 'text-loss',
                    t.effect === 'neutral' && 'text-ink',
                  )}
                >
                  {t.value}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-ctl border border-brand/25 bg-brand-soft/25 p-4 text-[13px] leading-relaxed text-ink">
            {memo.bridge.conclusion}
          </p>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 06 scorecard */}
      <Card pad>
        <Section id="scorecard" n={6} title="Progress since listing" sub="Every commitment made at or since listing, graded.">
          <TableWrap>
            <thead>
              <tr>
                <TH>Commitment</TH>
                <TH>Target</TH>
                <TH>Actual</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {memo.scorecard.map((s) => (
                <tr key={s.commitment}>
                  <TD className="font-medium text-ink">
                    <span className="flex items-center gap-1.5">
                      {s.commitment} <TierChip tier={s.tier} />
                    </span>
                  </TD>
                  <TD className="whitespace-nowrap">{s.target}</TD>
                  <TD className="text-ink">
                    {s.actual}
                    <div className="mt-1 max-w-md text-[11.5px] leading-snug text-ink3">{s.note}</div>
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[s.status] ?? 'neutral'}>{s.status}</Badge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 07 segments */}
      <Card pad>
        <Section
          id="segments"
          n={7}
          title="Business-line economics"
          sub="Which platforms deserve a premium multiple and which deserve a discount."
        >
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <div className="min-w-0">
              <DonutRing
                slices={feeSlices}
                centerTitle="Fee mix"
                centerValue={`${memo.segments.length}`}
                size={180}
              />
              <p className="mt-3 text-[11.5px] leading-snug text-ink3">
                Share of management fees by platform{memo.segments[0]?.tier === 'D' ? ' (estimated — the company reports a single segment)' : ''}.
              </p>
            </div>
            <div className="min-w-0 space-y-3">
              {memo.segments.map((s, i) => (
                <div key={s.name} className="rounded-ctl border border-line bg-surface2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[13.5px] font-semibold text-ink">{s.name}</span>
                      <TierChip tier={s.tier} />
                    </div>
                    <Badge tone={STATUS_TONE[s.multipleView] ?? 'neutral'}>{s.multipleView} multiple</Badge>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px] sm:grid-cols-4">
                    <div>
                      <span className="text-ink3">Mgmt fees</span>
                      <div className="tnum text-ink">{s.mgmtFee}</div>
                    </div>
                    <div>
                      <span className="text-ink3">Share of fees</span>
                      <div className="tnum text-ink">{s.share}%</div>
                    </div>
                    <div>
                      <span className="text-ink3">Fee rate</span>
                      <div className="tnum text-ink">{s.feeRate}</div>
                    </div>
                    <div>
                      <span className="text-ink3">Duration</span>
                      <div className="text-ink">{s.duration}</div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink2">{s.comment}</p>
                  <p className="mt-1.5 text-[11.5px] text-ink3">Origin: {s.organic}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 08 capital quality */}
      <Card pad>
        <Section
          id="capital"
          n={8}
          title="Capital quality — both sides of the balance"
          sub="Not every dollar of AUM is worth the same. And the liability side is where 2026 was decided."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <div className="mb-3 flex items-baseline justify-between">
                <h3 className="text-[12.5px] font-medium text-ink">AUM quality scorecard</h3>
                <span className="tnum text-[12px] text-ink2">
                  mean <b className="text-ink">{quality.toFixed(1)}</b> / 10
                </span>
              </div>
              <div className="space-y-2.5">
                {memo.aumScorecard.map((r) => (
                  <div key={r.dimension}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] text-ink">{r.dimension}</span>
                      <span className="tnum text-[12px] font-medium text-ink2">{r.score}/10</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          r.score >= 7 ? 'bg-gain' : r.score >= 5 ? 'bg-brass' : 'bg-loss',
                        )}
                        style={{ width: `${r.score * 10}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11.5px] leading-snug text-ink3">{r.basis}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 rounded-ctl border border-line bg-surface2 p-3 text-[12.5px] leading-relaxed text-ink2">
                {memo.aumScorecardNote}
              </p>
            </div>

            <div className="min-w-0">
              <h3 className="mb-3 text-[12.5px] font-medium text-ink">Liability side — redemption mechanics</h3>
              {memo.redemptions ? (
                <TableWrap bleed={false} minW={380}>
                  <thead>
                    <tr>
                      <TH>Vehicle</TH>
                      <TH className="text-right">Requested</TH>
                      <TH className="text-right">Cap</TH>
                      <TH className="text-right">Fulfilled</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {memo.redemptions.map((r) => (
                      <tr key={r.vehicle}>
                        <TD className="font-medium text-ink">
                          {r.vehicle}
                          <div className="mt-0.5 text-[11.5px] text-ink3">{r.size}</div>
                        </TD>
                        <TD className="tnum text-right text-loss">{r.requested}</TD>
                        <TD className="tnum text-right">{r.cap}</TD>
                        <TD className="tnum text-right">
                          {r.fulfilled}
                          <div className="mt-0.5 text-[11px] leading-snug text-ink3">{r.trend}</div>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </TableWrap>
              ) : (
                <div className="rounded-ctl border border-gain/25 bg-gain-soft/25 p-4">
                  <Badge tone="gain" icon="check">
                    No gated vehicles
                  </Badge>
                </div>
              )}
              <p className="mt-3 rounded-ctl border border-line bg-surface2 p-3 text-[12.5px] leading-relaxed text-ink2">
                {memo.redemptionNote}
              </p>
            </div>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 09 earnings quality */}
      <Card pad>
        <Section
          id="quality"
          n={9}
          title="Earnings quality and dividend coverage"
          sub="From fee-related earnings to what a shareholder can actually be paid."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="mb-3 text-[12.5px] font-medium text-ink">FRE → DE bridge ($m, latest quarter)</h3>
              <Waterfall
                items={memo.earningsBridge}
                height={220}
                summary={`Bridge from fee-related earnings to distributable earnings for ${memo.symbol}`}
              />
              <p className="mt-3 text-[12.5px] leading-relaxed text-ink2">{memo.earningsBridgeNote}</p>
            </div>
            <div className="min-w-0">
              <h3 className="mb-3 text-[12.5px] font-medium text-ink">Dividend against distributable earnings per share</h3>
              <TableWrap bleed={false} minW={400}>
                <thead>
                  <tr>
                    <TH>Year</TH>
                    <TH className="text-right">DE/sh</TH>
                    <TH className="text-right">Dividend/sh</TH>
                    <TH className="text-right">Payout</TH>
                  </tr>
                </thead>
                <tbody>
                  {memo.dividendCoverage.map((d) => (
                    <tr key={d.year}>
                      <TD className="font-medium text-ink">
                        <span className="whitespace-nowrap">{d.year}</span>
                        {d.note && <div className="mt-0.5 text-[11px] leading-snug text-ink3">{d.note}</div>}
                      </TD>
                      <TD className="tnum text-right">{d.dePs === null ? '—' : `$${d.dePs.toFixed(2)}`}</TD>
                      <TD className="tnum text-right">{d.dividendPs === null ? '—' : `$${d.dividendPs.toFixed(2)}`}</TD>
                      <TD className="tnum text-right">
                        <span
                          className={cn(
                            'font-semibold',
                            d.payoutPct === null ? 'text-ink3' : d.payoutPct > 100 ? 'text-loss' : d.payoutPct > 90 ? 'text-warn' : 'text-gain',
                          )}
                        >
                          {num(d.payoutPct, 0, '%')}
                        </span>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <p className="mt-3 rounded-ctl border border-line bg-surface2 p-3 text-[12.5px] leading-relaxed text-ink2">
                {memo.dividendNote}
              </p>
            </div>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 10 ownership */}
      <Card pad>
        <Section id="ownership" n={10} title="Ownership, incentives and dilution" sub="Whose company is it, and how much of it is issued away each year?">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {memo.ownership.map((f) => (
              <div key={f.k} className="rounded-ctl border border-line bg-surface2 p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11.5px] text-ink3">
                    {f.k}
                    {f.period && <span className="ml-1 text-ink3">· {f.period}</span>}
                  </span>
                  <TierChip tier={f.tier} />
                </div>
                <div className="tnum mt-1 text-[15px] font-semibold text-ink">{f.v}</div>
                {f.note && <p className="mt-1 text-[11.5px] leading-snug text-ink3">{f.note}</p>}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-ink2">{memo.ownershipNote}</p>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 11 peers */}
      <Card pad>
        <Section id="peers" n={11} title="Peer comparison" sub="Chosen for business-model relevance, not market capitalisation.">
          <TableWrap>
            <thead>
              <tr>
                <TH>Manager</TH>
                <TH className="text-right">Mkt cap $bn</TH>
                <TH className="text-right">FRE $m</TH>
                <TH className="text-right">FRE growth</TH>
                <TH className="text-right">FRE margin</TH>
                <TH className="text-right">P/FRE</TH>
                <TH className="text-right">Div yield</TH>
                <TH>Permanent capital</TH>
              </tr>
            </thead>
            <tbody>
              {memo.peers.map((p) => {
                const self = p.ticker === memo.symbol
                return (
                  <tr key={p.ticker} className={cn(self && 'bg-brand-soft/25')}>
                    <TD className={cn('font-medium', self ? 'text-brand' : 'text-ink')}>
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        {p.ticker} <TierChip tier={p.tier} />
                      </span>
                      <div className="text-[11.5px] text-ink3">{p.name}</div>
                      {p.note && <div className="mt-1 max-w-sm text-[11.5px] leading-snug text-ink3">{p.note}</div>}
                    </TD>
                    <TD className="tnum text-right">{num(p.marketCap, 2)}</TD>
                    <TD className="tnum text-right">{p.fre === null ? '—' : p.fre.toLocaleString()}</TD>
                    <TD className="tnum text-right">{num(p.freGrowthPct, 0, '%')}</TD>
                    <TD className="tnum text-right">{num(p.freMarginPct, 1, '%')}</TD>
                    <TD className="tnum text-right font-medium text-ink">{p.pFre === null ? '—' : `${p.pFre.toFixed(1)}×`}</TD>
                    <TD className="tnum text-right">{num(p.divYieldPct, 1, '%')}</TD>
                    <TD className="whitespace-nowrap">{p.permCapital}</TD>
                  </tr>
                )
              })}
            </tbody>
          </TableWrap>
          <p className="mt-3 text-[11.5px] text-ink3">
            FRE is annualised run-rate from the latest reported quarter and is not season-adjusted; peer figures are
            tier C and used for relative context only.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink2">{memo.peerNote}</p>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 12 valuation */}
      <Card pad>
        <Section id="valuation" n={12} title="Valuation" sub="Four complementary methods, each with its own multiple logic.">
          <div className="space-y-3">
            {memo.valuation.map((v) => {
              const isCrossCheck = v.base === 0
              return (
                <div key={v.name} className="rounded-ctl border border-line bg-surface2 p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-[13px] font-semibold text-ink">{v.name}</h3>
                    {!isCrossCheck && (
                      <span className="tnum text-[13px] text-ink2">
                        ${v.low.toFixed(2)} · <b className="text-[16px] text-ink">${v.base.toFixed(2)}</b> · ${v.high.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink2">{v.approach}</p>
                  {!isCrossCheck && (
                    <div className="relative mt-3 h-1.5 rounded-full bg-line">
                      <div
                        className="absolute h-full rounded-full bg-brand/35"
                        style={{ left: `${pos(v.low)}%`, width: `${Math.max(2, pos(v.high) - pos(v.low))}%` }}
                      />
                      <span
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand"
                        style={{ left: `${pos(v.base)}%` }}
                      />
                      <span
                        title="Current price"
                        className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded bg-ink"
                        style={{ left: `${pos(memo.price)}%` }}
                      />
                    </div>
                  )}
                  <p className="mt-2 text-[11.5px] leading-snug text-ink3">{v.note}</p>
                </div>
              )
            })}
          </div>

          <h3 className="mb-2 mt-7 text-[13px] font-semibold text-ink">Sum of the parts</h3>
          <TableWrap>
            <thead>
              <tr>
                <TH>Component</TH>
                <TH>Basis</TH>
                <TH className="text-right">Multiple</TH>
                <TH className="text-right">Value $m</TH>
              </tr>
            </thead>
            <tbody>
              {memo.sotp.map((r) => (
                <tr key={r.component}>
                  <TD className="font-medium text-ink">{r.component}</TD>
                  <TD className="max-w-sm">{r.basis}</TD>
                  <TD className="tnum whitespace-nowrap text-right">{r.multiple}</TD>
                  <TD className={cn('tnum text-right font-medium', r.value < 0 ? 'text-loss' : 'text-ink')}>
                    {r.value < 0 ? '−' : ''}
                    {Math.abs(r.value).toLocaleString()}
                  </TD>
                </tr>
              ))}
              <tr>
                <TD className="font-semibold text-ink">Equity value</TD>
                <TD>{memo.dilutedShares.toLocaleString()}m fully diluted economic shares</TD>
                <TD />
                <TD className="tnum text-right font-semibold text-ink">{sotpTotal(memo).toLocaleString()}</TD>
              </tr>
              <tr>
                <TD className="font-semibold text-ink">Per share</TD>
                <TD className="text-ink3">vs. ${memo.price.toFixed(2)} market price</TD>
                <TD />
                <TD className="tnum text-right text-[15px] font-semibold text-brand">${sotpPs.toFixed(2)}</TD>
              </tr>
            </tbody>
          </TableWrap>

          <h3 className="mb-2 mt-7 text-[13px] font-semibold text-ink">What the current price already assumes</h3>
          <TableWrap>
            <thead>
              <tr>
                <TH>Variable</TH>
                <TH>Implied by ${memo.price.toFixed(2)}</TH>
                <TH>Our view</TH>
                <TH>Assessment</TH>
              </tr>
            </thead>
            <tbody>
              {memo.implied.map((r) => (
                <tr key={r.variable}>
                  <TD className="font-medium text-ink">{r.variable}</TD>
                  <TD>{r.impliedByPrice}</TD>
                  <TD>{r.ourView}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[r.assessment] ?? 'neutral'}>{r.assessment}</Badge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-2 text-[11.5px] text-ink3">
            &ldquo;Aggressive&rdquo; means the market&apos;s implied assumption is harsher than the evidence supports —
            i.e. it favours the buyer.
          </p>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 13 scenarios */}
      <Card pad>
        <Section id="scenarios" n={13} title="Bear, base and bull" sub="Five years. The bear case is a genuine downturn, not a slower base case.">
          <div className="grid gap-4 lg:grid-cols-3">
            {memo.scenarios.map((s) => (
              <div
                key={s.name}
                className={cn(
                  'rounded-ctl border p-4',
                  s.name === 'Bear' && 'border-loss/30 bg-loss-soft/20',
                  s.name === 'Base' && 'border-brand/30 bg-brand-soft/20',
                  s.name === 'Bull' && 'border-gain/30 bg-gain-soft/20',
                )}
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[14px] font-semibold text-ink">{s.name}</h3>
                  <span className="tnum text-[12px] text-ink2">{(s.probability * 100).toFixed(0)}%</span>
                </div>
                <div className="tnum mt-2 text-[24px] font-semibold leading-none text-ink">${s.targetPrice.toFixed(2)}</div>
                <div className="tnum mt-1.5 text-[12px] text-ink2">
                  3-yr <b className={s.threeYrIrrPct >= 0 ? 'text-gain' : 'text-loss'}>{s.threeYrIrrPct}%</b> · 5-yr{' '}
                  <b className={s.fiveYrIrrPct >= 0 ? 'text-gain' : 'text-loss'}>{s.fiveYrIrrPct}%</b> p.a.
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-ink2">{s.narrative}</p>
                <dl className="mt-3 space-y-1 border-t border-line pt-2.5 text-[11.5px]">
                  {s.assumptions.map((a) => (
                    <div key={a.k} className="flex justify-between gap-3">
                      <dt className="shrink-0 text-ink3">{a.k}</dt>
                      <dd className="tnum min-w-0 text-right text-ink2">{a.v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          <h3 className="mb-2 mt-7 text-[13px] font-semibold text-ink">
            Sensitivity — value per share by {memo.sensitivity.rowLabel} and {memo.sensitivity.colLabel}
          </h3>
          <TableWrap bleed={false} minW={520}>
            <thead>
              <tr>
                <TH>{memo.sensitivity.rowLabel}</TH>
                {memo.sensitivity.cols.map((c) => (
                  <TH key={c} className="text-right">
                    {c}
                  </TH>
                ))}
              </tr>
            </thead>
            <tbody>
              {memo.sensitivity.rows.map((r, ri) => (
                <tr key={r}>
                  <TD className="tnum font-medium text-ink">{r}</TD>
                  {memo.sensitivity.values[ri].map((v, ci) => (
                    <TD
                      key={ci}
                      className={cn(
                        'tnum text-right font-medium',
                        v > memo.price * 1.25 ? 'bg-gain-soft/40 text-gain' : v < memo.price * 0.9 ? 'bg-loss-soft/40 text-loss' : 'text-ink',
                      )}
                    >
                      ${v.toFixed(2)}
                    </TD>
                  ))}
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <p className="mt-2 text-[11.5px] text-ink3">
            Green: more than 25% above the current price of ${memo.price.toFixed(2)}. Red: below it.
          </p>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 14 red team */}
      <Card pad>
        <Section id="redteam" n={14} title="Red team" sub="The strongest case against our own conclusion, then adjudication.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-ctl border border-loss/30 bg-loss-soft/20 p-4">
              <Badge tone="loss" icon="alert">
                The case against
              </Badge>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink2">{memo.redTeam.case}</p>
            </div>
            <div className="rounded-ctl border border-brand/30 bg-brand-soft/20 p-4">
              <Badge tone="brand" icon="check">
                Adjudication
              </Badge>
              <p className="mt-2.5 text-[13px] leading-relaxed text-ink2">{memo.redTeam.adjudication}</p>
            </div>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 15 risks */}
      <Card pad>
        <Section id="risks" n={15} title="Risks, predictions and kill criteria" sub="Falsifiable, dated, and pre-committed.">
          <TableWrap>
            <thead>
              <tr>
                <TH>Risk</TH>
                <TH>Mechanism</TH>
                <TH>Quantified</TH>
                <TH>Severity</TH>
              </tr>
            </thead>
            <tbody>
              {memo.risks.map((r) => (
                <tr key={r.risk}>
                  <TD className="font-medium text-ink">{r.risk}</TD>
                  <TD className="max-w-sm">{r.mechanism}</TD>
                  <TD className="tnum">{r.quantified}</TD>
                  <TD>
                    <Badge tone={STATUS_TONE[r.severity] ?? 'neutral'}>{r.severity}</Badge>
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="min-w-0">
              <h3 className="mb-2.5 text-[13px] font-semibold text-ink">Falsifiable predictions</h3>
              <div className="space-y-2.5">
                {memo.predictions.map((p, i) => (
                  <div key={i} className="rounded-ctl border border-line bg-surface2 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-medium text-ink">{p.claim}</p>
                      <Badge tone="info">{p.by}</Badge>
                    </div>
                    <p className="tnum mt-1.5 text-[12px] text-brand">{p.threshold}</p>
                    <p className="mt-1 text-[11.5px] leading-snug text-ink3">
                      <b>If wrong: </b>
                      {p.ifWrong}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2.5 text-[13px] font-semibold text-ink">Kill criteria</h3>
              <p className="mb-2 text-[11.5px] text-ink3">Pre-committed. Any one of these and the position is exited regardless of price.</p>
              <ul className="space-y-2">
                {memo.killCriteria.map((k, i) => (
                  <li key={i} className="flex gap-2.5 rounded-ctl border border-loss/25 bg-loss-soft/15 p-3 text-[12.5px] leading-relaxed text-ink2">
                    <Icon name="x" size={14} className="mt-0.5 shrink-0 text-loss" />
                    <span>{k}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 16 dashboard */}
      <Card pad>
        <Section id="dashboard" n={16} title="Quarterly monitoring dashboard" sub="The three numbers to check every quarter — and nothing else.">
          <div className="grid gap-3 md:grid-cols-3">
            {memo.kpis.map((k, i) => (
              <div key={k.kpi} className="rounded-ctl border border-line bg-surface2 p-4">
                <div className="flex items-center gap-2">
                  <span className="tnum flex h-5 w-5 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand">
                    {i + 1}
                  </span>
                  <h3 className="text-[13px] font-semibold text-ink">{k.kpi}</h3>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink2">{k.why}</p>
                <div className="mt-3 space-y-1.5 border-t border-line pt-2.5 text-[11.5px]">
                  <div className="flex gap-2">
                    <Icon name="check" size={13} className="mt-0.5 shrink-0 text-gain" />
                    <span className="text-ink2">{k.green}</span>
                  </div>
                  <div className="flex gap-2">
                    <Icon name="x" size={13} className="mt-0.5 shrink-0 text-loss" />
                    <span className="text-ink2">{k.red}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 17 conclusion */}
      <Card pad>
        <Section id="conclusion" n={17} title="Required conclusions" sub="Twelve direct answers, then the rating.">
          <dl className="space-y-3.5">
            {memo.conclusions.map((c, i) => (
              <div key={i} className="grid gap-1 border-b border-line/60 pb-3.5 last:border-0 md:grid-cols-[minmax(0,300px)_1fr] md:gap-5">
                <dt className="text-[12.5px] font-medium text-ink">
                  <span className="tnum mr-1.5 text-ink3">{i + 1}.</span>
                  {c.q}
                </dt>
                <dd className="text-[12.5px] leading-relaxed text-ink2">{c.a}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 rounded-card border border-brand/30 bg-brand-soft/25 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-ink3">Final rating</span>
                <div className="mt-1 text-[20px] font-semibold text-ink">{memo.rating}</div>
              </div>
              <div className="tnum text-right text-[12.5px] text-ink2">
                <div>
                  Base case <b className="text-ink">${memo.scenarios.find((s) => s.name === 'Base')?.targetPrice.toFixed(2)}</b> ·
                  weighted <b className="text-ink">${wv.toFixed(2)}</b>
                </div>
                <div>
                  Expected 5-yr <b className={irr > 0 ? 'text-gain' : 'text-loss'}>{irr.toFixed(1)}% p.a.</b> · horizon {memo.horizon}
                </div>
              </div>
            </div>
            <p className="mt-3 border-t border-brand/20 pt-3 text-[12.5px] leading-relaxed text-ink2">{memo.positionSizing}</p>
          </div>

          <h3 className="mb-2.5 mt-7 text-[13px] font-semibold text-ink">Unanswered questions for management</h3>
          <ol className="space-y-2">
            {memo.questionsForManagement.map((q, i) => (
              <li key={i} className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink2">
                <span className="tnum shrink-0 text-ink3">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ol>
        </Section>
      </Card>

      {/* ---------------------------------------------------------- 18 sources */}
      <Card pad>
        <Section id="sources" n={18} title="Confidence ledger" sub="Every source, with its tier. Read this before trusting any number above.">
          <div className="mb-4 grid gap-2 sm:grid-cols-4">
            {(Object.keys(TIER_META) as Tier[]).map((t) => (
              <div key={t} className="rounded-ctl border border-line bg-surface2 p-3">
                <div className="flex items-center gap-2">
                  <TierChip tier={t} />
                  <span className="text-[12px] font-medium text-ink">{TIER_META[t].label}</span>
                </div>
                <p className="mt-1 text-[11px] leading-snug text-ink3">{TIER_META[t].desc}</p>
              </div>
            ))}
          </div>
          <TableWrap>
            <thead>
              <tr>
                <TH>Source</TH>
                <TH>Publisher</TH>
                <TH>Period</TH>
                <TH className="text-right">Tier</TH>
              </tr>
            </thead>
            <tbody>
              {memo.sources.map((s, i) => (
                <tr key={i}>
                  <TD className="text-ink">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </TD>
                  <TD>{s.publisher}</TD>
                  <TD className="whitespace-nowrap">{s.period}</TD>
                  <TD className="text-right">
                    <TierChip tier={s.tier} />
                  </TD>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Section>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/research/forensic">
          <Button variant="ghost" icon="chevronLeft">
            All forensic memos
          </Button>
        </Link>
        <p className="text-[11.5px] text-ink3">
          Methodology: <span className="font-medium">docs/FORENSIC-ASSET-MANAGER-PROMPT.md</span>
        </p>
      </div>
    </div>
  )
}
