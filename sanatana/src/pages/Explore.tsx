/**
 * Screen 1 — The Universe of Hindu Literature.
 *
 * Starts from eight clusters; click to expand into corpora, texts, narratives,
 * characters, temples and objects; click any record to recentre on it. Every edge
 * opens its evidence. A "universe" mode shows the whole graph at once.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape'
import fcose from 'cytoscape-fcose'
import { Maximize2, Minus, Plus, RotateCcw, Orbit, Layers, MapPin, Clock, ExternalLink, X } from 'lucide-react'
import { useStore, type GEdge, type GNode, type Store, type Family } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { entityHref, href, navigate } from '../app/router.ts'
import { FAMILIES, FAMILY_BY_ID, TYPE_LABEL, yearLabel, EVIDENCE } from '../lib/meta.ts'
import { Glyph, EvidenceBadge, StatusBadge, ConfidenceDots, SourceList } from '../components/ui.tsx'
import { search } from '../lib/search.ts'

cytoscape.use(fcose)

interface Hub { id: string; label: string; collections: string[]; types?: string[]; blurb: string }
const HUBS: Hub[] = [
  { id: 'hub:vedic', label: 'Vedic Literature', collections: ['col:vedic-samhitas', 'col:brahmanas', 'col:aranyakas', 'col:vedangas', 'col:sutras'], blurb: 'Saṃhitās, Brāhmaṇas, Āraṇyakas, Vedāṅgas and Sūtras' },
  { id: 'hub:upanishadic', label: 'Upaniṣadic Literature', collections: ['col:upanishads'], blurb: 'The principal Upaniṣads' },
  { id: 'hub:itihasa', label: 'Itihāsa', collections: ['col:itihasa'], blurb: 'Rāmāyaṇa, Mahābhārata, Harivaṃśa' },
  { id: 'hub:puranas', label: 'Purāṇas', collections: ['col:mahapuranas', 'col:upapuranas', 'col:dharmashastra'], blurb: 'Mahāpurāṇas, Upapurāṇas and Dharmaśāstra' },
  { id: 'hub:agama', label: 'Āgamas & Tantras', collections: ['col:agamas-tantras'], blurb: 'Pāñcarātra, Śaiva and Śākta scriptures' },
  { id: 'hub:regional', label: 'Regional Literature', collections: ['col:regional-retellings', 'col:southeast-asian'], blurb: 'Retellings in Indian languages and Southeast Asia' },
  { id: 'hub:devotional', label: 'Devotional Literature', collections: ['col:bhakti-literature'], blurb: 'Āḻvārs, Nāyaṉmārs and later bhakti poetry' },
  { id: 'hub:heritage', label: 'Temples & Material Heritage', collections: [], types: ['temple', 'site', 'artifact', 'inscription', 'manuscript'], blurb: 'Temples, sites, inscriptions, objects, manuscripts' },
]
const HUB_BY_ID = new Map(HUBS.map((h) => [h.id, h]))
const MAX_EXPAND = 36

function nodeYear(n: GNode): number | undefined {
  const own = (n.dates ?? []).filter((d) => d.system !== 'traditional' && typeof d.start === 'number').map((d) => d.start!)
  const derived = [n.m.earliestText?.year, n.m.earliestMaterial?.year].filter((y): y is number => typeof y === 'number')
  const all = [...own, ...derived]
  return all.length ? Math.min(...all) : undefined
}

function hubMembers(store: Store, hub: Hub): string[] {
  if (hub.types) return store.real.filter((n) => hub.types!.includes(n.type)).sort((a, b) => b.m.degree - a.m.degree).map((n) => n.id)
  const out: string[] = []
  for (const c of hub.collections) {
    if (!store.byId.has(c)) continue
    out.push(c)
    for (const e of store.inc.get(c) ?? []) if (e.p === 'PART_OF' && store.byId.get(e.s)?.type !== 'passage') out.push(e.s)
  }
  return [...new Set(out)]
}

export default function Explore({ route }: { route: Route }) {
  const store = useStore()
  const { byId, real } = store
  const container = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [mode, setMode] = useState<'clusters' | 'universe'>(() => (route.query.get('mode') === 'universe' ? 'universe' : 'clusters'))
  const [visible, setVisible] = useState<Set<string>>(() => new Set(HUBS.map((h) => h.id)))
  const [selected, setSelected] = useState<string | null>(null)
  const [edgeSel, setEdgeSel] = useState<string | null>(null)
  const [families, setFamilies] = useState<Set<Family>>(() => new Set(FAMILIES.map((f) => f.id)))
  const [evidence, setEvidence] = useState<Set<number>>(() => new Set([1, 2, 3, 4, 5, 6, 7]))
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [yearCap, setYearCap] = useState<number | null>(null)
  const [includeUndated, setIncludeUndated] = useState(true)
  const [q, setQ] = useState('')

  // focus from the URL: #/graph?focus=char:krishna
  const focus = route.query.get('focus')
  useEffect(() => {
    if (focus && byId.has(focus)) recentre(focus)
  }, [focus]) // eslint-disable-line react-hooks/exhaustive-deps

  function neighboursOf(id: string): string[] {
    const hub = HUB_BY_ID.get(id)
    if (hub) return hubMembers(store, hub)
    return store.neighbours(id).map((x) => x.other.id).filter((x) => byId.get(x)?.summary)
  }
  function expand(id: string, all = false) {
    const nb = [...new Set(neighboursOf(id))]
      .filter((x) => !visible.has(x))
      .sort((a, b) => (byId.get(b)?.m.degree ?? 0) - (byId.get(a)?.m.degree ?? 0))
    const add = all ? nb : nb.slice(0, MAX_EXPAND)
    setVisible((v) => new Set([...v, id, ...add]))
  }
  function recentre(id: string) {
    setMode('clusters')
    const nb = [...new Set(neighboursOf(id))].sort((a, b) => (byId.get(b)?.m.degree ?? 0) - (byId.get(a)?.m.degree ?? 0)).slice(0, MAX_EXPAND)
    setVisible(new Set([id, ...nb]))
    setSelected(id)
    setEdgeSel(null)
  }

  // which nodes/edges pass filters
  const passNode = (n: GNode) => {
    if (!families.has(n.family)) return false
    if (yearCap !== null) {
      const y = nodeYear(n)
      if (y === undefined) return includeUndated
      if (y > yearCap) return false
    }
    return true
  }
  const passEdge = (e: GEdge) => evidence.has(e.evidenceClass) && (!verifiedOnly || e.status === 'verified-online' || e.status === 'source-checked')

  const elements = useMemo<ElementDefinition[]>(() => {
    const els: ElementDefinition[] = []
    const ids = new Set<string>()
    if (mode === 'universe') {
      for (const n of real) if (passNode(n)) ids.add(n.id)
    } else {
      for (const id of visible) {
        if (HUB_BY_ID.has(id)) { ids.add(id); continue }
        const n = byId.get(id)
        if (n && passNode(n)) ids.add(id)
      }
    }
    for (const id of ids) {
      const hub = HUB_BY_ID.get(id)
      if (hub) {
        els.push({ group: 'nodes', data: { id, label: hub.label, hub: 1, size: 64, color: '#d6a957', shape: 'ellipse' } })
        continue
      }
      const n = byId.get(id)!
      const fam = FAMILY_BY_ID[n.family]
      els.push({ group: 'nodes', data: { id, label: n.name.replace(/\s*\((.*)\)\s*$/, ''), size: 9 + Math.sqrt(n.m.degree) * 3.2, color: fam.dark, shape: fam.shape, fam: n.family } })
    }
    const seen = new Set<string>()
    for (const e of store.edges) {
      if (!ids.has(e.s) || !ids.has(e.o) || !passEdge(e)) continue
      const k = `${e.s}|${e.o}|${e.p}`
      if (seen.has(k)) continue
      seen.add(k)
      els.push({ group: 'edges', data: { id: `e:${e.id}`, source: e.s, target: e.o, eid: e.id, label: e.p.replace(/_/g, ' ').toLowerCase(), ev: e.evidenceClass, dashed: e.evidenceClass >= 6 ? 1 : 0 } })
    }
    if (mode === 'clusters') {
      for (const hub of HUBS) {
        if (!ids.has(hub.id)) continue
        for (const m of hubMembers(store, hub)) if (ids.has(m) && (byId.get(m)?.type === 'collection' || hub.types)) els.push({ group: 'edges', data: { id: `h:${hub.id}:${m}`, source: hub.id, target: m, hubEdge: 1 } })
      }
    }
    return els
  }, [mode, visible, families, evidence, verifiedOnly, yearCap, includeUndated, store]) // eslint-disable-line react-hooks/exhaustive-deps

  // create cytoscape once
  useEffect(() => {
    if (!container.current) return
    const cy = cytoscape({
      container: container.current,
      wheelSensitivity: 0.25,
      minZoom: 0.08,
      maxZoom: 3,
      style: [
        { selector: 'node', style: { 'background-color': 'data(color)', shape: 'data(shape)' as never, width: 'data(size)', height: 'data(size)', label: 'data(label)', color: '#ece4d3', 'font-family': 'Inter, sans-serif', 'font-size': 10, 'text-valign': 'bottom', 'text-margin-y': 4, 'text-outline-color': '#12162b', 'text-outline-width': 2, 'min-zoomed-font-size': 7, 'underlay-color': 'data(color)', 'underlay-opacity': 0.16, 'underlay-padding': 5, 'underlay-shape': 'ellipse', 'border-width': 0, 'transition-property': 'opacity', 'transition-duration': 200 } as never },
        { selector: 'node[hub = 1]', style: { 'background-color': '#1a1f3a', 'border-width': 2, 'border-color': '#d6a957', 'font-size': 14, 'font-family': 'Cormorant Garamond, Georgia, serif', 'font-weight': 600, 'text-valign': 'center', 'text-margin-y': 0, 'text-wrap': 'wrap', 'text-max-width': '90px', color: '#f3ead8', 'underlay-color': '#d6a957', 'underlay-opacity': 0.12, 'underlay-padding': 12 } as never },
        { selector: 'edge', style: { width: 0.7, 'line-color': '#5b5f86', opacity: 0.5, 'curve-style': 'haystack', 'haystack-radius': 0 } as never },
        { selector: 'edge[dashed = 1]', style: { 'line-style': 'dashed', 'line-dash-pattern': [3, 3] } as never },
        { selector: 'edge[hubEdge = 1]', style: { 'line-color': '#d6a957', opacity: 0.35, width: 1.2 } as never },
        { selector: '.faded', style: { opacity: 0.12 } },
        { selector: 'edge.hl', style: { 'line-color': '#d6a957', opacity: 0.95, width: 1.6, 'curve-style': 'bezier', label: 'data(label)', 'font-size': 8, color: '#d6c9a8', 'text-rotation': 'autorotate', 'text-background-color': '#12162b', 'text-background-opacity': 0.85, 'text-background-padding': '2px' } as never },
        { selector: 'node.sel', style: { 'border-width': 3, 'border-color': '#f3ead8', 'underlay-opacity': 0.35 } as never },
        { selector: 'edge.esel', style: { 'line-color': '#f3ead8', width: 2.4, opacity: 1 } as never },
      ],
    })
    cyRef.current = cy
    ;(window as unknown as { __cy?: Core }).__cy = cy
    cy.on('tap', 'node', (ev) => {
      const id = ev.target.id() as string
      if (HUB_BY_ID.has(id)) { setSelected(id); setEdgeSel(null); expandRef.current(id); return }
      setSelected(id)
      setEdgeSel(null)
    })
    cy.on('dbltap', 'node', (ev) => { const id = ev.target.id() as string; if (!HUB_BY_ID.has(id)) recentreRef.current(id) })
    cy.on('tap', 'edge', (ev) => { const eid = ev.target.data('eid'); if (eid) { setEdgeSel(eid); setSelected(null) } })
    cy.on('tap', (ev) => { if (ev.target === cy) { setSelected(null); setEdgeSel(null) } })
    cy.on('mouseover', 'node', (ev) => {
      const nb = ev.target.closedNeighborhood()
      cy.elements().not(nb).addClass('faded')
      nb.edges().addClass('hl')
      container.current!.style.cursor = 'pointer'
    })
    cy.on('mouseout', 'node', () => { cy.elements().removeClass('faded'); cy.edges().removeClass('hl'); container.current!.style.cursor = 'default' })
    return () => cy.destroy()
  }, [])
  const expandRef = useRef(expand)
  const recentreRef = useRef(recentre)
  expandRef.current = expand
  recentreRef.current = recentre

  // sync elements + layout
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    const want = new Set(elements.map((e) => e.data.id as string))
    cy.batch(() => {
      cy.elements().filter((el) => !want.has(el.id())).remove()
      const fresh = elements.filter((e) => cy.getElementById(e.data.id as string).empty())
      // place new nodes near an existing neighbour so expansion reads as growth
      const anchor = selected && !cy.getElementById(selected).empty() ? cy.getElementById(selected).position() : { x: 0, y: 0 }
      cy.add(fresh.map((e) => (e.group === 'nodes' ? { ...e, position: { x: anchor.x + (Math.random() - 0.5) * 80, y: anchor.y + (Math.random() - 0.5) * 80 } } : e)))
      for (const e of elements) { const el = cy.getElementById(e.data.id as string); if (!el.empty()) el.data(e.data) }
    })
    const n = cy.nodes().length
    const onlyHubs = cy.nodes().every((x) => x.data('hub') === 1)
    const cap = () => { if (cy.zoom() > 1.25) { cy.zoom(1.25); cy.center() } }
    if (onlyHubs) {
      cy.layout({ name: 'circle', radius: Math.min(cy.width(), cy.height()) * 0.3, startAngle: -Math.PI / 2, animate: true, animationDuration: 500, fit: false, stop: () => { cy.fit(undefined, 80); cap() } } as never).run()
      return
    }
    const layout = cy.layout({
      name: 'fcose',
      quality: n > 400 ? 'draft' : 'default',
      randomize: mode === 'universe',
      animate: n < 400,
      animationDuration: 600,
      nodeRepulsion: () => (mode === 'universe' ? 6500 : 9000),
      idealEdgeLength: () => (mode === 'universe' ? 55 : 85),
      nodeSeparation: 60,
      gravity: 0.25,
      numIter: n > 400 ? 1500 : 2500,
      packComponents: true,
      fit: true,
      padding: 40,
      stop: cap,
    } as never)
    layout.run()
  }, [elements]) // eslint-disable-line react-hooks/exhaustive-deps

  // selection highlight
  useEffect(() => {
    const cy = cyRef.current
    if (!cy) return
    cy.nodes().removeClass('sel')
    cy.edges().removeClass('esel')
    if (selected) cy.getElementById(selected).addClass('sel')
    if (edgeSel) cy.getElementById(`e:${edgeSel}`).addClass('esel')
  }, [selected, edgeSel, elements])

  const hits = useMemo(() => (q ? search(store.search, q, 8) : []), [q, store.search])
  const sel = selected ? byId.get(selected) : undefined
  const hubSel = selected ? HUB_BY_ID.get(selected) : undefined
  const edge = edgeSel ? store.edgeById.get(edgeSel) : undefined
  const hidden = sel ? neighboursOf(sel.id).filter((x) => !visible.has(x)).length : 0
  const toggleFam = (f: Family) => setFamilies((s) => { const n = new Set(s); n.has(f) ? n.delete(f) : n.add(f); return n })
  const toggleEv = (c: number) => setEvidence((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n })
  const nodeCount = elements.filter((e) => e.group === 'nodes').length
  const edgeCount = elements.filter((e) => e.group === 'edges' && !e.data.hubEdge).length

  return (
    <div className="relative" style={{ height: 'calc(100vh - 56px)' }}>
      <div ref={container} className="absolute inset-0" style={{ width: "100%", height: "100%" }} role="application" aria-label="Interactive knowledge graph. Use the side panel and search for keyboard access." />

      {/* top-left: search + mode */}
      <div className="absolute top-3 left-3 z-10 w-[min(360px,calc(100%-24px))] space-y-2">
        <div className="rounded-xl border border-night-rule bg-night-2/95 backdrop-blur p-2">
          <input className="field w-full" placeholder="Find and recentre: Krishna, कृष्ण, Brihadisvara…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a record in the graph" />
          {hits.length ? (
            <ul className="mt-1 max-h-64 overflow-auto scroll-thin">
              {hits.map((h) => { const n = byId.get(h.id)!; return (
                <li key={h.id}><button className="w-full text-left px-2 py-1.5 rounded hover:bg-night-3 flex items-center gap-2 text-sm" onClick={() => { recentre(h.id); setQ('') }}>
                  <Glyph family={n.family} size={11} dark /><span className="truncate">{n.name}</span><span className="ml-auto text-[11px] text-night-ink-2">{TYPE_LABEL[n.type]}</span>
                </button></li>) })}
            </ul>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button className="chip" aria-pressed={mode === 'clusters'} onClick={() => { setMode('clusters') }}><Layers size={12} /> Clusters</button>
          <button className="chip" aria-pressed={mode === 'universe'} onClick={() => setMode('universe')}><Orbit size={12} /> Whole universe</button>
          <button className="chip" onClick={() => { setMode('clusters'); setVisible(new Set(HUBS.map((h) => h.id))); setSelected(null); setEdgeSel(null) }}><RotateCcw size={12} /> Reset</button>
        </div>
        <div className="text-[11px] text-night-ink-2 pl-1">{nodeCount} records · {edgeCount} sourced connections shown. Click to select · double-click to recentre · click an edge for its evidence.</div>
      </div>

      {/* bottom-left: legend + filters */}
      <div className="absolute bottom-3 left-3 z-10 w-[min(360px,calc(100%-24px))] rounded-xl border border-night-rule bg-night-2/95 backdrop-blur p-3 text-[12px] max-h-[46vh] overflow-auto scroll-thin">
        <div className="eyebrow !text-night-ink-2 mb-2">Families (click to filter)</div>
        <div className="grid grid-cols-2 gap-1">
          {FAMILIES.map((f) => (
            <button key={f.id} onClick={() => toggleFam(f.id)} aria-pressed={families.has(f.id)} className={`flex items-center gap-2 rounded px-1.5 py-1 text-left ${families.has(f.id) ? '' : 'opacity-40'}`}>
              <Glyph family={f.id} size={11} dark /> {f.label}
            </button>
          ))}
        </div>
        <div className="eyebrow !text-night-ink-2 mt-3 mb-1.5">Evidence classes</div>
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 7].map((c) => (
            <button key={c} onClick={() => toggleEv(c)} aria-pressed={evidence.has(c)} className={evidence.has(c) ? '' : 'opacity-35'} title={EVIDENCE[c].label}><EvidenceBadge cls={c} /></button>
          ))}
        </div>
        <div className="text-[11px] text-night-ink-2 mt-1">Dashed edges are tradition (6) or disputed (7).</div>
        <label className="flex items-center gap-2 mt-3"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Only verified or source-checked edges</label>
        <div className="mt-3">
          <label className="flex items-center gap-2"><input type="checkbox" checked={yearCap !== null} onChange={(e) => setYearCap(e.target.checked ? 0 : null)} /> Documented by a year</label>
          {yearCap !== null ? (
            <div className="mt-1.5">
              <input type="range" min={-2600} max={2000} step={25} value={yearCap} onChange={(e) => setYearCap(+e.target.value)} className="w-full" aria-label="Year" />
              <div className="flex justify-between text-[11px] text-night-ink-2"><span>by <b className="text-night-ink">{yearLabel(yearCap)}</b></span><label className="flex items-center gap-1"><input type="checkbox" checked={includeUndated} onChange={(e) => setIncludeUndated(e.target.checked)} /> keep undated</label></div>
              <div className="text-[10.5px] text-night-ink-2 mt-1">Uses the earliest scholarly or material date attached to each record (or to the texts/objects it is attested in). Traditional chronology is excluded.</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* zoom */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1.5 lg:right-[404px]">
        <button className="btn !p-2" aria-label="Zoom in" onClick={() => cyRef.current?.zoom({ level: cyRef.current.zoom() * 1.3, renderedPosition: { x: container.current!.clientWidth / 2, y: container.current!.clientHeight / 2 } })}><Plus size={14} /></button>
        <button className="btn !p-2" aria-label="Zoom out" onClick={() => cyRef.current?.zoom({ level: cyRef.current.zoom() / 1.3, renderedPosition: { x: container.current!.clientWidth / 2, y: container.current!.clientHeight / 2 } })}><Minus size={14} /></button>
        <button className="btn !p-2" aria-label="Fit to screen" onClick={() => cyRef.current?.fit(undefined, 40)}><Maximize2 size={14} /></button>
      </div>

      {/* right panel */}
      {(sel || hubSel || edge) ? (
        <aside className="absolute z-20 top-3 right-3 bottom-3 w-[min(384px,calc(100%-24px))] rounded-xl border border-night-rule bg-night-2/97 backdrop-blur overflow-auto scroll-thin text-night-ink fade-in" aria-label="Selection details">
          <button className="absolute top-2 right-2 btn !p-1.5" aria-label="Close panel" onClick={() => { setSelected(null); setEdgeSel(null) }}><X size={13} /></button>
          {hubSel ? <HubPanel hub={hubSel} onExpand={() => expand(hubSel.id, true)} count={hubMembers(store, hubSel).length} /> : null}
          {sel ? <NodePanel n={sel} hidden={hidden} onExpand={(all) => expand(sel.id, all)} onRecentre={() => recentre(sel.id)} onEdge={(id) => { setEdgeSel(id) }} /> : null}
          {edge ? <EdgePanel e={edge} onPick={(id) => { setSelected(id); setEdgeSel(null) }} /> : null}
        </aside>
      ) : null}
    </div>
  )
}

