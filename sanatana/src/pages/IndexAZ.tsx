import { useMemo, useState } from 'react'
import { useStore, type GNode } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { entityHref, navigate } from '../app/router.ts'
import { Glyph, StatusBadge, Empty } from '../components/ui.tsx'
import { FAMILIES, TYPE_LABEL } from '../lib/meta.ts'
import { fold } from '../lib/search.ts'

const PAGE = 150
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

/** The encyclopedia's A–Z index: every record, filterable by kind, tradition and letter. */
export function IndexAZ({ route }: { route: Route }) {
  const store = useStore()
  const [type, setType] = useState(route.query.get('type') ?? '')
  const [trad, setTrad] = useState('')
  const [letter, setLetter] = useState(route.query.get('letter') ?? '')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const initial = (n: GNode) => fold(n.name).charAt(0).toUpperCase()
  const traditions = useMemo(() => store.real.filter((n) => n.type === 'tradition').sort((a, b) => a.name.localeCompare(b.name)), [store])
  const types = useMemo(() => [...new Set(store.real.map((n) => n.type))].sort((a, b) => (TYPE_LABEL[a] ?? a).localeCompare(TYPE_LABEL[b] ?? b)), [store])
  const list = useMemo(() => {
    const fq = fold(q)
    return store.real
      .filter((n) => !type || n.type === type)
      .filter((n) => !trad || (n.traditions ?? []).includes(trad) || store.neighbours(n.id).some((x) => x.other.id === trad))
      .filter((n) => !letter || initial(n) === letter)
      .filter((n) => !fq || [n.name, n.iast, n.devanagari, ...(n.aliases ?? [])].some((s) => s && fold(s).includes(fq)))
      .sort((a, b) => fold(a.name).localeCompare(fold(b.name)))
  }, [store, type, trad, letter, q]) // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => { const m: Record<string, number> = {}; for (const n of store.real) m[initial(n)] = (m[initial(n)] ?? 0) + 1; return m }, [store]) // eslint-disable-line react-hooks/exhaustive-deps
  const shown = list.slice(page * PAGE, (page + 1) * PAGE)
  const pages = Math.ceil(list.length / PAGE)
  const reset = (f: () => void) => { f(); setPage(0) }
  const dateOf = (n: GNode) => {
    const d = (n.dates ?? []).filter((x) => x.system !== 'traditional' && typeof x.start === 'number').sort((a, b) => a.start! - b.start!)[0]
    return d?.label
  }
  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Index</div>
      <h1 className="display text-5xl font-semibold mt-1">Every record, A to Z</h1>
      <p className="text-ink-2 mt-3 max-w-2xl leading-relaxed">{store.real.length.toLocaleString()} records — texts, passages, figures, deities, narratives, places, temples, objects, inscriptions, manuscripts, people, traditions and debated claims. Filter by kind, tradition or initial, or search in any script.</p>
      <div className="mt-6 flex flex-wrap gap-2 items-center text-sm">
        <input className="field w-64" placeholder="Filter by name, any script" value={q} onChange={(e) => reset(() => setQ(e.target.value))} aria-label="Filter by name" />
        <label className="flex items-center gap-1.5">Kind <select className="field" value={type} onChange={(e) => reset(() => { setType(e.target.value); navigate('index', { type: e.target.value || undefined }, true) })}><option value="">all</option>{types.map((t) => <option key={t} value={t}>{TYPE_LABEL[t] ?? t} ({store.meta.stats.byType[t] ?? 0})</option>)}</select></label>
        <label className="flex items-center gap-1.5">Tradition <select className="field max-w-[220px]" value={trad} onChange={(e) => reset(() => setTrad(e.target.value))}><option value="">any</option>{traditions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <span className="ml-auto text-ink-3">{list.length.toLocaleString()} records</span>
      </div>
      <nav className="mt-4 flex flex-wrap gap-1" aria-label="Initial letter">
        <button className="chip" aria-pressed={!letter} onClick={() => reset(() => setLetter(''))}>All</button>
        {LETTERS.map((l) => <button key={l} className="chip !px-2 tabular-nums" aria-pressed={letter === l} disabled={!counts[l]} style={{ opacity: counts[l] ? 1 : 0.35 }} onClick={() => reset(() => setLetter(l))}>{l}</button>)}
      </nav>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-3">{FAMILIES.map((f) => <span key={f.id} className="inline-flex items-center gap-1.5"><Glyph family={f.id} size={10} />{f.label}</span>)}</div>
      {shown.length ? (
        <ul className="mt-5 card divide-y" style={{ borderColor: 'var(--rule)' }}>
          {shown.map((n) => (
            <li key={n.id} className="px-4 py-2.5 grid sm:grid-cols-[minmax(240px,1fr)_2fr_auto] gap-x-4 gap-y-0.5 items-baseline" style={{ borderColor: 'var(--rule)' }}>
              <a href={entityHref(n.id)} className="flex items-baseline gap-2 min-w-0 link"><span className="self-center"><Glyph family={n.family} size={10} /></span><span className="font-medium truncate">{n.name}</span>{n.devanagari ? <span className="deva text-ink-3 text-sm shrink-0">{n.devanagari}</span> : null}</a>
              <span className="text-[13px] text-ink-2 line-clamp-1 min-w-0">{TYPE_LABEL[n.type]}{n.subtype ? ` · ${n.subtype}` : ''} — {n.summary}</span>
              <span className="flex items-center gap-3 text-[11.5px] text-ink-3 justify-self-end whitespace-nowrap">{dateOf(n) ? <span>{dateOf(n)}</span> : null}<StatusBadge status={n.status} /></span>
            </li>
          ))}
        </ul>
      ) : <div className="mt-6"><Empty title="Nothing matches">Clear a filter, or try another spelling or script.</Empty></div>}
      {pages > 1 ? (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button className="btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-ink-3">Page {page + 1} of {pages}</span>
          <button className="btn" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      ) : null}
    </div>
  )
}
