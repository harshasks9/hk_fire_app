'use client'
import * as React from 'react'
import type { ChartData, ChartType } from '@/lib/sheet/model'
import { cx } from '@/lib/util'

/*
  Charts for sheet ranges and the numbers dashboard. Plain SVG: categorical
  palette in fixed slot order, thin marks with rounded data-ends, hairline
  grid, hover tooltip, legend for two or more series (single series is named
  by the title), a table view for accessibility.
*/
const LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']

function useDark(): boolean {
  const [dark, setDark] = React.useState(false)
  React.useEffect(() => {
    const el = document.documentElement
    const update = () => setDark(el.classList.contains('dark'))
    update()
    const mo = new MutationObserver(update)
    mo.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => mo.disconnect()
  }, [])
  return dark
}

export function seriesColor(i: number, dark: boolean): string {
  const p = dark ? DARK : LIGHT
  return p[i % p.length]!
}

function fmt(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1e9) return (v / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + 'B'
  if (abs >= 1e6) return (v / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + 'M'
  if (abs >= 1e4) return (v / 1e3).toFixed(0) + 'k'
  if (Number.isInteger(v)) return v.toLocaleString('en-US')
  return v.toLocaleString('en-US', { maximumFractionDigits: abs >= 100 ? 0 : abs >= 1 ? 1 : 3 })
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) { min = min === 0 ? 0 : min * 0.9; max = max === 0 ? 1 : max * 1.1 }
  const span = max - min
  const rough = span / count
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / mag
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const out: number[] = []
  for (let t = lo; t <= hi + step / 2; t += step) out.push(Number(t.toFixed(10)))
  return out
}

export interface ChartProps { type: ChartType; data: ChartData; title?: string; height?: number; className?: string; compact?: boolean }

