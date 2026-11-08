/**
 * Compiles the research files in data/ into the graph the site loads, plus the
 * exports and the machine-generated audit.
 *
 *   public/data/graph.json        nodes, edges (assertions), sources, comparisons,
 *                                 discoveries, sacred chronology, metrics
 *   public/data/basemap.json      the South & Southeast Asia basemap (GeoJSON)
 *   exports/nodes.csv, edges.csv, sources.csv, neo4j-import.cypher, graph.json
 *   research/audit/validation-report.md
 *
 * Fails (exit 1) if validation reports errors, unless --allow-errors is passed —
 * so nothing unsound is ever published.
 */
import { mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { loadDataset, ROOT } from './lib/load.ts'
import { checkDataset } from './lib/check.ts'
import { PREDICATES, EVIDENCE_CLASSES, AGENTS } from '../schema/types.ts'
import type { Entity, Assertion, DateClaim } from '../schema/types.ts'
import { textFromLocator, NARRATIVE_ROLE_PREDICATES } from '../src/lib/locators.ts'

const require = createRequire(import.meta.url)
const Graph = require('graphology')
const betweenness = require('graphology-metrics/centrality/betweenness.js')
const louvain = require('graphology-communities-louvain')
const forceAtlas2 = require('graphology-layout-forceatlas2')
const topojson = require('topojson-client')

const allowErrors = process.argv.includes('--allow-errors')
const ds = loadDataset()
const { issues, entities, assertions, sources } = checkDataset(ds)
const errors = issues.filter((i) => i.severity === 'error')
const warns = issues.filter((i) => i.severity === 'warn')
if (errors.length && !allowErrors) {
  for (const e of errors.slice(0, 60)) console.error(`ERROR ${e.file.replace(/.*\/data\//, 'data/')} ${e.id} — ${e.message}`)
  console.error(`\n${errors.length} validation errors — fix them (npm run validate) or pass --allow-errors for a local preview.`)
  process.exit(1)
}

// Drop assertions whose endpoints are missing (only possible with --allow-errors).
const edges = assertions.filter((a) => entities.has(a.s) && entities.has(a.o))

// ───────────── families (the 8 colour/shape groups the UI uses) ─────────────
const FAMILY: Record<string, string> = {
  artifact: 'material', inscription: 'material', manuscript: 'material', site: 'material',
  deity: 'deity', concept: 'deity', tradition: 'deity',
  place: 'geography', temple: 'geography',
  collection: 'literature', text: 'literature', passage: 'literature',
  character: 'figure', lineage: 'figure',
  person: 'history', polity: 'history', institution: 'history',
  narrative: 'narrative',
  claim: 'claim',
}

// ───────────── corpus membership: which collection does each text belong to ─────────────
const partOf = new Map<string, string[]>()
for (const a of edges) if (a.p === 'PART_OF') (partOf.get(a.s) ?? partOf.set(a.s, []).get(a.s)!).push(a.o)
function collectionsOf(id: string, seen = new Set<string>()): Set<string> {
  const out = new Set<string>()
  if (seen.has(id)) return out
  seen.add(id)
  const e = entities.get(id)
  if (e?.type === 'collection') out.add(id)
  for (const parent of partOf.get(id) ?? []) for (const c of collectionsOf(parent, seen)) out.add(c)
  return out
}
function textOf(id: string, seen = new Set<string>()): string | undefined {
  const e = entities.get(id)
  if (!e || seen.has(id)) return undefined
  seen.add(id)
  if (e.type === 'text') return id
  for (const parent of partOf.get(id) ?? []) {
    const t = textOf(parent, seen)
    if (t) return t
  }
  return undefined
}

// ───────────── dates ─────────────
/** Earliest numeric date of a system — preferring claims that are not disputed, so a minority
 *  reading (Muṇḍeśvarī "108 CE", Doniger's Gudimallam) never places a record when a
 *  non-disputed date exists. */
function firstDate(e: Entity | undefined, system: DateClaim['system']): DateClaim | undefined {
  const ds = (e?.dates ?? []).filter((d) => d.system === system && typeof d.start === 'number')
  const firm = ds.filter((d) => d.certainty !== 'disputed')
  return (firm.length ? firm : ds).sort((a, b) => a.start! - b.start!)[0]
}
/** The most conservative recorded scholarly view of a text's date: the claim with the latest start.
 *  Using the earliest view would let a single minority estimate set a figure's "earliest attestation". */
function conservativeDate(e: Entity | undefined): DateClaim | undefined {
  const ds = (e?.dates ?? []).filter((d) => d.system === 'scholarly-textual' && typeof d.start === 'number')
  return ds.sort((a, b) => b.start! - a.start!)[0]
}
function effectiveTextDate(id: string): DateClaim | undefined {
  // a passage inherits the date of its text
  const e = entities.get(id)
  return conservativeDate(e) ?? (textOf(id) ? conservativeDate(entities.get(textOf(id)!)) : undefined)
}

// ───────────── per-node literary and material reach ─────────────
const TEXTUAL_P = new Set(['APPEARS_IN', 'MENTIONED_IN', 'NARRATED_IN', 'TEACHES_IN'])
const MATERIAL_P = new Set(['DEPICTED_IN', 'REFERS_TO', 'INTERPRETED_AS', 'WORSHIPPED_AT'])
interface Reach { texts: Set<string>; corpora: Set<string>; earliestText?: { year: number; label: string; via: string }; earliestMaterial?: { year: number; label: string; via: string; ec: number; disputed: boolean } }
const reach = new Map<string, Reach>()
const R = (id: string) => reach.get(id) ?? reach.set(id, { texts: new Set(), corpora: new Set() }).get(id)!
const FIGURE_TYPES = new Set(['character', 'deity', 'narrative', 'concept', 'lineage'])
/** textual attestations: direct (APPEARS_IN …) or derived from a class-1 role assertion's cited passage */
function textualHits(a: Assertion): { who: string; text: string; via: string }[] {
  if (TEXTUAL_P.has(a.p)) return [{ who: a.s, text: a.o, via: a.o }]
  if (a.evidenceClass === 1 && NARRATIVE_ROLE_PREDICATES.has(a.p)) {
    const t = textFromLocator(a.sources.find((r) => r.locator)?.locator)
    if (t && entities.has(t)) return [a.s, a.o].filter((x) => FIGURE_TYPES.has(entities.get(x)?.type ?? '')).map((who) => ({ who, text: t, via: t }))
  }
  return []
}
for (const a of edges) {
  for (const h of textualHits(a)) { const r = R(h.who); r.texts.add(textOf(h.via) ?? h.via); for (const c of collectionsOf(h.via)) r.corpora.add(c) }
}
for (const a of edges) {
  // disputed links never set an "earliest attestation"
  const weak = a.evidenceClass === 7 || a.status === 'disputed' || a.status === 'unresolved'
  if (!weak) for (const h of textualHits(a)) {
    const r = R(h.who)
    const t = textOf(h.via) ?? h.via
    const d = effectiveTextDate(h.via)
    if (d && (r.earliestText === undefined || d.start! < r.earliestText.year)) r.earliestText = { year: d.start!, label: d.label, via: t }
  }
  // material: subject is the figure/narrative; object is the artefact/temple — except REFERS_TO / INTERPRETED_AS, where the artefact is the subject
  let figure: string | undefined, object: string | undefined
  if (a.p === 'DEPICTED_IN' || a.p === 'WORSHIPPED_AT') { figure = a.s; object = a.o }
  if (a.p === 'REFERS_TO' || a.p === 'INTERPRETED_AS') { figure = a.o; object = a.s }
  if (figure && object && MATERIAL_P.has(a.p) && !weak) {
    const d = firstDate(entities.get(object), 'material')
    const r = R(figure)
    if (d && (r.earliestMaterial === undefined || d.start! < r.earliestMaterial.year)) r.earliestMaterial = { year: d.start!, label: d.label, via: object, ec: a.evidenceClass, disputed: d.certainty === 'disputed' }
  }
}
// text nodes reach their own corpora
for (const e of entities.values()) if (e.type === 'text' || e.type === 'passage') for (const c of collectionsOf(e.id)) R(e.id).corpora.add(c)

// ───────────── graph metrics ─────────────
const g = new Graph({ type: 'undirected', multi: false, allowSelfLoops: false })
for (const e of entities.values()) g.addNode(e.id)
for (const a of edges) if (!g.hasEdge(a.s, a.o)) g.addEdge(a.s, a.o)
const btw: Record<string, number> = g.order > 2 ? betweenness(g, { normalized: true }) : {}
let communities: Record<string, number> = {}
try { communities = g.size > 0 ? louvain(g, { randomWalk: false, rng: mulberry(7) }) : {} } catch { communities = {} }
function mulberry(a: number) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// ───────────── universe layout, computed once here so the browser never runs it ─────────────
// ForceAtlas2 on the full graph from seeded starting positions: deterministic across builds.
const layoutRng = mulberry(42)
const lg = new Graph({ type: 'undirected', multi: false, allowSelfLoops: false })
for (const e of entities.values()) if ((e as Entity).summary) lg.addNode(e.id, { x: layoutRng() * 1000, y: layoutRng() * 1000 })
for (const a of edges) if (lg.hasNode(a.s) && lg.hasNode(a.o) && !lg.hasEdge(a.s, a.o)) lg.addEdge(a.s, a.o)
forceAtlas2.assign(lg, { iterations: 900, settings: { ...forceAtlas2.inferSettings(lg), barnesHutOptimize: true, linLogMode: true, scalingRatio: 4, gravity: 1, strongGravityMode: true } })
// normalise: centre on the median, scale so 95% of records fall within a radius tied to the record
// count (keeps on-screen density readable), and pull far outliers (isolates) onto that rim
const xs: number[] = [], ys: number[] = []
lg.forEachNode((_: string, a: { x: number; y: number }) => { xs.push(a.x); ys.push(a.y) })
const med = (v: number[]) => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)]
const cx0 = med(xs), cy0 = med(ys)
const radii = xs.map((x, i) => Math.hypot(x - cx0, ys[i] - cy0)).sort((a, b) => a - b)
const r95 = radii[Math.floor(radii.length * 0.95)] || 1
const target = Math.sqrt(lg.order) * 14
const pos: Record<string, [number, number]> = {}
lg.forEachNode((id: string, a: { x: number; y: number }) => {
  let dx = ((a.x - cx0) / r95) * target, dy = ((a.y - cy0) / r95) * target
  const r = Math.hypot(dx, dy), cap = target * 1.15
  if (r > cap) { dx *= cap / r; dy *= cap / r }
  pos[id] = [Math.round(dx * 10) / 10, Math.round(dy * 10) / 10]
})

