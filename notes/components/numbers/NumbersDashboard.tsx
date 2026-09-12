'use client'
import * as React from 'react'
import Link from 'next/link'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Chart } from '@/components/sheet/Chart'
import type { NumbersData, NumberSeries } from '@/lib/numbers'
import { cx, formatDate } from '@/lib/util'
import { entityHref } from '@/lib/tag-href'

function fmt(v: number, unit: string | null): string {
  const abs = Math.abs(v)
  const core = abs >= 1e9 ? (v / 1e9).toFixed(abs >= 1e10 ? 0 : 1) + 'B' : abs >= 1e6 ? (v / 1e6).toFixed(abs >= 1e7 ? 0 : 1) + 'M' : abs >= 1e4 ? (v / 1e3).toFixed(0) + 'k' : Number.isInteger(v) ? v.toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: abs >= 100 ? 0 : 2 })
  if (unit === '$') return '$' + core
  if (unit === '%') return core + '%'
  return unit ? `${core} ${unit}` : core
}

/** Tiles for what each number is now, and trend charts for anything observed more than once. */
export function NumbersDashboard({ data }: { data: NumbersData }) {
  const [entity, setEntity] = React.useState('')
  const [label, setLabel] = React.useState('')
  const [q, setQ] = React.useState('')
  const series = data.series.filter((s) => (!entity || s.entityId === entity) && (!label || s.label === label) && (!q || `${s.entityName} ${s.label}`.toLowerCase().includes(q.toLowerCase())))
  const trending = series.filter((s) => s.points.length >= 2)
  // One chart per measure: entities are the series, dates the x axis.
  const byLabel = new Map<string, NumberSeries[]>()
  for (const s of trending) byLabel.set(s.label, [...(byLabel.get(s.label) ?? []), s])
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px]">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter" className="h-8 w-40 rounded-lg border border-border bg-surface px-2.5 outline-none focus:border-accent pointer-coarse:h-10 pointer-coarse:text-[16px]" />
        <select value={entity} onChange={(e) => setEntity(e.target.value)} className="h-8 rounded-lg border border-border bg-surface px-2 pointer-coarse:h-10"><option value="">Everyone</option>{data.entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select>
        <select value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 rounded-lg border border-border bg-surface px-2 pointer-coarse:h-10"><option value="">Every measure</option>{data.labels.map((l) => <option key={l} value={l}>{l}</option>)}</select>
        <span className="ml-auto text-[12px] text-fg-3">{series.length} figures · {trending.length} with history</span>
      </div>
      {series.length === 0 ? <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-[13.5px] text-fg-3">No numbers yet. Figures mentioned in notes and meetings ("ARR is $7.6M", "asked for a 3% buffer") land here automatically, and a /sheet inside a note gives you your own calculations.</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {series.slice(0, 24).map((s) => {
          const delta = s.previous ? s.latest.value - s.previous.value : null
          const pct = s.previous && s.previous.value !== 0 ? (s.latest.value - s.previous.value) / Math.abs(s.previous.value) : null
          const Icon = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown
          return (
            <div key={`${s.entityId}|${s.label}`} className="rounded-xl border border-border bg-surface px-4 py-3">
              <div className="flex items-center justify-between gap-2 text-[12px] text-fg-3"><span className="truncate">{s.label}</span><Link href={entityHref(s.entityType, s.entityId)} className="truncate hover:text-accent">{s.entityName}</Link></div>
              <div className="mt-1 text-[24px] font-semibold tabular-nums tracking-[-0.02em]">{fmt(s.latest.value, s.unit)}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[12px] text-fg-2">
                {delta !== null ? <span className={cx('inline-flex items-center gap-0.5', delta > 0 ? 'text-success' : delta < 0 ? 'text-danger' : 'text-fg-3')}><Icon className="h-3.5 w-3.5" />{pct !== null ? `${pct > 0 ? '+' : ''}${(pct * 100).toFixed(pct > 1 ? 0 : 1)}%` : fmt(delta, s.unit)}</span> : <span className="text-fg-3">first observation</span>}
                <span className="text-fg-3">· {formatDate(s.latest.at)}</span>
                {s.latest.noteId ? <Link href={`/notes/${s.latest.noteId}${s.latest.excerpt ? `?highlight=${encodeURIComponent(s.latest.excerpt.slice(0, 80))}` : ''}`} className="ml-auto text-[11.5px] text-fg-3 hover:text-accent">source</Link> : null}
              </div>
            </div>
          )
        })}
      </div>
      {byLabel.size ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {[...byLabel.entries()].slice(0, 12).map(([lbl, list]) => {
            const dates = [...new Set(list.flatMap((s) => s.points.map((p) => p.at.slice(0, 10))))].sort()
            const data = { labels: dates.map((d) => formatDate(d)), series: list.slice(0, 8).map((s) => ({ name: s.entityName, values: dates.map((d) => { const p = [...s.points].reverse().find((x) => x.at.slice(0, 10) <= d); return p ? p.value : null }) })) }
            const unit = list[0]?.unit ?? null
            return (
              <div key={lbl} className="rounded-xl border border-border bg-surface p-3">
                <Chart type="line" data={data} title={`${lbl}${unit ? ` (${unit})` : ''}`} height={220} />
                <ul className="mt-2 space-y-0.5 text-[12px] text-fg-2">
                  {list.slice(0, 4).map((s) => <li key={s.entityId} className="flex justify-between gap-2"><span className="truncate">{s.entityName}</span><span className="tabular-nums">{s.points.map((p) => fmt(p.value, s.unit)).join(' → ')}</span></li>)}
                </ul>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
