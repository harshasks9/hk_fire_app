/**
 * The client-side graph: one fetch of public/data/graph.json, then indexes built
 * once — by id, adjacency in both directions, comparisons by subject and text,
 * sources by id, and the multi-script search index.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Assertion, Comparison, DateClaim, Discovery, Entity, SacredEra, Source } from '../../schema/types.ts'
import { buildSearchIndex, type SearchIndex } from '../lib/search.ts'

export type Family = 'material' | 'deity' | 'geography' | 'literature' | 'figure' | 'history' | 'narrative' | 'claim'

export interface GNode extends Entity {
  family: Family
  m: {
    degree: number
    betweenness: number
    community: number
    texts: number
    corpora: string[]
    earliestText?: { year: number; label: string; via: string }
    earliestMaterial?: { year: number; label: string; via: string }
  }
}
export type GEdge = Assertion

export interface Stats {
  generated: string
  nodes: number
  thinNodes: number
  edges: number
  sources: number
  comparisons: number
  discoveries: number
  byType: Record<string, number>
  byFamily: Record<string, number>
  byEvidence: Record<string, number>
  byStatus: Record<string, number>
  byConfidence: Record<string, number>
  byAgent: Record<string, number>
  byPredicate: Record<string, number>
  entityStatus: Record<string, number>
  verifiedEdges: number
  dated: number
  located: number
  imaged: number
  validation: { errors: number; warnings: number }
}

export interface GraphData {
  meta: { title: string; stats: Stats; predicates: Record<string, string>; evidenceClasses: Record<string, string>; agents: Record<string, string> }
  nodes: GNode[]
  edges: GEdge[]
  sources: Source[]
  comparisons: Comparison[]
  discoveries: Discovery[]
  sacred: SacredEra[]
}

export interface Store extends GraphData {
  byId: Map<string, GNode>
  out: Map<string, GEdge[]>
  inc: Map<string, GEdge[]>
  sourceById: Map<string, Source>
  edgeById: Map<string, GEdge>
  comparisonsFor: (id: string) => Comparison[]
  neighbours: (id: string) => { edge: GEdge; other: GNode; dir: 'out' | 'in' }[]
  search: SearchIndex
  /** first numeric date of a system on an entity, or on its parent text for passages */
  dateOf: (id: string, system?: DateClaim['system']) => DateClaim | undefined
  /** parent text of a passage (via PART_OF) */
  textOf: (id: string) => GNode | undefined
  real: GNode[]
}

const Ctx = createContext<Store | null>(null)

function index(data: GraphData): Store {
  const byId = new Map(data.nodes.map((n) => [n.id, n]))
  const out = new Map<string, GEdge[]>()
  const inc = new Map<string, GEdge[]>()
  for (const e of data.edges) {
    ;(out.get(e.s) ?? out.set(e.s, []).get(e.s)!).push(e)
    ;(inc.get(e.o) ?? inc.set(e.o, []).get(e.o)!).push(e)
  }
  const sourceById = new Map(data.sources.map((s) => [s.id, s]))
  const edgeById = new Map(data.edges.map((e) => [e.id, e]))
  const cmpBy = new Map<string, Comparison[]>()
  for (const c of data.comparisons) {
    const keys = new Set([c.subject, ...c.rows.map((r) => r.text)])
    for (const k of keys) (cmpBy.get(k) ?? cmpBy.set(k, []).get(k)!).push(c)
  }
  const textOf = (id: string, seen = new Set<string>()): GNode | undefined => {
    const n = byId.get(id)
    if (!n || seen.has(id)) return undefined
    seen.add(id)
    if (n.type === 'text') return n
    for (const e of out.get(id) ?? []) if (e.p === 'PART_OF') { const t = textOf(e.o, seen); if (t) return t }
    return undefined
  }
  const dateOf = (id: string, system: DateClaim['system'] = 'scholarly-textual') => {
    const pick = (n?: GNode) => (n?.dates ?? []).filter((d) => d.system === system && typeof d.start === 'number').sort((a, b) => a.start! - b.start!)[0]
    const n = byId.get(id)
    return pick(n) ?? (n?.type === 'passage' ? pick(textOf(id)) : undefined)
  }
  return {
    ...data,
    byId,
    out,
    inc,
    sourceById,
    edgeById,
    comparisonsFor: (id) => cmpBy.get(id) ?? [],
    neighbours: (id) => [
      ...(out.get(id) ?? []).filter((e) => byId.has(e.o)).map((edge) => ({ edge, other: byId.get(edge.o)!, dir: 'out' as const })),
      ...(inc.get(id) ?? []).filter((e) => byId.has(e.s)).map((edge) => ({ edge, other: byId.get(edge.s)!, dir: 'in' as const })),
    ],
    search: buildSearchIndex(data.nodes.filter((n) => n.summary)),
    dateOf,
    textOf: (id) => textOf(id),
    real: data.nodes.filter((n) => n.summary),
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/graph.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`graph.json: HTTP ${r.status}`)
        return r.json()
      })
      .then((d: GraphData) => setStore(index(d)))
      .catch((e) => setError(String(e)))
  }, [])
  if (error)
    return (
      <div className="min-h-screen grid place-items-center p-8 text-center">
        <div>
          <p className="display text-3xl mb-2">The graph could not be loaded</p>
          <p className="text-ink-3 text-sm">{error}. Run <code>npm run graph</code> to compile the data.</p>
        </div>
      </div>
    )
  if (!store)
    return (
      <div className="min-h-screen grid place-items-center bg-night text-night-ink">
        <div className="text-center">
          <div className="display text-3xl tracking-wide">Sanatana</div>
          <div className="eyebrow mt-2" style={{ color: 'var(--night-ink-2)' }}>Loading the knowledge graph…</div>
        </div>
      </div>
    )
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore outside DataProvider')
  return s
}