// ───────────── assemble nodes ─────────────
const nodes = [...entities.values()].map((e) => {
  const { _file, ...rest } = e as Entity & { _file: string }
  const r = reach.get(e.id)
  return {
    ...rest,
    family: FAMILY[e.type] ?? 'history',
    pos: pos[e.id],
    m: {
      degree: g.hasNode(e.id) ? g.degree(e.id) : 0,
      betweenness: +(btw[e.id] ?? 0).toFixed(5),
      community: communities[e.id] ?? -1,
      texts: r ? r.texts.size : 0,
      corpora: r ? [...r.corpora] : [],
      earliestText: r?.earliestText,
      earliestMaterial: r?.earliestMaterial,
    },
  }
})
const compactEdges = edges.map((a: Assertion & { _file?: string }) => {
  const { _file, ...rest } = a
  return rest
})

// ───────────── stats ─────────────
const count = <T,>(xs: T[], k: (x: T) => string | number | undefined) => xs.reduce<Record<string, number>>((acc, x) => { const key = String(k(x) ?? 'none'); acc[key] = (acc[key] ?? 0) + 1; return acc }, {})
const realNodes = nodes.filter((n) => n.summary)
const stats = {
  generated: new Date().toISOString(),
  nodes: realNodes.length,
  thinNodes: nodes.length - realNodes.length,
  edges: compactEdges.length,
  sources: sources.size,
  comparisons: ds.comparisons.reduce((n, f) => n + f.items.length, 0),
  discoveries: ds.discoveries.length,
  byType: count(realNodes, (n) => n.type),
  byFamily: count(realNodes, (n) => n.family),
  byEvidence: count(compactEdges, (a) => a.evidenceClass),
  byStatus: count(compactEdges, (a) => a.status),
  byConfidence: count(compactEdges, (a) => a.confidence),
  byAgent: count(compactEdges, (a) => a.agent),
  byPredicate: count(compactEdges, (a) => a.p),
  entityStatus: count(realNodes, (n) => n.status),
  verifiedEdges: compactEdges.filter((a) => a.status === 'verified-online' || a.status === 'source-checked').length,
  dated: realNodes.filter((n) => (n.dates ?? []).length).length,
  located: realNodes.filter((n) => n.location).length,
  imaged: realNodes.filter((n) => n.image).length,
  validation: { errors: errors.length, warnings: warns.length },
}

