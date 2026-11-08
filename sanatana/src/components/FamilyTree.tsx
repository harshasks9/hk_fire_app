/**
 * Genealogy view for one figure: grandparents, parents, the figure with spouses and
 * siblings, and children. Each tie shows the text that asserts it and its kind
 * (divine father, legal father, foster parent) — where texts disagree, both appear.
 * Click any person to walk the genealogy from there.
 */
import { useStore, type GEdge, type GNode } from '../data/store.tsx'
import { entityHref } from '../app/router.ts'
import { EvidenceBadge, Glyph } from './ui.tsx'

interface Tie { node: GNode; edge?: GEdge; note?: string }

export function kinOf(store: ReturnType<typeof useStore>, id: string) {
  const parents: Tie[] = [], children: Tie[] = [], spouses: Tie[] = [], siblings: Tie[] = []
  for (const x of store.neighbours(id)) {
    const p = x.edge.p
    if ((p === 'PARENT_OF' || p === 'ADOPTIVE_PARENT_OF') && x.dir === 'in') parents.push({ node: x.other, edge: x.edge, note: p === 'ADOPTIVE_PARENT_OF' ? 'adoptive / foster' : x.edge.qualifiers?.role })
    if ((p === 'PARENT_OF' || p === 'ADOPTIVE_PARENT_OF') && x.dir === 'out') children.push({ node: x.other, edge: x.edge, note: p === 'ADOPTIVE_PARENT_OF' ? 'adopted / fostered' : x.edge.qualifiers?.role })
    if (p === 'SPOUSE_OF') spouses.push({ node: x.other, edge: x.edge })
    if (p === 'SIBLING_OF') siblings.push({ node: x.other, edge: x.edge })
  }
  const sibIds = new Set(siblings.map((s) => s.node.id))
  for (const par of parents) {
    for (const x of store.neighbours(par.node.id)) {
      if (x.edge.p === 'PARENT_OF' && x.dir === 'out' && x.other.id !== id && !sibIds.has(x.other.id)) {
        sibIds.add(x.other.id)
        siblings.push({ node: x.other, note: `child of ${par.node.name}` })
      }
    }
  }
  const grand: Tie[] = []
  const gIds = new Set<string>()
  for (const par of parents) for (const x of store.neighbours(par.node.id)) if ((x.edge.p === 'PARENT_OF' || x.edge.p === 'ADOPTIVE_PARENT_OF') && x.dir === 'in' && !gIds.has(x.other.id)) { gIds.add(x.other.id); grand.push({ node: x.other, edge: x.edge, note: `parent of ${par.node.name}` }) }
  const dedupe = (xs: Tie[]) => { const m = new Map<string, Tie>(); for (const t of xs) { const k = t.node.id + (t.note ?? ''); if (!m.has(k)) m.set(k, t) } return [...m.values()] }
  return { parents: dedupe(parents), children: dedupe(children), spouses: dedupe(spouses), siblings: dedupe(siblings), grand }
}

function Person({ t, self = false }: { t: Tie; self?: boolean }) {
  const { byId } = useStore()
  const according = t.edge?.qualifiers?.text ? byId.get(t.edge.qualifiers.text)?.name : undefined
  return (
    <a href={entityHref(t.node.id)} className={`block rounded-lg border px-3 py-2 min-w-[150px] max-w-[220px] transition-colors hover:border-gold ${self ? 'bg-accent-bg border-gold' : 'bg-panel hairline'}`}>
      <div className="flex items-center gap-1.5 text-sm font-semibold"><Glyph family={t.node.family} size={10} />{t.node.name.replace(/\s*\((.*)\)$/, '')}</div>
      {t.note ? <div className="text-[11px] text-ink-3 mt-0.5">{t.note}</div> : null}
      {according ? <div className="text-[11px] text-ink-3">per {according}</div> : null}
      {t.edge ? <div className="mt-1"><EvidenceBadge cls={t.edge.evidenceClass} compact /></div> : null}
    </a>
  )
}

function Tier({ label, ties }: { label: string; ties: Tie[] }) {
  if (!ties.length) return null
  return (
    <div>
      <div className="eyebrow mb-2">{label}</div>
      <div className="flex flex-wrap gap-2">{ties.map((t) => <Person key={t.node.id + (t.note ?? '')} t={t} />)}</div>
    </div>
  )
}

export function FamilyTree({ id }: { id: string }) {
  const store = useStore()
  const n = store.byId.get(id)!
  const k = kinOf(store, id)
  const any = k.parents.length + k.children.length + k.spouses.length + k.siblings.length
  if (!any) return null
  return (
    <div className="space-y-5">
      <Tier label="Grandparents" ties={k.grand} />
      <Tier label="Parents" ties={k.parents} />
      <div>
        <div className="eyebrow mb-2">{n.name.replace(/\s*\((.*)\)$/, '')}, spouses & siblings</div>
        <div className="flex flex-wrap gap-2 items-stretch">
          <Person t={{ node: n }} self />
          {k.spouses.map((t) => <Person key={'s' + t.node.id} t={{ ...t, note: t.note ?? 'spouse' }} />)}
          {k.siblings.map((t) => <Person key={'b' + t.node.id + (t.note ?? '')} t={{ ...t, note: t.note ?? 'sibling' }} />)}
        </div>
      </div>
      <Tier label="Children" ties={k.children} />
      <p className="text-[12px] text-ink-3">Each tie is a separate assertion; where texts give different parentage, every version is shown with the text that states it. Divine paternity is labelled as such.</p>
    </div>
  )
}
