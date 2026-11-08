import { useMemo, useState } from 'react'
import { useStore, type GNode } from '../data/store.tsx'
import { entityHref } from '../app/router.ts'
import { EntityLink, Glyph } from '../components/ui.tsx'
import { fold } from '../lib/search.ts'

/** Screen 3 — the Narrative Explorer index: every story, the texts that tell it and where it is depicted. */
export function Narratives() {
  const store = useStore()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'texts' | 'depictions' | 'name'>('texts')
  const rows = useMemo(() => store.real.filter((n) => n.type === 'narrative').map((n) => {
    const nb = store.neighbours(n.id)
    const texts = new Set(nb.filter((x) => x.dir === 'out' && (x.edge.p === 'NARRATED_IN' || x.edge.p === 'MENTIONED_IN')).map((x) => (store.textOf(x.other.id) ?? x.other).id))
    const uniq = (xs: GNode[]) => [...new Map(xs.map((x) => [x.id, x])).values()]
    const depictions = uniq(nb.filter((x) => x.edge.p === 'DEPICTED_IN').map((x) => x.other))
    const people = uniq(nb.filter((x) => x.edge.p === 'PARTICIPANT_IN').map((x) => x.other))
    const places = uniq(nb.filter((x) => x.edge.p === 'OCCURS_AT').map((x) => x.other))
    const derived = uniq(nb.filter((x) => x.edge.p === 'DERIVED_FROM' && x.dir === 'out').map((x) => x.other))
    return { n, texts: [...texts], depictions, people, places, derived, cmp: store.comparisonsFor(n.id).length }
  }), [store])
  const list = rows
    .filter((r) => !q || fold(r.n.name).includes(fold(q)) || r.people.some((p) => fold(p.name).includes(fold(q))))
    .sort((a, b) => (sort === 'name' ? a.n.name.localeCompare(b.n.name) : sort === 'depictions' ? b.depictions.length - a.depictions.length : b.texts.length - a.texts.length))
  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Narrative explorer</div>
      <h1 className="display text-5xl font-semibold mt-1">Stories and their tellings</h1>
      <p className="text-ink-2 mt-3 max-w-2xl leading-relaxed">Each narrative lists the texts that tell it — kept as separate versions — the figures who take part, where it is set, and the dated temples and objects that depict it. A depiction shows that the story was known and valued where and when the object was made; it is not evidence that the events occurred.</p>
      <div className="mt-6 flex flex-wrap gap-2 items-center">
        <input className="field w-64" placeholder="Filter by story or participant" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter narratives" />
        <label className="text-sm flex items-center gap-1.5 ml-auto">Sort <select className="field" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="texts">most tellings</option><option value="depictions">most depictions</option><option value="name">name</option></select></label>
        <span className="text-sm text-ink-3">{list.length} narratives</span>
      </div>
      <div className="mt-6 overflow-x-auto card">
        <table className="data">
          <thead><tr><th>Narrative</th><th>Told in</th><th>Participants</th><th>Depicted in</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.n.id}>
                <td className="min-w-[220px]">
                  <a href={entityHref(r.n.id)} className="display text-lg font-semibold link">{r.n.name}</a>
                  <div className="text-[12px] text-ink-3 mt-0.5 line-clamp-2">{r.n.summary}</div>
                  {r.derived.length ? <div className="text-[11.5px] text-ink-3 mt-1">Develops from: {r.derived.map((d, i) => <span key={d.id}>{i ? ', ' : ''}<EntityLink id={d.id} showGlyph={false} /></span>)}</div> : null}
                  {r.cmp ? <div className="text-[11.5px] mt-1" style={{ color: 'var(--gold)' }}>{r.cmp} version comparison{r.cmp > 1 ? 's' : ''}</div> : null}
                </td>
                <td className="min-w-[180px]">{r.texts.slice(0, 6).map((t) => <div key={t}><EntityLink id={t} showGlyph={false} /></div>)}{r.texts.length > 6 ? <div className="text-xs text-ink-3">+{r.texts.length - 6}</div> : null}</td>
                <td className="min-w-[160px]">{r.people.slice(0, 6).map((p) => <span key={p.id} className="inline-flex items-center gap-1 mr-2"><Glyph family={p.family} size={8} /><a className="link" href={entityHref(p.id)}>{p.name.replace(/\s*\((.*)\)$/, '')}</a></span>)}{r.people.length > 6 ? <span className="text-xs text-ink-3">+{r.people.length - 6}</span> : null}</td>
                <td className="min-w-[160px]">{r.depictions.slice(0, 4).map((d) => <div key={d.id}><EntityLink id={d.id} showGlyph={false} /></div>)}{r.depictions.length > 4 ? <div className="text-xs text-ink-3">+{r.depictions.length - 4}</div> : null}{!r.depictions.length ? <span className="text-ink-3 text-xs">none recorded yet</span> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
