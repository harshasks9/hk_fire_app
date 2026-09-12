'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, X, Crosshair, ExternalLink, Layers, Maximize2, Loader2 } from 'lucide-react'
import { cx } from '@/lib/util'
import { api } from '@/lib/client'
import type { GNode, GEdge, GraphData, GraphNodeType } from '@/lib/graph'

const COLORS: Record<GraphNodeType, string> = { person: '#5b5bd6', company: '#2e9a62', topic: '#c98a1b', project: '#d64545', tag: '#0e9aa7', note: '#8a8a94', meeting: '#b04fb0', decision: '#e0771f' }
const LABELS: Record<GraphNodeType, string> = { person: 'People', company: 'Companies', topic: 'Topics', project: 'Projects', tag: 'Tags', note: 'Notes', meeting: 'Meetings', decision: 'Decisions' }
const ALL_TYPES = Object.keys(LABELS) as GraphNodeType[]

interface P { x: number; y: number; vx: number; vy: number; fixed?: boolean }

export interface GraphParams { focus: string | null; types: GraphNodeType[]; depth: 1 | 2; all: boolean }

export function GraphView({ initial }: { initial: GraphParams }) {
  const router = useRouter()
  const [params, setParams] = React.useState<GraphParams>(initial)
  const [data, setData] = React.useState<GraphData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [q, setQ] = React.useState('')
  const [selected, setSelected] = React.useState<string | null>(null)
  const [hover, setHover] = React.useState<string | null>(null)
  const [, force] = React.useReducer((n: number) => n + 1, 0)
  const posRef = React.useRef<Map<string, P>>(new Map())
  const svgRef = React.useRef<SVGSVGElement>(null)
  const view = React.useRef({ x: 0, y: 0, k: 1 })
  const drag = React.useRef<{ kind: 'pan' | 'node'; id?: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null)
  const pinch = React.useRef<{ d: number; k: number } | null>(null)
  const alive = React.useRef(0)
  const W = 1000, H = 640

  // Keep the URL in sync so focus/type choices are shareable and survive refresh.
  React.useEffect(() => {
    const sp = new URLSearchParams()
    if (params.focus) sp.set('focus', params.focus)
    if (params.types.length) sp.set('types', params.types.join(','))
    if (params.depth === 2) sp.set('depth', '2')
    if (params.all) sp.set('all', '1')
    const url = `/graph${sp.toString() ? `?${sp}` : ''}`
    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== url) window.history.replaceState(null, '', url)
  }, [params])

  // Load the graph.
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const sp = new URLSearchParams()
    if (params.focus) sp.set('focus', params.focus)
    if (params.types.length) sp.set('types', params.types.join(','))
    if (params.depth === 2) sp.set('depth', '2')
    if (params.all) sp.set('all', '1')
    api<GraphData>(`/api/graph?${sp}`)
      .then((d) => { if (!cancelled) { setData(d); setSelected(d.focus?.id ?? null) } })
      .catch((e) => { if (!cancelled) setError(String(e)) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [params])

  const nodes = React.useMemo(() => data?.nodes ?? [], [data])
  const edges = React.useMemo(() => data?.edges ?? [], [data])
  const byId = React.useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes])
  const adj = React.useMemo(() => {
    const m = new Map<string, { id: string; relation: string; weight: number }[]>()
    for (const e of edges) {
      m.set(e.source, [...(m.get(e.source) ?? []), { id: e.target, relation: e.relation, weight: e.weight }])
      m.set(e.target, [...(m.get(e.target) ?? []), { id: e.source, relation: e.relation, weight: e.weight }])
    }
    return m
  }, [edges])

  // Force layout, animated. Positions live in a ref; a reducer tick re-renders.
  const userMoved = React.useRef(false)
  const fitToNodes = React.useCallback(() => {
    const pts = [...posRef.current.values()]
    if (!pts.length) return
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of pts) { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y) }
    const pad = 70
    const w = Math.max(200, maxX - minX + pad * 2), h = Math.max(200, maxY - minY + pad * 2)
    const k = Math.min(1.6, Math.min(W / w, H / h))
    view.current = { k, x: W / 2 - ((minX + maxX) / 2) * k, y: H / 2 - ((minY + maxY) / 2) * k }
  }, [])
  React.useEffect(() => {
    const pos = posRef.current
    const keep = new Set(nodes.map((n) => n.id))
    for (const k of [...pos.keys()]) if (!keep.has(k)) pos.delete(k)
    const focusId = data?.focus?.id
    nodes.forEach((n, i) => {
      if (pos.has(n.id)) return
      const a = (i / Math.max(1, nodes.length)) * Math.PI * 2 * 3.7
      const r = n.id === focusId ? 0 : 60 + Math.sqrt(i) * 28
      pos.set(n.id, { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: 0, vy: 0 })
    })
    if (focusId && pos.get(focusId)) { const f = pos.get(focusId)!; f.x = W / 2; f.y = H / 2; f.fixed = true }
    userMoved.current = false
    const E = edges.filter((e) => pos.has(e.source) && pos.has(e.target))
    const deg = new Map<string, number>()
    for (const e of E) { deg.set(e.source, (deg.get(e.source) ?? 0) + 1); deg.set(e.target, (deg.get(e.target) ?? 0) + 1) }
    const arr = nodes.map((n) => pos.get(n.id)!)
    let iter = 0
    const total = Math.min(360, 120 + nodes.length * 2)
    const id = ++alive.current
    const step = () => {
      if (alive.current !== id) return
      const alpha = 0.08 + 0.92 * (1 - iter / total) ** 2
      // Repulsion between every pair (n² is fine for a few hundred nodes).
      for (let i = 0; i < arr.length; i++) {
        const pa = arr[i]!
        for (let j = i + 1; j < arr.length; j++) {
          const pb = arr[j]!
          let dx = pb.x - pa.x, dy = pb.y - pa.y
          let d2 = dx * dx + dy * dy
          if (d2 < 1) { dx = (Math.random() - 0.5) * 2; dy = (Math.random() - 0.5) * 2; d2 = dx * dx + dy * dy }
          const d = Math.sqrt(d2)
          const f = Math.min(24, 2600 / d2) * alpha
          const ux = dx / d, uy = dy / d
          pa.vx -= ux * f; pa.vy -= uy * f; pb.vx += ux * f; pb.vy += uy * f
        }
      }
      // Springs, softened for hubs so a node with 40 links does not get torn apart.
      for (const e of E) {
        const pa = pos.get(e.source)!, pb = pos.get(e.target)!
        const dx = pb.x - pa.x, dy = pb.y - pa.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        const rest = 70 + 6 * Math.min(8, Math.max(deg.get(e.source) ?? 1, deg.get(e.target) ?? 1))
        const stiff = 0.03 / Math.sqrt(Math.max(1, Math.min(deg.get(e.source) ?? 1, deg.get(e.target) ?? 1)))
        const f = (d - rest) * stiff * alpha * Math.min(1 + e.weight * 0.1, 1.6)
        pa.vx += (dx / d) * f; pa.vy += (dy / d) * f; pb.vx -= (dx / d) * f; pb.vy -= (dy / d) * f
      }
      for (const p of arr) {
        if (p.fixed) { p.vx = 0; p.vy = 0; continue }
        p.vx += (W / 2 - p.x) * 0.012 * alpha; p.vy += (H / 2 - p.y) * 0.012 * alpha
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (sp > 14) { p.vx *= 14 / sp; p.vy *= 14 / sp }
        p.x += p.vx; p.y += p.vy; p.vx *= 0.55; p.vy *= 0.55
      }
      iter++
      if (!userMoved.current && (iter % 4 === 0 || iter === total)) fitToNodes()
      force()
      if (iter < total) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
    return () => { alive.current++ }
  }, [nodes, edges, data?.focus?.id, fitToNodes])

  /* ------------------------------ interaction ------------------------------ */
  const toSvg = (cx0: number, cy0: number) => {
    const svg = svgRef.current
    if (!svg) return { x: cx0, y: cy0 }
    const r = svg.getBoundingClientRect()
    const x = ((cx0 - r.left) / r.width) * W, y = ((cy0 - r.top) / r.height) * H
    return { x: (x - view.current.x) / view.current.k, y: (y - view.current.y) / view.current.k }
  }
  const onPointerDown = (e: React.PointerEvent, nodeId?: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    const p = nodeId ? posRef.current.get(nodeId) : null
    drag.current = nodeId && p ? { kind: 'node', id: nodeId, sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y, moved: false } : { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: view.current.x, oy: view.current.y, moved: false }
    if (nodeId) e.stopPropagation()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d) return
    const svg = svgRef.current
    const scale = svg ? W / svg.getBoundingClientRect().width : 1
    const dx = (e.clientX - d.sx) * scale, dy = (e.clientY - d.sy) * scale
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true
    if (d.kind === 'pan') { userMoved.current = true; view.current.x = d.ox + dx; view.current.y = d.oy + dy }
    else if (d.id) { const p = posRef.current.get(d.id); if (p) { p.x = d.ox + dx / view.current.k; p.y = d.oy + dy / view.current.k; p.fixed = true } }
    force()
  }
  const onPointerUp = (e: React.PointerEvent, nodeId?: string) => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (!d.moved) {
      if (nodeId) setSelected((s) => (s === nodeId ? null : nodeId))
      else if (e.target === svgRef.current || (e.target as Element).tagName === 'rect') setSelected(null)
    }
    force()
  }
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const { x, y } = toSvg(e.clientX, e.clientY)
    userMoved.current = true
    const k = Math.max(0.3, Math.min(4, view.current.k * (e.deltaY < 0 ? 1.12 : 0.89)))
    view.current = { k, x: (x * view.current.k + view.current.x) - x * k, y: (y * view.current.k + view.current.y) - y * k }
    force()
  }
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0]!, e.touches[1]!]
      pinch.current = { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), k: view.current.k }
    }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      e.preventDefault()
      const [a, b] = [e.touches[0]!, e.touches[1]!]
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      userMoved.current = true
      const k = Math.max(0.3, Math.min(4, pinch.current.k * (d / pinch.current.d)))
      const c = toSvg((a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2)
      view.current = { k, x: (c.x * view.current.k + view.current.x) - c.x * k, y: (c.y * view.current.k + view.current.y) - c.y * k }
      force()
    }
  }
  const fit = () => { userMoved.current = false; fitToNodes(); force() }
  const focusOn = (id: string) => setParams((p) => ({ ...p, focus: id, types: [] }))
  const toggleType = (t: GraphNodeType) => setParams((p) => {
    const cur = p.types.length ? p.types : p.focus ? ALL_TYPES : (['person', 'company', 'topic', 'project', 'tag'] as GraphNodeType[])
    const next = cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]
    return { ...p, types: next }
  })

  /* -------------------------------- derived -------------------------------- */
  const activeTypes = params.types.length ? new Set(params.types) : new Set(params.focus ? ALL_TYPES : (['person', 'company', 'topic', 'project', 'tag'] as GraphNodeType[]))
  const query = q.trim().toLowerCase()
  const matches = query ? new Set(nodes.filter((n) => n.label.toLowerCase().includes(query)).map((n) => n.id)) : null
  const hot = hover ?? selected
  const neighbours = hot ? new Set([hot, ...(adj.get(hot) ?? []).map((x) => x.id)]) : null
  const sel = selected ? byId.get(selected) ?? null : null
  const selEdges = selected ? (adj.get(selected) ?? []).map((x) => ({ ...x, node: byId.get(x.id)! })).filter((x) => x.node).sort((a, b) => b.weight - a.weight) : []
  const counts = new Map<GraphNodeType, number>()
  for (const n of nodes) counts.set(n.type, (counts.get(n.type) ?? 0) + 1)
  const pos = posRef.current
  const v = view.current

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="flex h-8 items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] text-fg-3 focus-within:border-accent pointer-coarse:h-10">
          <Search className="h-3.5 w-3.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find in graph" className="w-32 bg-transparent text-fg outline-none placeholder:text-fg-3 sm:w-44" />
          {q ? <button onClick={() => setQ('')} aria-label="Clear"><X className="h-3.5 w-3.5" /></button> : null}
        </label>
        <div className="flex flex-wrap items-center gap-1">
          {ALL_TYPES.map((t) => (
            <button key={t} onClick={() => toggleType(t)} className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[12px]', activeTypes.has(t) ? 'border-border-2 bg-surface-2 text-fg' : 'border-border text-fg-3 hover:bg-surface-2')}>
              <span className="h-2 w-2 rounded-full" style={{ background: COLORS[t], opacity: activeTypes.has(t) ? 1 : 0.4 }} />{LABELS[t]}{counts.get(t) ? <span className="text-fg-3">{counts.get(t)}</span> : null}
            </button>
          ))}
        </div>
        {params.focus ? (
          <div className="flex items-center gap-1 text-[12.5px]">
            <button onClick={() => setParams((p) => ({ ...p, depth: p.depth === 2 ? 1 : 2 }))} className={cx('inline-flex items-center gap-1 rounded-md border px-2 py-1', params.depth === 2 ? 'border-border-2 bg-surface-2' : 'border-border text-fg-3')}><Layers className="h-3.5 w-3.5" /> {params.depth === 2 ? '2 hops' : '1 hop'}</button>
            <button onClick={() => setParams((p) => ({ ...p, focus: null, types: [] }))} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-fg-2 hover:bg-surface-2"><X className="h-3.5 w-3.5" /> Clear focus</button>
          </div>
        ) : null}
        <button onClick={() => setParams((p) => ({ ...p, all: !p.all }))} className={cx('rounded-md border px-2 py-1 text-[12px]', params.all ? 'border-border-2 bg-surface-2' : 'border-border text-fg-3 hover:bg-surface-2')}>{params.all ? 'All contexts' : 'This context'}</button>
        <button onClick={fit} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-fg-3 hover:bg-surface-2" title="Reset view"><Maximize2 className="h-3.5 w-3.5" /></button>
        <span className="ml-auto text-[12px] text-fg-3">{loading ? <span className="inline-flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> loading</span> : `${nodes.length} nodes · ${edges.length} links${data?.truncated ? ' · trimmed' : ''}`}</span>
      </div>
      {error ? <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-[13px] text-danger">{error}</p> : null}
      <div className="grid gap-3 lg:grid-cols-[1fr_300px]">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface" style={{ touchAction: 'none' }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-[62vh] w-full select-none lg:h-[70vh]"
            onPointerDown={(e) => onPointerDown(e)}
            onPointerMove={onPointerMove}
            onPointerUp={(e) => onPointerUp(e)}
            onPointerCancel={() => { drag.current = null }}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={() => { pinch.current = null }}
          >
            <rect width={W} height={H} fill="transparent" />
            <g transform={`translate(${v.x},${v.y}) scale(${v.k})`}>
              {edges.map((e, i) => {
                const a = pos.get(e.source), b = pos.get(e.target)
                if (!a || !b) return null
                const on = hot && (e.source === hot || e.target === hot)
                const dim = (neighbours && !on) || (matches && !(matches.has(e.source) && matches.has(e.target)))
                return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? 'var(--accent)' : 'var(--border-2)'} strokeWidth={(on ? 1.8 : Math.min(0.8 + e.weight * 0.25, 2.4)) / v.k} opacity={dim ? 0.12 : on ? 1 : 0.7} />
              })}
              {nodes.map((n) => {
                const p = pos.get(n.id)
                if (!p) return null
                const r = (n.type === 'tag' ? 4 : 5) + Math.min(n.weight, 40) * 0.35
                const isSel = n.id === selected
                const dim = (neighbours && !neighbours.has(n.id)) || (matches && !matches.has(n.id))
                const showLabel = v.k > 0.7 || isSel || (hot && neighbours?.has(n.id)) || r > 9 || (matches && matches.has(n.id))
                return (
                  <g key={n.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer" opacity={dim ? 0.18 : 1}
                    onPointerDown={(e) => onPointerDown(e, n.id)} onPointerUp={(e) => onPointerUp(e, n.id)} onPointerEnter={() => setHover(n.id)} onPointerLeave={() => setHover(null)}
                    onDoubleClick={() => router.push(n.href)}>
                    {isSel ? <circle r={r + 5 / v.k} fill="none" stroke="var(--accent)" strokeWidth={2 / v.k} /> : null}
                    {n.type === 'tag' ? <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={3} fill={COLORS[n.type]} opacity={0.9} />
                      : n.type === 'note' || n.type === 'meeting' || n.type === 'decision' ? <rect x={-r} y={-r * 0.8} width={r * 2} height={r * 1.6} rx={2} fill={COLORS[n.type]} opacity={0.85} />
                      : <circle r={r} fill={COLORS[n.type]} opacity={0.92} />}
                    {showLabel ? <text y={r + 11 / v.k} textAnchor="middle" fontSize={11 / v.k} fill="var(--fg-2)" fontWeight={isSel ? 600 : 400} style={{ paintOrder: 'stroke', stroke: 'var(--surface)', strokeWidth: 3 / v.k }}>{n.label.length > 26 ? n.label.slice(0, 24) + '…' : n.label}</text> : null}
                  </g>
                )
              })}
            </g>
          </svg>
          {!loading && nodes.length === 0 ? <div className="absolute inset-0 flex items-center justify-center text-[13.5px] text-fg-3">Nothing to show yet. Notes, people and tags appear here as AI reads what you write.</div> : null}
          <div className="pointer-events-none absolute bottom-2 left-3 text-[11px] text-fg-3">drag to pan · scroll or pinch to zoom · drag a node to pin it · click to inspect · double-click to open</div>
        </div>
        <aside className="rounded-xl border border-border bg-surface p-3">
          {sel ? (
            <div>
              <div className="mb-1 flex items-center gap-2 text-[11.5px] uppercase tracking-[0.06em] text-fg-3"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[sel.type] }} />{sel.type}{sel.date ? <span className="ml-auto normal-case tracking-normal">{new Date(sel.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> : null}</div>
              <div className="text-[15px] font-semibold leading-snug">{sel.label}</div>
              {sel.meta ? <div className="mt-0.5 text-[12.5px] text-fg-2">{sel.meta}</div> : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link href={sel.href} className="inline-flex h-8 items-center gap-1 rounded-[9px] bg-accent px-2.5 text-[12.5px] font-medium text-accent-fg hover:opacity-90"><ExternalLink className="h-3.5 w-3.5" /> Open</Link>
                {params.focus !== sel.id ? <button onClick={() => focusOn(sel.id)} className="inline-flex h-8 items-center gap-1 rounded-[9px] border border-border px-2.5 text-[12.5px] hover:bg-surface-2"><Crosshair className="h-3.5 w-3.5" /> Focus here</button> : null}
              </div>
              <div className="mt-4 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Connected · {selEdges.length}</div>
              <ul className="mt-1 max-h-[46vh] divide-y divide-border overflow-y-auto text-[13px]">
                {selEdges.slice(0, 80).map((x) => (
                  <li key={x.id}>
                    <button onClick={() => setSelected(x.id)} className="flex w-full items-start gap-2 py-1.5 text-left hover:text-accent">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[x.node.type] }} />
                      <span className="min-w-0 flex-1"><span className="block truncate">{x.node.label}</span><span className="text-[11.5px] text-fg-3">{x.relation}{x.weight > 1 ? ` · ${Math.round(x.weight)}` : ''}</span></span>
                    </button>
                  </li>
                ))}
                {!selEdges.length ? <li className="py-2 text-fg-3">No links among the nodes shown. Try “Focus here”.</li> : null}
              </ul>
            </div>
          ) : (
            <div className="text-[13px] text-fg-2">
              <div className="mb-2 font-medium text-fg">How to read this</div>
              <p>Bigger nodes are mentioned more. Lines are relationships the pipeline found: who works where, who discussed what, which notes share people and topics, which tags travel together.</p>
              <p className="mt-2">Click a node to see everything it connects to; <em>Focus here</em> rebuilds the graph around it, two hops deep if you like.</p>
              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-fg-3">{ALL_TYPES.map((t) => <span key={t} className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[t] }} />{LABELS[t]}</span>)}</div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export type { GNode, GEdge }
