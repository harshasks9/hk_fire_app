import { useMemo, useState } from 'react'
import { useStore } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { entityHref } from '../app/router.ts'
import { Glyph, Empty } from '../components/ui.tsx'
import { fold } from '../lib/search.ts'
import { TYPE_LABEL } from '../lib/meta.ts'

/** Screen 2 — the Character Explorer index. */
export function Characters({ route }: { route: Route }) {
  const store = useStore()
  const [kind, setKind] = useState<'all' | 'character' | 'deity'>((route.query.get('kind') as 'character') ?? 'all')
  const [text, setText] = useState(route.query.get('text') ?? '')
  const [trad, setTrad] = useState('')
  const [role, setRole] = useState('')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<'connections' | 'texts' | 'name' | 'earliest'>('connections')

  const figures = useMemo(() => store.real.filter((n) => n.type === 'character' || n.type === 'deity'), [store])
  const textsWithFigures = useMemo(() => {
    const ids = new Set<string>()
    for (const e of store.edges) if ((e.p === 'APPEARS_IN' || e.p === 'MENTIONED_IN' || e.p === 'TEACHES_IN') && store.byId.get(e.s) && ['character', 'deity'].includes(store.byId.get(e.s)!.type)) { const t = store.textOf(e.o); if (t) ids.add(t.id) }
    return [...ids].map((id) => store.byId.get(id)!).sort((a, b) => a.name.localeCompare(b.name))
  }, [store])
  const roles = useMemo(() => [...new Set(figures.flatMap((f) => f.roles ?? []))].sort(), [figures])
  const trads = useMemo(() => [...new Set(figures.flatMap((f) => f.traditions ?? []))].map((t) => store.byId.get(t)).filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name)), [figures, store])
  const inText = useMemo(() => {
    if (!text) return null
    const ids = new Set<string>()
    for (const e of store.edges) if (['APPEARS_IN', 'MENTIONED_IN', 'TEACHES_IN'].includes(e.p) && (e.o === text || store.textOf(e.o)?.id === text)) ids.add(e.s)
    return ids
  }, [text, store])

  const list = figures
    .filter((f) => kind === 'all' || f.type === kind)
    .filter((f) => !inText || inText.has(f.id))
    .filter((f) => !trad || (f.traditions ?? []).includes(trad))
    .filter((f) => !role || (f.roles ?? []).includes(role))
    .filter((f) => !q || [f.name, f.iast, f.devanagari, ...(f.aliases ?? [])].some((s) => s && fold(s).includes(fold(q))))
    .sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'texts' ? b.m.texts - a.m.texts : sort === 'earliest' ? (a.m.earliestText?.year ?? 9999) - (b.m.earliestText?.year ?? 9999) : b.m.degree - a.m.degree)

  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Character explorer</div>
      <h1 className="display text-5xl font-semibold mt-1">Characters & deities</h1>
      <p className="text-ink-2 mt-3 max-w-2xl leading-relaxed">Profiles grounded in passages. Each figure’s appearances are listed text by text, with locators; genealogies preserve every version a text gives; theological identifications are shown as assertions of a tradition, not merged identities.</p>
      <div className="mt-6 flex flex-wrap gap-2 items-center">
        {(['all', 'character', 'deity'] as const).map((k) => <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{k === 'all' ? 'All figures' : TYPE_LABEL[k] + 's'}</button>)}
        <input className="field ml-auto w-56" placeholder="Filter by name, any script" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter by name" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2 items-center text-sm">
        <label className="flex items-center gap-1.5">Appears in <select className="field max-w-[220px]" value={text} onChange={(e) => setText(e.target.value)}><option value="">any text</option>{textsWithFigures.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <label className="flex items-center gap-1.5">Tradition <select className="field max-w-[200px]" value={trad} onChange={(e) => setTrad(e.target.value)}><option value="">any</option>{trads.map((t) => <option key={t!.id} value={t!.id}>{t!.name}</option>)}</select></label>
        <label className="flex items-center gap-1.5">Role <select className="field" value={role} onChange={(e) => setRole(e.target.value)}><option value="">any</option>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
        <label className="flex items-center gap-1.5">Sort <select className="field" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}><option value="connections">most connected</option><option value="texts">most texts</option><option value="earliest">earliest attested</option><option value="name">name</option></select></label>
        <span className="text-ink-3 ml-auto">{list.length} figures</span>
      </div>
      {list.length ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((f) => (
            <a key={f.id} href={entityHref(f.id)} className="card p-4 hover:border-gold transition-colors group">
              <div className="flex items-start gap-2">
                <span className="mt-2"><Glyph family={f.family} size={11} /></span>
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap"><span className="display text-xl font-semibold group-hover:text-gold">{f.name}</span>{f.devanagari ? <span className="deva text-ink-3">{f.devanagari}</span> : null}</div>
                  <div className="text-[11.5px] text-ink-3">{TYPE_LABEL[f.type]}{f.roles?.length ? ` · ${f.roles.slice(0, 3).join(', ')}` : ''}</div>
                </div>
              </div>
              <p className="text-[13px] text-ink-2 mt-2 line-clamp-3 leading-relaxed">{f.summary}</p>
              <div className="mt-3 flex gap-4 text-[11.5px] text-ink-3">
                <span><b className="text-ink tabular-nums">{f.m.texts}</b> texts</span>
                <span><b className="text-ink tabular-nums">{f.m.degree}</b> connections</span>
                {f.m.earliestText ? <span>from <b className="text-ink">{f.m.earliestText.label}</b></span> : null}
              </div>
            </a>
          ))}
        </div>
      ) : <div className="mt-8"><Empty title="No figures match these filters">Clear a filter, or search in another script.</Empty></div>}
    </div>
  )
}
