/** A small interactive relationship network around one record (lazy-loaded). */
import { useEffect, useRef } from 'react'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'
import { useStore } from '../data/store.tsx'
import { FAMILY_BY_ID } from '../lib/meta.ts'
import { entityHref } from '../app/router.ts'

cytoscape.use(fcose)

export default function EgoGraph({ id, limit = 40 }: { id: string; limit?: number }) {
  const store = useStore()
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!el.current) return
    const center = store.byId.get(id)!
    const nb = store.neighbours(id).filter((x) => x.other.summary)
    const others = [...new Map(nb.map((x) => [x.other.id, x.other])).values()].sort((a, b) => b.m.degree - a.m.degree).slice(0, limit)
    const ids = new Set([id, ...others.map((o) => o.id)])
    const nodes = [center, ...others].map((n) => ({ data: { id: n.id, label: n.name.replace(/\s*\((.*)\)$/, ''), color: FAMILY_BY_ID[n.family].dark, shape: FAMILY_BY_ID[n.family].shape, size: n.id === id ? 34 : 12 + Math.sqrt(n.m.degree) * 2.2 } }))
    const seen = new Set<string>()
    const edges = store.edges.filter((e) => ids.has(e.s) && ids.has(e.o)).filter((e) => { const k = [e.s, e.o].sort().join('|'); if (seen.has(k)) return false; seen.add(k); return true })
      .map((e) => ({ data: { id: e.id, source: e.s, target: e.o, center: e.s === id || e.o === id ? 1 : 0, dashed: e.evidenceClass >= 6 ? 1 : 0 } }))
    const cy = cytoscape({
      container: el.current,
      elements: [...nodes, ...edges],
      wheelSensitivity: 0.25,
      userZoomingEnabled: true,
      style: [
        { selector: 'node', style: { 'background-color': 'data(color)', shape: 'data(shape)' as never, width: 'data(size)', height: 'data(size)', label: 'data(label)', 'font-size': 10, 'font-family': 'Inter, sans-serif', color: '#ece4d3', 'text-outline-color': '#12162b', 'text-outline-width': 2, 'text-valign': 'bottom', 'text-margin-y': 3 } as never },
        { selector: `node[id = "${id.replace(/"/g, '')}"]`, style: { 'border-width': 3, 'border-color': '#f3ead8', 'font-size': 13, 'font-weight': 600 } as never },
        { selector: 'edge', style: { width: 0.7, 'line-color': '#4d5280', opacity: 0.6, 'curve-style': 'haystack' } as never },
        { selector: 'edge[center = 1]', style: { 'line-color': '#d6a957', opacity: 0.7, width: 1.1 } as never },
        { selector: 'edge[dashed = 1]', style: { 'line-style': 'dashed' } as never },
      ],
      layout: { name: 'fcose', animate: false, randomize: true, nodeRepulsion: () => 7000, idealEdgeLength: () => 70, padding: 20 } as never,
    })
    cy.on('tap', 'node', (ev) => { const nid = ev.target.id(); if (nid !== id) window.location.hash = entityHref(nid) })
    cy.on('mouseover', 'node', () => { el.current!.style.cursor = 'pointer' })
    cy.on('mouseout', 'node', () => { el.current!.style.cursor = 'default' })
    return () => cy.destroy()
  }, [id, store, limit])
  return <div ref={el} className="w-full h-[420px] rounded-xl bg-night" role="img" aria-label="Relationship network. The same relationships are listed in text below." />
}