const graph = {
  meta: { title: 'SANATANA — The Living Knowledge Graph', stats, predicates: PREDICATES, evidenceClasses: EVIDENCE_CLASSES, agents: AGENTS },
  nodes,
  edges: compactEdges,
  sources: [...sources.values()],
  comparisons: ds.comparisons.flatMap((f) => f.items),
  discoveries: ds.discoveries,
  sacred: ds.sacred,
}

mkdirSync(join(ROOT, 'public', 'data'), { recursive: true })
writeFileSync(join(ROOT, 'public', 'data', 'graph.json'), JSON.stringify(graph))

// ───────────── basemap: countries in the study region, as GeoJSON ─────────────
const world = JSON.parse(readFileSync(join(ROOT, 'node_modules', 'world-atlas', 'countries-50m.json'), 'utf8'))
const fc = topojson.feature(world, world.objects.countries)
const BBOX = { minLon: 55, maxLon: 125, minLat: -11, maxLat: 45 }
const inRegion = (f: any) => {
  let hit = false
  const walk = (c: any) => { if (hit) return; if (typeof c[0] === 'number') { if (c[0] >= BBOX.minLon && c[0] <= BBOX.maxLon && c[1] >= BBOX.minLat && c[1] <= BBOX.maxLat) hit = true } else c.forEach(walk) }
  walk(f.geometry?.coordinates ?? [])
  return hit
}
const round = (c: any): any => (typeof c[0] === 'number' ? [+c[0].toFixed(2), +c[1].toFixed(2)] : c.map(round))
const basemap = { type: 'FeatureCollection', features: fc.features.filter(inRegion).map((f: any) => ({ type: 'Feature', id: f.id, properties: { name: f.properties.name }, geometry: { type: f.geometry.type, coordinates: round(f.geometry.coordinates) } })) }
writeFileSync(join(ROOT, 'public', 'data', 'basemap.json'), JSON.stringify(basemap))

