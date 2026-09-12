'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { cx } from '@/lib/util'

export interface GraphNode { id: string; name: string; type: string; weight: number }
export interface GraphEdge { from: string; to: string; relation: string; weight: number }

const COLORS: Record<string, string> = { person: '#5b5bd6', company: '#2e9a62', topic: '#c98a1b', project: '#d64545', decision: '#7c7c85' }

export function GraphView({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const router = useRouter()
  const ref = React.useRef<SVGSVGElement>(null)
  const [pos, setPos] = React.useState<Record<string, { x: number; y: number }>>({})
  const [hover, setHover] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<string>('all')
  const size = { w: 1000, h: 640 }

  React.useEffect(() => {
    const ids = nodes.map((n) => n.id)
    const p: Record<string, { x: number; y: number; vx: number; vy: number }> = {}
    nodes.forEach((n, i) => { const a = (i / nodes.length) * Math.PI * 2; p[n.id] = { x: size.w / 2 + Math.cos(a) * 220, y: size.h / 2 + Math.sin(a) * 200, vx: 0, vy: 0 } })
    const idx = new Set(ids)
    const E = edges.filter((e) => idx.has(e.from) && idx.has(e.to))
    for (let iter = 0; iter < 260; iter++) {
      const k = 0.02 * (1 - iter / 300)
      for (const a of nodes) for (const b of nodes) {
        if (a.id >= b.id) continue
        const pa = p[a.id]!, pb = p[b.id]!
        let dx = pb.x - pa.x, dy = pb.y - pa.y
        let d2 = dx * dx + dy * dy || 1
        const rep = 9000 / d2
        dx *= rep; dy *= rep
        pa.vx -= dx * k; pa.vy -= dy * k; pb.vx += dx * k; pb.vy += dy * k
        void d2
      }
      for (const e of E) {
        const pa = p[e.from]!, pb = p[e.to]!
        const dx = pb.x - pa.x, dy = pb.y - pa.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (d - 120) * 0.004 * Math.min(e.weight, 4)
        pa.vx += (dx / d) * f; pa.vy += (dy / d) * f; pb.vx -= (dx / d) * f; pb.vy -= (dy / d) * f
      }
      for (const n of nodes) {
        const q = p[n.id]!
        q.vx += (size.w / 2 - q.x) * 0.002; q.vy += (size.h / 2 - q.y) * 0.002
        q.x += q.vx; q.y += q.vy; q.vx *= 0.82; q.vy *= 0.82
        q.x = Math.max(30, Math.min(size.w - 30, q.x)); q.y = Math.max(24, Math.min(size.h - 24, q.y))
      }
    }
    setPos(Object.fromEntries(Object.entries(p).map(([k, v]) => [k, { x: v.x, y: v.y }])))
  }, [nodes, edges, size.w, size.h])

  const visible = new Set(nodes.filter((n) => filter === 'all' || n.type === filter || (hover && (hover === n.id || edges.some((e) => (e.from === hover && e.to === n.id) || (e.to === hover && e.from === n.id))))).map((n) => n.id))
  const neighbours = hover ? new Set(edges.filter((e) => e.from === hover || e.to === hover).flatMap((e) => [e.from, e.to])) : null
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[12.5px]">
        {['all', 'person', 'company', 'topic', 'project'].map((t) => <button key={t} onClick={() => setFilter(t)} className={cx('rounded-md border px-2 py-1 capitalize', filter === t ? 'border-fg bg-surface-2' : 'border-border text-fg-2 hover:bg-surface-2')}>{t === 'all' ? 'Everything' : t}</button>)}
        <span className="ml-2 text-fg-3">{nodes.length} nodes · {edges.length} relationships · hover to focus, click to open</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <svg ref={ref} viewBox={`0 0 ${size.w} ${size.h}`} className="h-auto w-full">
          {edges.map((e, i) => {
            const a = pos[e.from], b = pos[e.to]
            if (!a || !b || !visible.has(e.from) || !visible.has(e.to)) return null
            const hot = hover && (e.from === hover || e.to === hover)
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? 'var(--accent)' : 'var(--border-2)'} strokeWidth={hot ? 1.5 : Math.min(1 + e.weight * 0.2, 2)} opacity={hover && !hot ? 0.25 : 0.9} />
          })}
          {nodes.map((n) => {
            const q = pos[n.id]
            if (!q || !visible.has(n.id)) return null
            const r = 5 + Math.min(n.weight, 30) * 0.5
            const dim = neighbours && !neighbours.has(n.id) && hover !== n.id
            return (
              <g key={n.id} transform={`translate(${q.x},${q.y})`} className="cursor-pointer" opacity={dim ? 0.25 : 1} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => router.push(n.type === 'person' ? `/people/${n.id}` : n.type === 'company' ? `/companies/${n.id}` : n.type === 'decision' ? `/decisions/${n.id}` : `/topics/${n.id}`)}>
                <circle r={r} fill={COLORS[n.type] ?? '#888'} opacity={0.9} />
                <text y={r + 12} textAnchor="middle" fontSize={11} fill="var(--fg-2)" className="select-none">{n.name.length > 22 ? n.name.slice(0, 20) + '…' : n.name}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[12px] text-fg-3">{Object.entries(COLORS).map(([t, c]) => <span key={t} className="inline-flex items-center gap-1 capitalize"><span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{t}</span>)}</div>
    </div>
  )
}
