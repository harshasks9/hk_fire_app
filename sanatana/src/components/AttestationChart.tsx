/**
 * Swim-lane chart of a record's dated attestations. Intervals are drawn as bars —
 * a scholarly date range is a range, never a point — with dashed outlines for
 * disputed dates. An optional year cursor fades what came later.
 */
import { useMemo, useRef, useState, useEffect } from 'react'
import { useStore } from '../data/store.tsx'
import { entityHref } from '../app/router.ts'
import { gatherAttestations, LANES, type Attestation } from '../lib/attest.ts'
import { yearLabel } from '../lib/meta.ts'
import { Glyph } from './ui.tsx'

const MIN = -1800
const MAX = 2026

export function AttestationChart({ id, includeIdentified = true, cursor, dark = false, items: given }: { id: string; includeIdentified?: boolean; cursor?: number | null; dark?: boolean; items?: Attestation[] }) {
  const store = useStore()
  const items = useMemo(() => given ?? gatherAttestations(store, id, includeIdentified), [store, id, includeIdentified, given])
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(800)
  const [hover, setHover] = useState<Attestation | null>(null)
  useEffect(() => {
    const el = wrap.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const lo = Math.max(MIN, Math.min(...items.map((i) => i.start), 1000) - 150)
  const x = (y: number) => 150 + ((Math.max(lo, y) - lo) / (MAX - lo)) * (w - 170)
  const ROW = 14
  // pack each lane into rows
  const lanes = LANES.map((lane) => {
    const its = items.filter((i) => i.lane === lane.id)
    const rows: number[] = []
    const placed = its.map((it) => {
      const x0 = x(it.start), x1 = Math.max(x(it.end), x0 + 6)
      let r = rows.findIndex((end) => end < x0 - 3)
      if (r === -1) { r = rows.length; rows.push(x1) } else rows[r] = x1
      return { it, r, x0, x1 }
    })
    return { lane, placed, rows: Math.max(1, rows.length) }
  }).filter((l) => l.placed.length)
  let y = 26
  const laid = lanes.map((l) => { const top = y; y += l.rows * ROW + 30; return { ...l, top } })
  const H = y + 6
  const ticks: number[] = []
  for (let t = Math.ceil(lo / 500) * 500; t <= MAX; t += 500) ticks.push(t)
  const ink = dark ? '#ece4d3' : 'var(--ink)'
  const ink3 = dark ? '#9a93a8' : 'var(--ink-3)'
  const rule = dark ? '#343b63' : 'var(--rule)'
  const color = (a: Attestation) => (a.lane === 'material' ? 'var(--f-material)' : a.lane === 'tradition' ? 'var(--f-deity)' : a.lane === 'reception' ? 'var(--f-figure)' : 'var(--f-literature)')

  if (!items.length) return <div className="text-sm opacity-70 py-4">No dated attestations are connected to this record yet.</div>
  return (
    <div ref={wrap} className="relative w-full">
      <svg width={w} height={H} role="img" aria-label={`Timeline of ${items.length} dated attestations`}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={x(t)} x2={x(t)} y1={16} y2={H - 4} stroke={rule} strokeDasharray={t === 0 ? undefined : '2 3'} />
            <text x={x(t)} y={11} fontSize={10} textAnchor="middle" fill={ink3}>{t === 0 ? '1 CE' : t < 0 ? `${-t} BCE` : `${t}`}</text>
          </g>
        ))}
        {laid.map((l) => (
          <g key={l.lane.id}>
            <text x={0} y={l.top + 10} fontSize={11} fontWeight={600} fill={ink}>{l.lane.label}</text>
            <text x={0} y={l.top + 23} fontSize={9.5} fill={ink3}>{l.placed.length} item{l.placed.length === 1 ? '' : 's'}</text>
            {l.placed.map(({ it, r, x0, x1 }) => {
              const later = cursor !== undefined && cursor !== null && it.start > cursor
              return (
                <a key={it.key} href={entityHref(it.node.id)} onMouseEnter={() => setHover(it)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(it)} onBlur={() => setHover(null)}>
                  <rect x={x0} y={l.top + r * ROW} width={x1 - x0} height={ROW - 4} rx={3}
                    fill={color(it)} fillOpacity={later ? 0.12 : it.disputed ? 0.08 : it.certainty === 'disputed' ? 0.35 : 0.85}
                    stroke={color(it)} strokeDasharray={it.certainty === 'disputed' || it.traditional || it.disputed ? '3 2' : undefined} strokeWidth={1} />
                  <title>{`${it.node.name} — ${it.label} (${it.certainty})${it.disputed ? ' — disputed identification, not counted' : ''}`}</title>
                </a>
              )
            })}
          </g>
        ))}
        {cursor !== undefined && cursor !== null ? (
          <g>
            <line x1={x(cursor)} x2={x(cursor)} y1={14} y2={H} stroke="var(--saffron)" strokeWidth={2} />
            <text x={x(cursor) + 4} y={24} fontSize={11} fontWeight={600} fill="var(--saffron)">{yearLabel(cursor)}</text>
          </g>
        ) : null}
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute right-0 top-0 rounded-lg px-3 py-2 text-xs shadow-lg max-w-[320px]" style={{ background: dark ? 'rgba(26,31,58,0.96)' : 'var(--panel)', border: `1px solid ${rule}`, color: ink }}>
          <div className="flex items-center gap-1.5 font-semibold"><Glyph family={hover.node.family} size={10} dark={dark} />{hover.node.name}</div>
          <div className="mt-0.5">{hover.label} · <span style={{ color: ink3 }}>{hover.certainty}</span></div>
          <div className="mt-0.5" style={{ color: ink3 }}>{hover.relation}{hover.via ? ` — via ${hover.via.name}` : ''}</div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] mt-1" style={{ color: ink3 }}>
        <span>Bars span the full scholarly or material date range.</span>
        <span>Dashed: disputed date, traditional association, or (hollow) a disputed identification that is shown but not counted.</span>
        {cursor !== undefined && cursor !== null ? <span>Faded: begins after the cursor.</span> : null}
      </div>
    </div>
  )
}
