import React, { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { cn } from '@/lib/cn'
import { fmtMoney } from '@/lib/format'
import type { CurrencyCode } from '@/data/types'

/* ---------------------------------------------------------------------------
   Meridian chart kit — hand-built SVG, themed via CSS variables.
   Every chart answers a specific financial question; tooltips + accessible
   text summaries included.
--------------------------------------------------------------------------- */

export const CHART_COLORS = [
  'var(--m-chart-1)', 'var(--m-chart-2)', 'var(--m-chart-3)', 'var(--m-chart-4)',
  'var(--m-chart-5)', 'var(--m-chart-6)', 'var(--m-chart-7)', 'var(--m-chart-8)',
]

function useWidth(): [React.MutableRefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [w, setW] = useState(600)
  useLayoutEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver((entries) => {
      const cw = entries[0]?.contentRect.width
      if (cw && Math.abs(cw - w) > 1) setW(cw)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [ref, w]
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min]
  const span = max - min
  const step = Math.pow(10, Math.floor(Math.log10(span / count)))
  const err = (count * step) / span
  const mult = err <= 0.15 ? 10 : err <= 0.35 ? 5 : err <= 0.75 ? 2 : 1
  const s = step * mult
  const start = Math.ceil(min / s) * s
  const ticks: number[] = []
  for (let v = start; v <= max + 1e-9; v += s) ticks.push(v)
  return ticks
}

const fmtAxis = (v: number, currency?: CurrencyCode) => {
  const abs = Math.abs(v)
  const sym = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : ''
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${sym}${(abs / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${sign}${sym}${(abs / 1_000).toFixed(0)}K`
  return `${sign}${sym}${abs.toFixed(0)}`
}

/* -- Area / line chart -------------------------------------------------------- */

export function AreaChart({
  data,
  labels,
  height = 200,
  color = 'var(--m-chart-1)',
  currency = 'USD',
  className,
  compare,
  compareColor = 'var(--m-chart-2)',
  compareLabel,
  seriesLabel,
  showAxis = true,
  fill = true,
  summary,
}: {
  data: number[]
  labels?: string[] // same length; shown on hover + sparse x-axis
  height?: number
  color?: string
  currency?: CurrencyCode
  className?: string
  compare?: number[]
  compareColor?: string
  compareLabel?: string
  seriesLabel?: string
  showAxis?: boolean
  fill?: boolean
  summary?: string
}) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const padL = showAxis ? 46 : 4
  const padR = 8
  const padT = 10
  const padB = showAxis ? 22 : 4
  const iw = Math.max(50, width - padL - padR)
  const ih = height - padT - padB
  const all = compare ? [...data, ...compare] : data
  const min = Math.min(...all)
  const max = Math.max(...all)
  const range = max - min || 1
  const y = (v: number) => padT + ih - ((v - min) / range) * ih
  const x = (i: number, n: number) => padL + (i / Math.max(1, n - 1)) * iw
  const path = (arr: number[]) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i, arr.length).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const ticks = useMemo(() => niceTicks(min, max, 3), [min, max])
  const gradId = useMemo(() => `g${Math.round(Math.random() * 1e9)}`, [])
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const i = Math.round(((px - padL) / iw) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }
  const xLabelIdx = labels ? [0, Math.floor((labels.length - 1) / 2), labels.length - 1] : []
  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={summary ?? 'Time-series chart'}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="block"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0.01" />
          </linearGradient>
        </defs>
        {showAxis &&
          ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke="var(--m-line)" strokeDasharray="2 4" />
              <text x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="10" fill="var(--m-ink3)" className="tnum">
                {fmtAxis(t, currency)}
              </text>
            </g>
          ))}
        {showAxis &&
          labels &&
          xLabelIdx.map((i) => (
            <text key={i} x={x(i, labels.length)} y={height - 6} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'} fontSize="10" fill="var(--m-ink3)">
              {labels[i]}
            </text>
          ))}
        {fill && <path d={`${path(data)}L${x(data.length - 1, data.length)},${padT + ih}L${padL},${padT + ih}Z`} fill={`url(#${gradId})`} />}
        {compare && <path d={path(compare)} fill="none" stroke={compareColor} strokeWidth="1.5" strokeDasharray="4 3" />}
        <path d={path(data)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
        {hover !== null && (
          <g>
            <line x1={x(hover, data.length)} x2={x(hover, data.length)} y1={padT} y2={padT + ih} stroke="var(--m-line2)" />
            <circle cx={x(hover, data.length)} cy={y(data[hover])} r="3.5" fill={color} stroke="var(--m-surface)" strokeWidth="1.5" />
            {compare && compare[hover] !== undefined && (
              <circle cx={x(hover, data.length)} cy={y(compare[hover])} r="3" fill={compareColor} stroke="var(--m-surface)" strokeWidth="1.5" />
            )}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-pop"
          style={{
            left: Math.min(Math.max(x(hover, data.length) - 60, 0), width - 130),
            top: Math.max(y(data[hover]) - 58, 0),
          }}
        >
          {labels && <div className="text-ink3">{labels[hover]}</div>}
          <div className="tnum font-semibold text-ink">
            {seriesLabel && <span className="mr-1 font-normal text-ink2">{seriesLabel}</span>}
            {fmtMoney(data[hover], currency, { compact: false })}
          </div>
          {compare && compare[hover] !== undefined && (
            <div className="tnum text-ink2">
              {compareLabel ?? 'Compare'} {fmtMoney(compare[hover], currency)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* -- Sparkline ------------------------------------------------------------------ */

export function Sparkline({
  data,
  width = 96,
  height = 30,
  color,
  className,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const up = data[data.length - 1] >= data[0]
  const c = color ?? (up ? 'var(--m-gain)' : 'var(--m-loss)')
  const pts = data.map((v, i) => `${((i / (data.length - 1)) * (width - 2) + 1).toFixed(1)},${(height - 2 - ((v - min) / range) * (height - 4)).toFixed(1)}`)
  return (
    <svg width={width} height={height} className={cn('block', className)} aria-hidden>
      <polyline points={pts.join(' ')} fill="none" stroke={c} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* -- Waterfall ------------------------------------------------------------------- */

export function Waterfall({
  items,
  height = 220,
  currency = 'USD',
  className,
  summary,
}: {
  items: { label: string; value: number; isTotal?: boolean }[]
  height?: number
  currency?: CurrencyCode
  className?: string
  summary?: string
}) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const padL = 8
  const padB = 34
  const padT = 12
  const ih = height - padT - padB
  // running levels
  let run = 0
  const bars = items.map((it) => {
    if (it.isTotal) {
      const bar = { ...it, start: 0, end: run + it.value * 0 } // total resets to running sum
      run = it.value !== 0 ? it.value : run
      return { ...bar, start: 0, end: run }
    }
    const start = run
    run += it.value
    return { ...it, start, end: run }
  })
  const maxV = Math.max(...bars.map((b) => Math.max(b.start, b.end)), 0)
  const minV = Math.min(...bars.map((b) => Math.min(b.start, b.end)), 0)
  const range = maxV - minV || 1
  const y = (v: number) => padT + ih - ((v - minV) / range) * ih
  const bw = (width - padL * 2) / items.length
  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg width={width} height={height} role="img" aria-label={summary ?? 'Waterfall chart'} className="block">
        <line x1={padL} x2={width - padL} y1={y(0)} y2={y(0)} stroke="var(--m-line2)" />
        {bars.map((b, i) => {
          const color = b.isTotal ? 'var(--m-chart-1)' : b.value >= 0 ? 'var(--m-gain)' : 'var(--m-loss)'
          const top = Math.min(y(b.start), y(b.end))
          const h = Math.max(2, Math.abs(y(b.start) - y(b.end)))
          const cx = padL + i * bw + bw * 0.18
          const cw = bw * 0.64
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              {i > 0 && (
                <line x1={cx - bw * 0.36} x2={cx} y1={y(b.start)} y2={y(b.start)} stroke="var(--m-line2)" strokeDasharray="2 3" />
              )}
              <rect x={cx} y={top} width={cw} height={h} rx="3" fill={color} opacity={hover === null || hover === i ? (b.isTotal ? 1 : 0.85) : 0.35} />
              <text x={cx + cw / 2} y={height - 20} textAnchor="middle" fontSize="9.5" fill="var(--m-ink2)">
                {b.label.length > 12 ? b.label.slice(0, 11) + '…' : b.label}
              </text>
              <text x={cx + cw / 2} y={height - 8} textAnchor="middle" fontSize="9.5" fill="var(--m-ink3)" className="tnum">
                {fmtAxis(b.isTotal ? b.end : b.value, currency)}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute left-1/2 top-1 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-pop">
          <span className="text-ink2">{items[hover].label}: </span>
          <span className="tnum font-semibold">{fmtMoney(items[hover].isTotal ? bars[hover].end : items[hover].value, currency, { sign: !items[hover].isTotal })}</span>
        </div>
      )}
    </div>
  )
}

/* -- Donut ------------------------------------------------------------------------ */

export function DonutRing({
  slices,
  size = 168,
  thickness = 22,
  centerTitle,
  centerValue,
  className,
  onHover,
}: {
  slices: { label: string; value: number; color?: string }[]
  size?: number
  thickness?: number
  centerTitle?: string
  centerValue?: string
  className?: string
  onHover?: (i: number | null) => void
}) {
  const [hover, setHover] = useState<number | null>(null)
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  const r = size / 2 - thickness / 2
  const c = size / 2
  let acc = 0
  const segs = slices.map((s, i) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2
    acc += s.value
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2
    const large = end - start > Math.PI ? 1 : 0
    const x1 = c + r * Math.cos(start)
    const y1 = c + r * Math.sin(start)
    const x2 = c + r * Math.cos(end - 0.015)
    const y2 = c + r * Math.sin(end - 0.015)
    return { d: `M${x1},${y1}A${r},${r} 0 ${large} 1 ${x2},${y2}`, color: s.color ?? CHART_COLORS[i % CHART_COLORS.length], i }
  })
  const active = hover !== null ? slices[hover] : null
  return (
    <div className={cn('relative inline-block', className)}>
      <svg width={size} height={size} role="img" aria-label={`Allocation: ${slices.map((s) => `${s.label} ${Math.round((s.value / total) * 100)}%`).join(', ')}`}>
        {segs.map((s) => (
          <path
            key={s.i}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={hover === s.i ? thickness + 4 : thickness}
            strokeLinecap="butt"
            opacity={hover === null || hover === s.i ? 1 : 0.3}
            onMouseEnter={() => { setHover(s.i); onHover?.(s.i) }}
            onMouseLeave={() => { setHover(null); onHover?.(null) }}
            className="transition-all"
          />
        ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10.5px] uppercase tracking-wide text-ink3">{active ? active.label : centerTitle}</span>
        <span className="tnum font-display text-[19px] font-semibold text-ink">
          {active ? `${Math.round((active.value / total) * 100)}%` : centerValue}
        </span>
      </div>
    </div>
  )
}

/* -- Stacked horizontal bar (allocation) --------------------------------------------- */

export function HBarStack({
  slices,
  className,
  height = 14,
  currency = 'USD',
}: {
  slices: { label: string; value: number; color?: string }[]
  className?: string
  height?: number
  currency?: CurrencyCode
}) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div className={className}>
      <div className="flex w-full overflow-hidden rounded-full" style={{ height }}>
        {slices.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label}: ${fmtMoney(s.value, currency, { compact: true })} (${((s.value / total) * 100).toFixed(1)}%)`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }}
            className="h-full border-r border-surface last:border-0"
          />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
        {slices.map((s, i) => (
          <span key={s.label} className="inline-flex items-center gap-1.5 text-[11.5px] text-ink2">
            <span className="h-2 w-2 rounded-[3px]" style={{ background: s.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
            {s.label}
            <span className="tnum text-ink3">{((s.value / total) * 100).toFixed(1)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

/* -- Monthly bars (income) ------------------------------------------------------------ */

export function MonthBars({
  months,
  height = 170,
  currency = 'USD',
  className,
  colorA = 'var(--m-chart-1)',
  colorB = 'var(--m-chart-2)',
  labelA = 'Received',
  labelB = 'Expected',
  highlightMonth,
}: {
  months: { label: string; a: number; b: number }[]
  height?: number
  currency?: CurrencyCode
  className?: string
  colorA?: string
  colorB?: string
  labelA?: string
  labelB?: string
  highlightMonth?: number
}) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const padB = 20
  const padT = 8
  const ih = height - padT - padB
  const max = Math.max(...months.map((m) => m.a + m.b), 1)
  const bw = width / months.length
  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg width={width} height={height} className="block" role="img" aria-label={`Monthly ${labelA.toLowerCase()} vs ${labelB.toLowerCase()}`}>
        {months.map((m, i) => {
          const hA = (m.a / max) * ih
          const hB = (m.b / max) * ih
          const x0 = i * bw + bw * 0.22
          const w0 = bw * 0.56
          const dim = hover !== null && hover !== i
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x0} y={padT + ih - hA} width={w0} height={Math.max(hA, m.a > 0 ? 2 : 0)} rx="2.5" fill={colorA} opacity={dim ? 0.3 : 1} />
              <rect x={x0} y={padT + ih - hA - hB} width={w0} height={Math.max(hB, m.b > 0 ? 2 : 0)} rx="2.5" fill={colorB} opacity={dim ? 0.25 : 0.75} />
              <text x={x0 + w0 / 2} y={height - 6} textAnchor="middle" fontSize="9.5" fill={highlightMonth === i ? 'var(--m-ink)' : 'var(--m-ink3)'} fontWeight={highlightMonth === i ? 600 : 400}>
                {m.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-pop"
          style={{ left: Math.min(hover * bw, width - 140), top: 0 }}
        >
          <div className="font-medium text-ink">{months[hover].label}</div>
          <div className="tnum text-ink2">{labelA}: {fmtMoney(months[hover].a, currency)}</div>
          {months[hover].b > 0 && <div className="tnum text-ink2">{labelB}: {fmtMoney(months[hover].b, currency)}</div>}
        </div>
      )}
      <div className="mt-1 flex gap-4 text-[11px] text-ink2">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px]" style={{ background: colorA }} />{labelA}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px]" style={{ background: colorB, opacity: 0.75 }} />{labelB}</span>
      </div>
    </div>
  )
}

/* -- Payoff diagram -------------------------------------------------------------------- */

export function PayoffDiagram({
  payoff,
  spot,
  breakeven,
  height = 190,
  className,
  summary,
}: {
  payoff: { price: number; pnl: number }[]
  spot: number
  breakeven?: number
  height?: number
  className?: string
  summary?: string
}) {
  const [ref, width] = useWidth()
  const padL = 46
  const padR = 10
  const padB = 24
  const padT = 10
  const iw = Math.max(10, width - padL - padR)
  const ih = height - padT - padB
  const minP = payoff[0].price
  const maxP = payoff[payoff.length - 1].price
  const minY = Math.min(...payoff.map((p) => p.pnl))
  const maxY = Math.max(...payoff.map((p) => p.pnl))
  const rangeY = maxY - minY || 1
  const x = (p: number) => padL + ((p - minP) / (maxP - minP)) * iw
  const y = (v: number) => padT + ih - ((v - minY) / rangeY) * ih
  const zero = y(0)
  const clipId = useMemo(() => `pc${Math.round(Math.random() * 1e9)}`, [])
  // split path into gain / loss segments for coloring
  const d = payoff.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.price).toFixed(1)},${y(p.pnl).toFixed(1)}`).join('')
  const areaGain = `${d}L${x(maxP)},${zero}L${x(minP)},${zero}Z`
  return (
    <div ref={ref} className={cn('w-full', className)}>
      <svg width={width} height={height} role="img" aria-label={summary ?? 'Option payoff at expiry'} className="block">
        <defs>
          <clipPath id={`${clipId}g`}><rect x={0} y={0} width={width} height={zero} /></clipPath>
          <clipPath id={`${clipId}l`}><rect x={0} y={zero} width={width} height={height - zero} /></clipPath>
        </defs>
        <line x1={padL} x2={width - padR} y1={zero} y2={zero} stroke="var(--m-line2)" />
        <path d={areaGain} fill="var(--m-gain)" opacity="0.14" clipPath={`url(#${clipId}g)`} />
        <path d={areaGain} fill="var(--m-loss)" opacity="0.14" clipPath={`url(#${clipId}l)`} />
        <path d={d} fill="none" stroke="var(--m-chart-1)" strokeWidth="2" clipPath={`url(#${clipId}g)`} />
        <path d={d} fill="none" stroke="var(--m-chart-4)" strokeWidth="2" clipPath={`url(#${clipId}l)`} />
        {/* spot marker */}
        <line x1={x(spot)} x2={x(spot)} y1={padT + 12} y2={padT + ih} stroke="var(--m-ink3)" strokeDasharray="3 3" />
        <text x={x(spot)} y={padT + 8} textAnchor="middle" fontSize="9" fill="var(--m-ink2)">now {spot.toFixed(0)}</text>
        {breakeven !== undefined && breakeven > minP && breakeven < maxP && (
          <>
            <circle cx={x(breakeven)} cy={zero} r="3.5" fill="var(--m-brass)" stroke="var(--m-surface)" strokeWidth="1.5" />
            <text x={x(breakeven)} y={zero - 7} textAnchor="middle" fontSize="9" fill="var(--m-brass)" className="tnum">BE {breakeven.toFixed(1)}</text>
          </>
        )}
        {[minP, (minP + maxP) / 2, maxP].map((p) => (
          <text key={p} x={x(p)} y={height - 6} textAnchor="middle" fontSize="9.5" fill="var(--m-ink3)" className="tnum">{p.toFixed(0)}</text>
        ))}
        {[minY, 0, maxY]
          .filter((v, i, a) => a.indexOf(v) === i)
          .filter((v, i, a) => i === 0 || Math.abs(y(v) - y(a[i - 1])) > 14)
          .map((v) => (
          <text key={v} x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize="9.5" fill="var(--m-ink3)" className="tnum">{fmtAxis(v, 'USD')}</text>
        ))}
      </svg>
    </div>
  )
}

/* -- Progress ring ------------------------------------------------------------------------ */

export function ProgressRing({
  pct,
  size = 62,
  thickness = 6,
  tone = 'var(--m-chart-1)',
  label,
  className,
}: {
  pct: number
  size?: number
  thickness?: number
  tone?: string
  label?: React.ReactNode
  className?: string
}) {
  const r = size / 2 - thickness / 2
  const c = 2 * Math.PI * r
  const p = Math.min(100, Math.max(0, pct))
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--m-line)" strokeWidth={thickness} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={thickness}
          strokeDasharray={`${(p / 100) * c} ${c}`} strokeLinecap="round"
        />
      </svg>
      <span className="tnum absolute text-[12px] font-semibold text-ink">{label ?? `${Math.round(p)}%`}</span>
    </div>
  )
}

/* -- 52-week range bar --------------------------------------------------------------------- */

export function RangeBar({
  low,
  high,
  current,
  target,
  className,
}: {
  low: number
  high: number
  current: number
  target?: number
  className?: string
}) {
  const pct = ((current - low) / (high - low || 1)) * 100
  const tPct = target !== undefined ? ((target - low) / (high - low || 1)) * 100 : null
  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-1.5 rounded-full bg-line">
        <div className="absolute h-full rounded-full bg-gradient-to-r from-chart-3/40 to-chart-1/60" style={{ width: `${Math.min(100, Math.max(2, pct))}%` }} />
        <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-brand shadow-card" style={{ left: `${Math.min(99, Math.max(1, pct))}%` }} />
        {tPct !== null && tPct >= 0 && tPct <= 100 && (
          <span title="Target price" className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded bg-brass" style={{ left: `${tPct}%` }} />
        )}
      </div>
      <div className="tnum mt-1 flex justify-between text-[10.5px] text-ink3">
        <span>{low.toLocaleString()}</span>
        <span>{high.toLocaleString()}</span>
      </div>
    </div>
  )
}

/* -- Treemap (concentration) ------------------------------------------------------------------ */

export function Treemap({
  items,
  height = 220,
  className,
  currency = 'USD',
}: {
  items: { label: string; value: number; delta?: number }[]
  height?: number
  className?: string
  currency?: CurrencyCode
}) {
  const [ref, width] = useWidth()
  // slice-and-dice alternating; good enough visually for ~12 items
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  type Rect = { x: number; y: number; w: number; h: number; item: (typeof items)[0] }
  const rects: Rect[] = []
  function layout(list: typeof items, x: number, y: number, w: number, h: number) {
    if (!list.length) return
    if (list.length === 1) {
      rects.push({ x, y, w, h, item: list[0] })
      return
    }
    const sum = list.reduce((s, i) => s + i.value, 0)
    let accV = 0
    let split = 1
    for (let i = 0; i < list.length; i++) {
      accV += list[i].value
      if (accV >= sum / 2) { split = i + 1; break }
    }
    const first = list.slice(0, split)
    const rest = list.slice(split)
    const frac = first.reduce((s, i) => s + i.value, 0) / sum
    if (w >= h) {
      layout(first, x, y, w * frac, h)
      layout(rest, x + w * frac, y, w * (1 - frac), h)
    } else {
      layout(first, x, y, w, h * frac)
      layout(rest, x, y + h * frac, w, h * (1 - frac))
    }
  }
  layout([...items].sort((a, b) => b.value - a.value), 0, 0, width, height)
  return (
    <div ref={ref} className={cn('w-full', className)}>
      <svg width={width} height={height} className="block" role="img" aria-label="Portfolio concentration treemap">
        {rects.map((r, i) => {
          const d = r.item.delta ?? 0
          const fill = d > 0.05 ? 'var(--m-gain)' : d < -0.05 ? 'var(--m-loss)' : 'var(--m-ink3)'
          const op = Math.min(0.85, 0.18 + Math.min(Math.abs(d) / 4, 0.5))
          const showText = r.w > 52 && r.h > 30
          return (
            <g key={i}>
              <rect x={r.x + 1} y={r.y + 1} width={Math.max(0, r.w - 2)} height={Math.max(0, r.h - 2)} rx="6" fill={fill} opacity={op}>
                <title>{`${r.item.label}: ${fmtMoney(r.item.value, currency, { compact: true })} (${((r.item.value / total) * 100).toFixed(1)}%)${d ? ` · ${d > 0 ? '+' : ''}${d.toFixed(2)}% today` : ''}`}</title>
              </rect>
              {showText && (
                <>
                  <text x={r.x + 8} y={r.y + 17} fontSize="10.5" fontWeight="600" fill="var(--m-ink)">{r.item.label}</text>
                  <text x={r.x + 8} y={r.y + 30} fontSize="9.5" fill="var(--m-ink2)" className="tnum">
                    {((r.item.value / total) * 100).toFixed(1)}%{r.item.delta !== undefined ? ` · ${d > 0 ? '▲' : d < 0 ? '▼' : ''}${Math.abs(d).toFixed(1)}%` : ''}
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* -- Dual-series stacked area (amortization principal vs interest) ---------------------------- */

export function StackedArea({
  series,
  labels,
  height = 190,
  currency = 'USD',
  className,
  names = ['Principal', 'Interest'],
  colors = ['var(--m-chart-1)', 'var(--m-chart-2)'],
  summary,
}: {
  series: [number[], number[]]
  labels?: string[]
  height?: number
  currency?: CurrencyCode
  className?: string
  names?: [string, string] | string[]
  colors?: string[]
  summary?: string
}) {
  const [ref, width] = useWidth()
  const [hover, setHover] = useState<number | null>(null)
  const padL = 46, padR = 8, padT = 8, padB = 20
  const iw = Math.max(10, width - padL - padR)
  const ih = height - padT - padB
  const n = series[0].length
  const totals = series[0].map((v, i) => v + series[1][i])
  const max = Math.max(...totals, 1)
  const x = (i: number) => padL + (i / Math.max(1, n - 1)) * iw
  const y = (v: number) => padT + ih - (v / max) * ih
  const areaPath = (lower: number[], upper: number[]) => {
    const top = upper.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
    const bottom = [...lower].reverse().map((v, i) => `L${x(n - 1 - i).toFixed(1)},${y(v).toFixed(1)}`).join('')
    return `${top}${bottom}Z`
  }
  const zeros = new Array(n).fill(0)
  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const i = Math.round(((e.clientX - rect.left - padL) / iw) * (n - 1))
    setHover(Math.max(0, Math.min(n - 1, i)))
  }
  return (
    <div ref={ref} className={cn('relative w-full', className)}>
      <svg width={width} height={height} className="block" role="img" aria-label={summary ?? 'Stacked area chart'} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <path d={areaPath(zeros, series[0])} fill={colors[0]} opacity="0.75" />
        <path d={areaPath(series[0], totals)} fill={colors[1]} opacity="0.55" />
        {labels && [0, Math.floor((n - 1) / 2), n - 1].map((i) => (
          <text key={i} x={x(i)} y={height - 5} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} fontSize="9.5" fill="var(--m-ink3)">{labels[i]}</text>
        ))}
        {niceTicks(0, max, 3).map((t) => (
          <text key={t} x={padL - 6} y={y(t) + 3} textAnchor="end" fontSize="9.5" fill="var(--m-ink3)" className="tnum">{fmtAxis(t, currency)}</text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="var(--m-line2)" />}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-pop" style={{ left: Math.min(x(hover), width - 150), top: 0 }}>
          {labels && <div className="text-ink3">{labels[hover]}</div>}
          <div className="tnum text-ink2">{names[0]}: <span className="font-medium text-ink">{fmtMoney(series[0][hover], currency)}</span></div>
          <div className="tnum text-ink2">{names[1]}: <span className="font-medium text-ink">{fmtMoney(series[1][hover], currency)}</span></div>
        </div>
      )}
      <div className="mt-1 flex gap-4 text-[11px] text-ink2">
        {names.map((nm, i) => (
          <span key={nm} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-[3px]" style={{ background: colors[i] }} />{nm}</span>
        ))}
      </div>
    </div>
  )
}