function HubPanel({ hub, onExpand, count }: { hub: Hub; onExpand: () => void; count: number }) {
  return (
    <div className="p-5">
      <div className="eyebrow !text-[var(--gold-soft)]">Cluster</div>
      <div className="display text-3xl font-semibold mt-1">{hub.label}</div>
      <p className="text-sm text-night-ink-2 mt-2">{hub.blurb}. {count} records in this cluster; the first {Math.min(count, MAX_EXPAND)} were added to the canvas.</p>
      <button className="btn mt-4" onClick={onExpand}>Show all {count}</button>
      <p className="text-[12px] text-night-ink-2 mt-4">Clusters are navigation aids drawn by the explorer, not research records. Click any text inside to see its narratives, characters and sources.</p>
    </div>
  )
}

function NodePanel({ n, hidden, onExpand, onRecentre, onEdge }: { n: GNode; hidden: number; onExpand: (all: boolean) => void; onRecentre: () => void; onEdge: (id: string) => void }) {
  const store = useStore()
  const nb = store.neighbours(n.id)
  const groups = new Map<string, typeof nb>()
  for (const x of nb) {
    const label = x.dir === 'out' ? store.meta.predicates[x.edge.p] : `← ${store.meta.predicates[x.edge.p]}`
    ;(groups.get(label) ?? groups.set(label, []).get(label)!).push(x)
  }
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-[12px] text-night-ink-2"><Glyph family={n.family} size={12} dark /> {TYPE_LABEL[n.type]}{n.subtype ? ` · ${n.subtype}` : ''}</div>
      <div className="display text-[1.9rem] leading-tight font-semibold mt-1 pr-8">{n.name}</div>
      {n.devanagari || n.iast ? <div className="text-sm text-night-ink-2 mt-0.5">{n.iast && n.iast !== n.name ? <span className="italic mr-2">{n.iast}</span> : null}{n.devanagari ? <span className="deva">{n.devanagari}</span> : null}</div> : null}
      <p className="text-[13.5px] leading-relaxed mt-3" style={{ color: 'var(--night-ink)' }}>{n.summary}</p>
      {n.m.earliestText || n.m.earliestMaterial ? (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
          {n.m.earliestText ? <div className="rounded-lg bg-night-3 p-2"><div className="text-night-ink-2">Earliest dated text in graph</div><div className="font-semibold">{n.m.earliestText.label}</div><div className="truncate text-night-ink-2">{store.byId.get(n.m.earliestText.via)?.name}</div></div> : null}
          {n.m.earliestMaterial ? <div className="rounded-lg bg-night-3 p-2"><div className="text-night-ink-2">Earliest dated object/site</div><div className="font-semibold">{n.m.earliestMaterial.label}</div><div className="truncate text-night-ink-2">{store.byId.get(n.m.earliestMaterial.via)?.name}</div></div> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-1.5 mt-4">
        <a className="btn btn-primary !bg-[var(--gold-soft)] !border-[var(--gold-soft)] !text-[#12162b]" href={entityHref(n.id)}><ExternalLink size={13} /> Full profile</a>
        {hidden ? <button className="btn" onClick={() => onExpand(hidden <= MAX_EXPAND)}>Expand +{Math.min(hidden, MAX_EXPAND)}</button> : null}
        {hidden > MAX_EXPAND ? <button className="btn" onClick={() => onExpand(true)}>All {hidden}</button> : null}
        <button className="btn" onClick={onRecentre}>Recentre</button>
        {n.location ? <a className="btn" href={href('atlas', { focus: n.id })}><MapPin size={13} /> Map</a> : null}
        <a className="btn" href={href('time', { mode: ['character', 'deity', 'narrative'].includes(n.type) ? 'figure' : ['text', 'collection'].includes(n.type) ? 'literature' : 'material', subject: n.id })}><Clock size={13} /> Timeline</a>
      </div>
      <div className="mt-5 space-y-3">
        {[...groups.entries()].slice(0, 14).map(([label, xs]) => (
          <div key={label}>
            <div className="text-[11px] uppercase tracking-wider text-night-ink-2 mb-1">{label} <span className="opacity-60">({xs.length})</span></div>
            <ul className="space-y-0.5">
              {xs.slice(0, 8).map((x) => (
                <li key={x.edge.id} className="flex items-center gap-2 text-[13px]">
                  <Glyph family={x.other.family} size={9} dark />
                  <a className="hover:underline truncate" href={href('graph', { focus: x.other.id })} onClick={(e) => { e.preventDefault(); navigate('graph', { focus: x.other.id }) }}>{x.other.name}</a>
                  <button className="ml-auto shrink-0" onClick={() => onEdge(x.edge.id)} title="Show evidence for this connection"><EvidenceBadge cls={x.edge.evidenceClass} compact /></button>
                </li>
              ))}
              {xs.length > 8 ? <li className="text-[11px] text-night-ink-2">+{xs.length - 8} more on the full profile</li> : null}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

function EdgePanel({ e, onPick }: { e: GEdge; onPick: (id: string) => void }) {
  const store = useStore()
  const s = store.byId.get(e.s)!, o = store.byId.get(e.o)!
  return (
    <div className="p-5">
      <div className="eyebrow !text-[var(--gold-soft)]">Connection & its evidence</div>
      <div className="mt-2 text-[15px] leading-snug">
        <button className="font-semibold hover:underline" onClick={() => onPick(s.id)}>{s.name}</button>{' '}
        <span className="text-night-ink-2">{store.meta.predicates[e.p]}</span>{' '}
        <button className="font-semibold hover:underline" onClick={() => onPick(o.id)}>{o.name}</button>
      </div>
      {e.qualifiers ? (
        <div className="mt-2 text-[12px] text-night-ink-2 space-y-0.5">
          {e.qualifiers.text ? <div>According to: <b className="text-night-ink">{store.byId.get(e.qualifiers.text)?.name ?? e.qualifiers.text}</b></div> : null}
          {e.qualifiers.tradition ? <div>Within: <b className="text-night-ink">{store.byId.get(e.qualifiers.tradition)?.name ?? e.qualifiers.tradition}</b></div> : null}
          {e.qualifiers.role ? <div>Role: {e.qualifiers.role}</div> : null}
          {e.qualifiers.note ? <div>{e.qualifiers.note}</div> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 mt-3"><EvidenceBadge cls={e.evidenceClass} /><StatusBadge status={e.status} /><ConfidenceDots c={e.confidence} /></div>
      <div className="mt-1 text-[12px] text-night-ink-2">{EVIDENCE[e.evidenceClass]?.blurb}</div>
      {e.rationale ? <p className="mt-3 text-[13px]">{e.rationale}</p> : null}
      {e.competing ? <div className="mt-3 rounded-lg bg-night-3 p-2.5 text-[12.5px]"><div className="text-night-ink-2 text-[11px] uppercase tracking-wider mb-1">Competing interpretations</div>{e.competing}</div> : null}
      <div className="mt-4 text-[11px] uppercase tracking-wider text-night-ink-2 mb-1">Sources</div>
      <div className="[&_*]:!text-night-ink [&_.text-ink-3]:!text-night-ink-2"><SourceList refs={e.sources} /></div>
      <div className="mt-3 text-[11px] text-night-ink-2">Assertion {e.id} · researched by {store.meta.agents[e.agent] ?? e.agent}{e.lastVerified ? ` · checked ${e.lastVerified}` : ''}</div>
    </div>
  )
}