export function Chart({ type, data, title, height = 260, className, compact }: ChartProps) {
  const dark = useDark()
  const [hover, setHover] = React.useState<{ i: number; s?: number; x: number; y: number } | null>(null)
  const [table, setTable] = React.useState(false)
  const series = data.series.slice(0, 8)
  const folded = data.series.length > 8
  const W = 640, H = height
  const padL = 44, padR = 16, padT = 12, padB = 30
  const plotW = W - padL - padR, plotH = H - padT - padB
  const n = data.labels.length
  if (!n || !series.length) return <div className={cx('rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12.5px] text-fg-3', className)}>Pick a range with numbers to chart.</div>

  const legend = series.length >= 2 ? (
    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-fg-2">
      {series.map((s, i) => <span key={s.name} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: seriesColor(i, dark) }} />{s.name}</span>)}
      {folded ? <span className="text-fg-3">+ {data.series.length - 8} more (table view)</span> : null}
    </div>
  ) : null

  const tableView = (
    <div className="mt-2 overflow-x-auto rounded-lg border border-border text-[12px]">
      <table className="w-full"><thead><tr><th className="px-2 py-1 text-left font-medium text-fg-2"></th>{series.map((s) => <th key={s.name} className="px-2 py-1 text-right font-medium text-fg-2">{s.name}</th>)}</tr></thead>
        <tbody>{data.labels.map((l, i) => <tr key={i} className="border-t border-border"><td className="px-2 py-1">{l}</td>{series.map((s) => <td key={s.name} className="px-2 py-1 text-right tabular-nums">{s.values[i] == null ? '' : fmt(s.values[i]!)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )

  let body: React.ReactNode
  if (type === 'pie') {
    const s = series[0]!
    const total = s.values.reduce<number>((a, v) => a + Math.max(0, v ?? 0), 0)
    let angle = -Math.PI / 2
    const cx0 = W / 2, cy0 = H / 2, R = Math.min(plotW, plotH) / 2 - 4, r0 = R * 0.55
    const slices = s.values.map((v, i) => {
      const val = Math.max(0, v ?? 0)
      const a = total ? (val / total) * Math.PI * 2 : 0
      const start = angle
      angle += a
      return { i, val, start, end: angle, pct: total ? val / total : 0 }
    })
    const arc = (a0: number, a1: number, r: number, ri: number) => {
      const gap = 0.02
      const s0 = a0 + gap / 2, s1 = a1 - gap / 2
      if (s1 <= s0) return ''
      const large = s1 - s0 > Math.PI ? 1 : 0
      const p = (a: number, rr: number) => `${cx0 + Math.cos(a) * rr},${cy0 + Math.sin(a) * rr}`
      return `M${p(s0, r)} A${r},${r} 0 ${large} 1 ${p(s1, r)} L${p(s1, ri)} A${ri},${ri} 0 ${large} 0 ${p(s0, ri)} Z`
    }
    body = (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title ?? s.name}>
        {slices.map((sl) => (
          <path key={sl.i} d={arc(sl.start, sl.end, R, r0)} fill={seriesColor(sl.i, dark)} opacity={hover && hover.i !== sl.i ? 0.45 : 1} onMouseEnter={(e) => setHover({ i: sl.i, x: e.clientX, y: e.clientY })} onMouseMove={(e) => setHover({ i: sl.i, x: e.clientX, y: e.clientY })} onMouseLeave={() => setHover(null)} />
        ))}
        <text x={cx0} y={cy0 - 4} textAnchor="middle" fontSize={20} fontWeight={600} fill="var(--fg)">{fmt(total)}</text>
        <text x={cx0} y={cy0 + 14} textAnchor="middle" fontSize={11} fill="var(--fg-3)">{s.name}</text>
        {slices.filter((sl) => sl.pct >= 0.06).map((sl) => {
          const mid = (sl.start + sl.end) / 2
          const rr = R + 14
          return <text key={`l${sl.i}`} x={cx0 + Math.cos(mid) * rr} y={cy0 + Math.sin(mid) * rr + 4} textAnchor={Math.cos(mid) >= 0 ? 'start' : 'end'} fontSize={11} fill="var(--fg-2)">{data.labels[sl.i]} · {Math.round(sl.pct * 100)}%</text>
        })}
      </svg>
    )
  } else {
    const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null))
    const minV = Math.min(0, ...all), maxV = Math.max(0, ...all)
    const ticks = niceTicks(minV, maxV)
    const lo = ticks[0]!, hi = ticks[ticks.length - 1]!
    const y = (v: number) => padT + plotH - ((v - lo) / (hi - lo || 1)) * plotH
    const slot = plotW / n
    const xCenter = (i: number) => padL + slot * (i + 0.5)
    const y0 = y(0)
    const showEvery = Math.max(1, Math.ceil(n / (compact ? 6 : 12)))
    const grid = ticks.map((t) => <g key={t}><line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} /><text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="var(--fg-3)">{fmt(t)}</text></g>)
    const xLabels = data.labels.map((l, i) => (i % showEvery === 0 ? <text key={i} x={xCenter(i)} y={H - padB + 16} textAnchor="middle" fontSize={10.5} fill="var(--fg-2)">{l.length > 12 ? l.slice(0, 11) + '…' : l}</text> : null))
    let marks: React.ReactNode
    if (type === 'bar') {
      const groupW = Math.min(slot * 0.72, 24 * series.length + 2 * (series.length - 1))
      const barW = Math.min(24, (groupW - 2 * (series.length - 1)) / series.length)
      marks = series.map((s, si) => s.values.map((v, i) => {
        if (v === null) return null
        const x = xCenter(i) - groupW / 2 + si * (barW + 2)
        const top = y(Math.max(v, 0)), bottom = y(Math.min(v, 0))
        const h = Math.max(1, bottom - top)
        const r = Math.min(4, barW / 2, h)
        const d = v >= 0 ? `M${x},${bottom} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${bottom} Z` : `M${x},${top} V${bottom - r} Q${x},${bottom} ${x + r},${bottom} H${x + barW - r} Q${x + barW},${bottom} ${x + barW},${bottom - r} V${top} Z`
        const dim = hover && (hover.i !== i || (hover.s !== undefined && hover.s !== si))
        return <path key={`${si}-${i}`} d={d} fill={seriesColor(si, dark)} opacity={dim ? 0.4 : 1} onMouseEnter={(e) => setHover({ i, s: si, x: e.clientX, y: e.clientY })} onMouseMove={(e) => setHover({ i, s: si, x: e.clientX, y: e.clientY })} onMouseLeave={() => setHover(null)} />
      }))
    } else {
      marks = series.map((s, si) => {
        const pts = s.values.map((v, i) => (v === null ? null : [xCenter(i), y(v)] as const))
        let d = ''
        let open = false
        pts.forEach((p) => { if (!p) { open = false; return } d += `${open ? 'L' : 'M'}${p[0]},${p[1]} `; open = true })
        const areaD = type === 'area' ? pts.reduce((acc, p, i) => (p ? acc + `${acc ? 'L' : 'M'}${p[0]},${p[1]} ` : acc), '') + (pts.filter(Boolean).length ? `L${pts.filter(Boolean).at(-1)![0]},${y0} L${pts.find(Boolean)![0]},${y0} Z` : '') : ''
        const last = pts.map((p, i) => ({ p, i })).filter((x) => x.p).at(-1)
        return (
          <g key={si}>
            {type === 'area' ? <path d={areaD} fill={seriesColor(si, dark)} opacity={0.16} /> : null}
            <path d={d} fill="none" stroke={seriesColor(si, dark)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (p ? <circle key={i} cx={p[0]} cy={p[1]} r={hover && hover.i === i ? 5 : n <= 24 ? 4 : 0} fill={seriesColor(si, dark)} stroke="var(--surface)" strokeWidth={2} /> : null))}
            {series.length <= 4 && last && !compact ? <text x={last.p![0] + 6} y={last.p![1] + 4} fontSize={11} fill="var(--fg-2)">{fmt(s.values[last.i]!)}</text> : null}
          </g>
        )
      })
    }
    const hoverX = hover ? xCenter(hover.i) : null
    body = (
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={title ?? series.map((s) => s.name).join(', ')}
        onMouseMove={type !== 'bar' ? (e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; const i = Math.max(0, Math.min(n - 1, Math.floor((px - padL) / slot))); setHover({ i, x: e.clientX, y: e.clientY }) } : undefined}
        onMouseLeave={type !== 'bar' ? () => setHover(null) : undefined}>
        {grid}
        {lo < 0 ? <line x1={padL} x2={W - padR} y1={y0} y2={y0} stroke="var(--border-2)" strokeWidth={1} /> : null}
        {hoverX !== null && type !== 'bar' ? <line x1={hoverX} x2={hoverX} y1={padT} y2={padT + plotH} stroke="var(--border-2)" strokeWidth={1} /> : null}
        {marks}
        {xLabels}
      </svg>
    )
  }
  return (
    <div className={cx('relative', className)}>
      {title ? <div className="mb-1 flex items-center justify-between text-[12.5px] font-medium text-fg-2"><span>{title}</span><button onClick={() => setTable((t) => !t)} className="text-[11px] font-normal text-fg-3 hover:text-fg">{table ? 'chart' : 'table'}</button></div> : <div className="mb-1 flex justify-end"><button onClick={() => setTable((t) => !t)} className="text-[11px] text-fg-3 hover:text-fg">{table ? 'chart' : 'table'}</button></div>}
      {table ? tableView : body}
      {!table ? legend : null}
      {hover && !table ? (
        <div className="pointer-events-none fixed z-50 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[12px] shadow-pop" style={{ left: hover.x + 12, top: hover.y + 12 }}>
          <div className="font-medium">{data.labels[hover.i]}</div>
          {(hover.s !== undefined ? [series[hover.s]!] : series).map((s, k) => <div key={s.name} className="flex items-center gap-1.5 text-fg-2"><span className="h-2 w-2 rounded-full" style={{ background: seriesColor(hover.s ?? k, dark) }} />{s.name}: <span className="tabular-nums text-fg">{s.values[hover.i] == null ? '—' : fmt(s.values[hover.i]!)}</span></div>)}
        </div>
      ) : null}
    </div>
  )
}