// ───────────── exports (CSV + Neo4j) ─────────────
const EXP = join(ROOT, 'exports')
mkdirSync(EXP, { recursive: true })
const csv = (v: unknown) => { const s = v === undefined || v === null ? '' : typeof v === 'string' ? v : JSON.stringify(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const row = (xs: unknown[]) => xs.map(csv).join(',')
writeFileSync(join(EXP, 'nodes.csv'), [row(['id:ID', 'type:LABEL', 'name', 'iast', 'devanagari', 'aliases', 'subtype', 'summary', 'lat', 'lon', 'earliest_textual', 'earliest_material', 'confidence', 'status', 'agent']),
  ...realNodes.map((n) => row([n.id, n.type, n.name, n.iast, n.devanagari, (n.aliases ?? []).join('|'), n.subtype, n.summary, n.location?.lat, n.location?.lon, n.m.earliestText?.label, n.m.earliestMaterial?.label, n.confidence, n.status, n.agent]))].join('\n') + '\n')
writeFileSync(join(EXP, 'edges.csv'), [row([':START_ID', ':TYPE', ':END_ID', 'id', 'evidence_class:int', 'confidence', 'status', 'tradition', 'according_to_text', 'role', 'sources', 'competing', 'agent']),
  ...compactEdges.map((a) => row([a.s, a.p, a.o, a.id, a.evidenceClass, a.confidence, a.status, a.qualifiers?.tradition, a.qualifiers?.text, a.qualifiers?.role, a.sources.map((r) => `${r.source}${r.locator ? ` @ ${r.locator}` : ''}`).join('; '), a.competing, a.agent]))].join('\n') + '\n')
writeFileSync(join(EXP, 'sources.csv'), [row(['id', 'type', 'title', 'author', 'year', 'publisher', 'url']), ...[...sources.values()].map((s) => row([s.id, s.type, s.title, s.author, s.year, s.publisher, s.url]))].join('\n') + '\n')
writeFileSync(join(EXP, 'neo4j-import.cypher'), `// Load with: neo4j-admin database import full --nodes=nodes.csv --relationships=edges.csv sanatana
// or, from Neo4j Browser after placing the CSVs in the import directory:
LOAD CSV WITH HEADERS FROM 'file:///nodes.csv' AS r
CALL apoc.create.node([r['type:LABEL']], {id: r['id:ID'], name: r.name, iast: r.iast, devanagari: r.devanagari, summary: r.summary, confidence: r.confidence, status: r.status}) YIELD node RETURN count(node);
CREATE INDEX entity_id IF NOT EXISTS FOR (n:Entity) ON (n.id);
LOAD CSV WITH HEADERS FROM 'file:///edges.csv' AS r
MATCH (a {id: r[':START_ID']}), (b {id: r[':END_ID']})
CALL apoc.create.relationship(a, r[':TYPE'], {id: r.id, evidence_class: toInteger(r['evidence_class:int']), confidence: r.confidence, status: r.status, tradition: r.tradition, according_to_text: r.according_to_text, sources: r.sources}, b) YIELD rel RETURN count(rel);
`)
copyFileSync(join(ROOT, 'public', 'data', 'graph.json'), join(EXP, 'graph.json'))
for (const f of ['nodes.csv', 'edges.csv', 'sources.csv', 'neo4j-import.cypher']) copyFileSync(join(EXP, f), join(ROOT, 'public', 'data', f))

// ───────────── machine audit ─────────────
mkdirSync(join(ROOT, 'research', 'audit'), { recursive: true })
const pct = (n: number, d: number) => (d ? `${((100 * n) / d).toFixed(1)}%` : '—')
const table = (obj: Record<string, number>, label: (k: string) => string = (k) => k) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| ${label(k)} | ${v} |`).join('\n')
const topBy = (key: (n: (typeof nodes)[number]) => number, n = 15) => [...realNodes].sort((a, b) => key(b) - key(a)).slice(0, n)
const warnTypes = count(warns, (w) => w.message.replace(/"[^"]*"/g, '…').replace(/\d+/g, 'n').slice(0, 80))
writeFileSync(join(ROOT, 'research', 'audit', 'validation-report.md'), `# Machine audit — generated by \`npm run graph\`

Generated ${stats.generated}. This file is rewritten on every build; the editorial audit is in
\`research/research-audit.md\`.

## Totals

| Measure | Value |
|---|---|
| Entities with full records | ${stats.nodes} |
| Registry identities still without a full record | ${stats.thinNodes} |
| Assertions (edges) | ${stats.edges} |
| Sources in the bibliography | ${stats.sources} |
| Comparison tables | ${stats.comparisons} |
| Entities with dates | ${stats.dated} (${pct(stats.dated, stats.nodes)}) |
| Entities with coordinates | ${stats.located} |
| Entities with a licensed image | ${stats.imaged} |
| Assertions verified online or source-checked | ${stats.verifiedEdges} (${pct(stats.verifiedEdges, stats.edges)}) |
| Validation errors | ${errors.length} |
| Validation warnings | ${warns.length} |

## Entities by type
| Type | Count |
|---|---|
${table(stats.byType)}

## Assertions by evidence class
| Class | Count |
|---|---|
${table(stats.byEvidence, (k) => `${k} — ${(EVIDENCE_CLASSES as Record<string, string>)[k] ?? k}`)}

## Assertions by verification status
| Status | Count |
|---|---|
${table(stats.byStatus)}

## Assertions by confidence
| Confidence | Count |
|---|---|
${table(stats.byConfidence)}

## Assertions by research agent
| Agent | Count |
|---|---|
${table(stats.byAgent, (k) => (AGENTS as Record<string, string>)[k] ?? k)}

## Assertions by predicate
| Predicate | Count |
|---|---|
${table(stats.byPredicate)}

## Most connected entities (degree)
| Entity | Degree | Betweenness |
|---|---|---|
${topBy((n) => n.m.degree).map((n) => `| ${n.name} (\`${n.id}\`) | ${n.m.degree} | ${n.m.betweenness} |`).join('\n')}

## Highest betweenness (bridges between parts of the graph)
| Entity | Betweenness | Degree |
|---|---|---|
${topBy((n) => n.m.betweenness).map((n) => `| ${n.name} (\`${n.id}\`) | ${n.m.betweenness} | ${n.m.degree} |`).join('\n')}

## Figures appearing in the most distinct texts
| Entity | Texts | Corpora |
|---|---|---|
${topBy((n) => (['character', 'deity'].includes(n.type) ? n.m.texts : -1)).map((n) => `| ${n.name} | ${n.m.texts} | ${n.m.corpora.length} |`).join('\n')}

## Warning categories
| Warning | Count |
|---|---|
${table(warnTypes)}

## Method notes
- Degree and betweenness are computed on the undirected simple graph of all assertions
  (one edge per connected pair). Betweenness is normalised. Communities are Louvain.
- These metrics measure *how this dataset is connected*, which reflects research coverage as
  much as anything in the tradition. They are never evidence of religious importance or
  historical truth.
`)

console.log(`graph: ${stats.nodes} nodes (+${stats.thinNodes} thin) · ${stats.edges} edges · ${stats.sources} sources · ${errors.length} errors · ${warns.length} warnings`)
