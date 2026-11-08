/**
 * The hero constellation: the most connected real records of the graph, laid out by
 * a slow force simulation and drawn on canvas. Every point is a real entity; every
 * line a real assertion. Hover names it; click opens it.
 */
import { useEffect, useRef, useState } from 'react'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, type SimulationNodeDatum } from 'd3-force'
import { useStore, type GNode } from '../data/store.tsx'
import { entityHref } from '../app/router.ts'
import { FAMILY_BY_ID, TYPE_LABEL } from '../lib/meta.ts'

interface P extends SimulationNodeDatum { n: GNode; r: number }

export function Constellation({ count = 150 }: { count?: number }) {
  const { real, edges } = useStore()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<{ n: GNode; x: number; y: number } | null>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const ctx = el.getContext('2d')!
    const top = [...real].sort((a, b) => b.m.degree - a.m.degree).slice(0, count)
    const ids = new Set(top.map((n) => n.id))
    const pts: P[] = top.map((n) => ({ n, r: 1.6 + Math.sqrt(n.m.degree) * 0.55 }))
    const byId = new Map(pts.map((p) => [p.n.id, p]))
    const seen = new Set<string>()
    const links = edges
      .filter((e) => ids.has(e.s) && ids.has(e.o))
      .filter((e) => { const k = [e.s, e.o].sort().join('|'); if (seen.has(k)) return false; seen.add(k); return true })
      .map((e) => ({ source: byId.get(e.s)!, target: byId.get(e.o)! }))
    let w = 0, h = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      w = el.clientWidth; h = el.clientHeight
      el.width = w * dpr; el.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sim = forceSimulation(pts)
      .force('link', forceLink(links).distance(46).strength(0.25))
      .force('charge', forceManyBody().strength(-38))
      .force('center', forceCenter(w * (w > 900 ? 0.68 : 0.5), h * 0.5))
      .force('collide', forceCollide<P>().radius((p) => p.r + 3))
      .alphaDecay(reduce ? 0.2 : 0.012)
    let t = 0
    let raf = 0
    const draw = () => {
      t += 0.004
      ctx.clearRect(0, 0, w, h)
      ctx.lineWidth = 0.6
      for (const l of links) {
        const a = l.source as P, b = l.target as P
        ctx.strokeStyle = 'rgba(214,169,87,0.13)'
        ctx.beginPath(); ctx.moveTo(a.x!, a.y!); ctx.lineTo(b.x!, b.y!); ctx.stroke()
      }
      for (const p of pts) {
        const f = FAMILY_BY_ID[p.n.family]
        const tw = reduce ? 1 : 0.75 + 0.25 * Math.sin(t * 6 + (p.index ?? 0))
        ctx.globalAlpha = 0.18 * tw
        ctx.fillStyle = f.dark
        ctx.beginPath(); ctx.arc(p.x!, p.y!, p.r * 3.2, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 0.95
        ctx.beginPath(); ctx.arc(p.x!, p.y!, p.r, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }
      // label the brightest few
      ctx.font = '500 11px Inter, sans-serif'
      ctx.fillStyle = 'rgba(236,228,211,0.78)'
      for (const p of pts.slice(0, 24).filter((q) => w < 900 || q.x! > w * 0.5).slice(0, 12)) ctx.fillText(p.n.name.replace(/\s*\(.*\)/, ''), p.x! + p.r + 4, p.y! + 3)
      raf = requestAnimationFrame(draw)
    }
    sim.on('tick', () => { /* drawn by raf */ })
    draw()
    // gentle drift once settled
    const drift = reduce ? 0 : window.setInterval(() => { sim.alpha(0.05).restart() }, 7000)
    const onResize = () => { resize(); (sim.force('center') as ReturnType<typeof forceCenter>).x(w * (w > 900 ? 0.68 : 0.5)).y(h * 0.5); sim.alpha(0.3).restart() }
    window.addEventListener('resize', onResize)
    const pick = (ev: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = ev.clientX - rect.left, y = ev.clientY - rect.top
      let best: P | null = null, bd = 14 * 14
      for (const p of pts) { const d = (p.x! - x) ** 2 + (p.y! - y) ** 2; if (d < bd) { bd = d; best = p } }
      return best ? { p: best, x, y } : null
    }
    const onMove = (ev: MouseEvent) => { const hit = pick(ev); setHover(hit ? { n: hit.p.n, x: hit.x, y: hit.y } : null); el.style.cursor = hit ? 'pointer' : 'default' }
    const onClick = (ev: MouseEvent) => { const hit = pick(ev); if (hit) window.location.hash = entityHref(hit.p.n.id) }
    el.addEventListener('mousemove', onMove)
    el.addEventListener('click', onClick)
    el.addEventListener('mouseleave', () => setHover(null))
    return () => { cancelAnimationFrame(raf); sim.stop(); clearInterval(drift); window.removeEventListener('resize', onResize); el.removeEventListener('mousemove', onMove); el.removeEventListener('click', onClick) }
  }, [real, edges, count])

  return (
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute inset-0 z-[1]" style={{ background: 'linear-gradient(90deg, rgba(18,22,43,0.94) 0%, rgba(18,22,43,0.78) 34%, rgba(18,22,43,0) 62%)' }} />
      <canvas ref={canvas} className="w-full h-full block" aria-label="A constellation of the most connected records in the knowledge graph. Use search or the explorer for an accessible view." role="img" />
      {hover ? (
        <div className="pointer-events-none absolute z-10 rounded-lg px-3 py-2 text-xs shadow-lg" style={{ left: Math.min(hover.x + 14, window.innerWidth - 260), top: hover.y + 12, background: 'rgba(26,31,58,0.95)', border: '1px solid var(--night-rule)', color: 'var(--night-ink)', maxWidth: 240 }}>
          <div className="font-semibold">{hover.n.name}</div>
          <div style={{ color: 'var(--night-ink-2)' }}>{TYPE_LABEL[hover.n.type]} · {hover.n.m.degree} connections</div>
        </div>
      ) : null}
    </div>
  )
}
