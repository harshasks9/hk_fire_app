/**
 * Screen 4 — the Temple & Artifact Explorer: a geographic atlas of temples, sites,
 * findspots and narrative places, filterable by deity, text, character, region,
 * period, architecture, artifact type and evidence class, and bidirectionally
 * linked to the graph (?focus=id in, "Open in graph" out).
 */
import { useMemo, useState, useEffect } from 'react'
import { Network, ExternalLink, Clock, X } from 'lucide-react'
import { useStore, type GNode, type Store } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { href, entityHref, navigate } from '../app/router.ts'
import { MapView, type MapPoint } from '../components/MapView.tsx'
import { Glyph, EvidenceBadge } from '../components/ui.tsx'
import { TYPE_LABEL, materialDate, yearLabel, EVIDENCE } from '../lib/meta.ts'

const LAYERS = [
  { id: 'temple', label: 'Temples' },
  { id: 'site', label: 'Archaeological sites' },
  { id: 'object', label: 'Artifacts, inscriptions, manuscripts (findspots)' },
  { id: 'place', label: 'Narrative & sacred places' },
] as const
type Layer = (typeof LAYERS)[number]['id']
const layerOf = (n: GNode): Layer | null => (n.type === 'temple' ? 'temple' : n.type === 'site' ? 'site' : ['artifact', 'inscription', 'manuscript'].includes(n.type) ? 'object' : n.type === 'place' ? 'place' : null)

/** located records reachable from `id` within two hops (through narratives / characters / texts). */
function reachLocated(store: Store, id: string, allowed: Set<number>): Set<string> {
  const out = new Set<string>()
  const seen = new Set([id])
  let frontier = [id]
  for (let hop = 0; hop < 2; hop++) {
    const next: string[] = []
    for (const f of frontier) {
      for (const x of store.neighbours(f)) {
        if (!allowed.has(x.edge.evidenceClass)) continue
        if (seen.has(x.other.id)) continue
        seen.add(x.other.id)
        if (x.other.location) out.add(x.other.id)
        if (hop === 0 && ['narrative', 'character', 'deity', 'passage', 'text'].includes(x.other.type)) next.push(x.other.id)
      }
    }
    frontier = next
  }
  return out
}

export default function Atlas({ route }: { route: Route }) {
  const store = useStore()
  const located = useMemo(() => store.real.filter((n) => n.location && layerOf(n)), [store])
  const [layers, setLayers] = useState<Set<Layer>>(new Set(['temple', 'site', 'object', 'place']))
  const [deity, setDeity] = useState('')
  const [text, setText] = useState('')
  const [character, setCharacter] = useState('')
  const [country, setCountry] = useState('')
  const [arch, setArch] = useState('')
  const [atype, setAtype] = useState('')
  const [period, setPeriod] = useState<[number, number]>([-2600, 2026])
  const [undated, setUndated] = useState(true)
  const [ev, setEv] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7]))
  const [selected, setSelected] = useState<string | null>(route.query.get('focus'))
  useEffect(() => { const f = route.query.get('focus'); if (f) setSelected(f) }, [route.query])

  const deities = useMemo(() => {
    const ids = new Set<string>()
    for (const e of store.edges) if ((e.p === 'WORSHIPPED_AT' || e.p === 'DEPICTED_IN' || e.p === 'REFERS_TO' || e.p === 'INTERPRETED_AS')) { const a = store.byId.get(e.s), b = store.byId.get(e.o); for (const x of [a, b]) if (x?.type === 'deity') ids.add(x.id) }
    return [...ids].map((i) => store.byId.get(i)!).sort((a, b) => a.name.localeCompare(b.name))
  }, [store])
  const characters = useMemo(() => store.real.filter((n) => n.type === 'character' && store.neighbours(n.id).some((x) => x.other.location)).sort((a, b) => b.m.degree - a.m.degree).slice(0, 120).sort((a, b) => a.name.localeCompare(b.name)), [store])
  const texts = useMemo(() => store.real.filter((n) => n.type === 'text').sort((a, b) => b.m.degree - a.m.degree).slice(0, 80).sort((a, b) => a.name.localeCompare(b.name)), [store])
  const countries = useMemo(() => [...new Set(located.map((n) => n.location!.country))].sort(), [located])
  const archs = useMemo(() => [...new Set(located.map((n) => n.attributes?.architecture).filter((x): x is string => typeof x === 'string'))].sort(), [located])
  const atypes = useMemo(() => [...new Set(located.filter((n) => ['artifact', 'inscription', 'manuscript'].includes(n.type)).map((n) => n.subtype ?? TYPE_LABEL[n.type]))].sort(), [located])

  const subjectSet = useMemo(() => {
    const sets = [deity, text, character].filter(Boolean).map((id) => reachLocated(store, id, ev))
    if (!sets.length) return null
    return sets.reduce((a, b) => new Set([...a].filter((x) => b.has(x))))
  }, [deity, text, character, ev, store])

  const visible = located.filter((n) => {
    const L = layerOf(n)!
    if (!layers.has(L)) return false
    if (subjectSet && !subjectSet.has(n.id)) return false
    if (country && n.location!.country !== country) return false
    if (arch && n.attributes?.architecture !== arch) return false
    if (atype && (n.subtype ?? TYPE_LABEL[n.type]) !== atype) return false
    if (!subjectSet && n.evidenceClass && !ev.has(n.evidenceClass)) return false
    const d = materialDate(n)
    if (!d) return undated || n.type === 'place'
    return d.start! <= period[1] && (d.end ?? d.start!) >= period[0]
  })
  const points: MapPoint[] = visible.map((n) => ({ id: n.id, lat: n.location!.lat, lon: n.location!.lon, label: n.name, family: n.family, ring: n.type === 'place', size: n.type === 'place' ? 4.5 : 5.5, sub: `${TYPE_LABEL[n.type]}${materialDate(n) ? ' · ' + materialDate(n)!.label : ''}` }))
  const sel = selected ? store.byId.get(selected) : undefined
  const toggle = (l: Layer) => setLayers((s) => { const n = new Set(s); n.has(l) ? n.delete(l) : n.add(l); return n })
  const reset = () => { setDeity(''); setText(''); setCharacter(''); setCountry(''); setArch(''); setAtype(''); setPeriod([-2600, 2026]); setUndated(true); setEv(new Set([1, 2, 3, 4, 5, 6, 7])); setLayers(new Set(['temple', 'site', 'object', 'place'])) }

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-0" style={{ minHeight: 'calc(100vh - 56px)' }}>
      <aside className="border-r border-night-rule p-4 space-y-4 text-[13px] overflow-auto scroll-thin lg:h-[calc(100vh-56px)]" aria-label="Atlas filters">
        <div>
          <div className="eyebrow !text-night-ink-2">Temple & artifact explorer</div>
          <h1 className="display text-3xl font-semibold mt-1">The atlas</h1>
          <p className="text-night-ink-2 text-[12.5px] mt-1 leading-relaxed">{visible.length} of {located.length} located records. Sites appear where research has verified coordinates.</p>
        </div>
        <fieldset>
          <legend className="eyebrow !text-night-ink-2 mb-1.5">Layers</legend>
          {LAYERS.map((l) => <label key={l.id} className="flex items-center gap-2 py-0.5"><input type="checkbox" checked={layers.has(l.id)} onChange={() => toggle(l.id)} />{l.id === 'place' ? <span className="inline-block w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: '#199e70' }} aria-hidden="true" /> : <Glyph family={l.id === 'object' || l.id === 'site' ? 'material' : 'geography'} size={10} dark />}{l.label}</label>)}
        </fieldset>
        <Sel label="Deity" value={deity} onChange={setDeity} options={deities.map((d) => [d.id, d.name])} />
        <Sel label="Text" value={text} onChange={setText} options={texts.map((d) => [d.id, d.name])} hint="Places and objects linked to the text, its narratives or its characters" />
        <Sel label="Character" value={character} onChange={setCharacter} options={characters.map((d) => [d.id, d.name])} />
        <Sel label="Region (present-day country)" value={country} onChange={setCountry} options={countries.map((c) => [c, c])} />
        <Sel label="Architectural tradition" value={arch} onChange={setArch} options={archs.map((c) => [c, c])} />
        <Sel label="Artifact type" value={atype} onChange={setAtype} options={atypes.map((c) => [c, c])} />
        <fieldset>
          <legend className="eyebrow !text-night-ink-2 mb-1.5">Period (material dates)</legend>
          <div className="flex justify-between text-[12px]"><span>{yearLabel(period[0])}</span><span>{yearLabel(period[1])}</span></div>
          <input type="range" min={-2600} max={2026} step={25} value={period[0]} onChange={(e) => setPeriod([Math.min(+e.target.value, period[1]), period[1]])} className="w-full" aria-label="From year" />
          <input type="range" min={-2600} max={2026} step={25} value={period[1]} onChange={(e) => setPeriod([period[0], Math.max(+e.target.value, period[0])])} className="w-full" aria-label="To year" />
          <label className="flex items-center gap-2 mt-1"><input type="checkbox" checked={undated} onChange={(e) => setUndated(e.target.checked)} /> include records without a material date</label>
        </fieldset>
        <fieldset>
          <legend className="eyebrow !text-night-ink-2 mb-1.5">Evidence classification</legend>
          <div className="flex flex-wrap gap-1">{[1, 2, 3, 4, 5, 6, 7].map((c) => <button key={c} title={EVIDENCE[c].label} aria-pressed={ev.has(c)} className={ev.has(c) ? '' : 'opacity-35'} onClick={() => setEv((s) => { const n = new Set(s); n.has(c) ? n.delete(c) : n.add(c); return n })}><EvidenceBadge cls={c} /></button>)}</div>
          <p className="text-[11px] text-night-ink-2 mt-1">With a deity, text or character selected, this filters the connections used; otherwise it filters the records themselves.</p>
        </fieldset>
        <button className="btn" onClick={reset}>Reset filters</button>
      </aside>
      <div className="relative">
        <MapView points={points} selected={selected} onSelect={setSelected} height="calc(100vh - 56px)" dark label="Atlas of temples, sites and findspots" padRight={selected ? 400 : 0} />
        {sel ? <Detail n={sel} onClose={() => setSelected(null)} /> : null}
        <details className="absolute left-3 top-3 max-w-[340px] rounded-xl border border-night-rule bg-night-2/95 text-[12.5px]">
          <summary className="px-3 py-2 cursor-pointer">List view ({visible.length})</summary>
          <ul className="max-h-[50vh] overflow-auto scroll-thin px-3 pb-2">
            {visible.sort((a, b) => a.name.localeCompare(b.name)).map((n) => <li key={n.id}><button className="w-full text-left py-1 flex items-center gap-2 hover:underline" onClick={() => setSelected(n.id)}><Glyph family={n.family} size={9} dark />{n.name}<span className="ml-auto text-night-ink-2">{materialDate(n)?.label ?? ''}</span></button></li>)}
          </ul>
        </details>
      </div>
    </div>
  )
}

function Sel({ label, value, onChange, options, hint }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][]; hint?: string }) {
  return (
    <label className="block">
      <span className="eyebrow !text-night-ink-2">{label}</span>
      <select className="field w-full mt-1" value={value} onChange={(e) => onChange(e.target.value)}><option value="">any</option>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      {hint ? <span className="block text-[11px] text-night-ink-2 mt-0.5">{hint}</span> : null}
    </label>
  )
}

function Detail({ n, onClose }: { n: GNode; onClose: () => void }) {
  const store = useStore()
  const nb = store.neighbours(n.id)
  const groups: [string, typeof nb][] = [
    ['Deities & forms', nb.filter((x) => x.other.type === 'deity')],
    ['Narratives & characters', nb.filter((x) => x.other.type === 'narrative' || x.other.type === 'character')],
    ['Texts', nb.filter((x) => x.other.type === 'text' || x.other.type === 'passage')],
    ['Inscriptions, objects & manuscripts', nb.filter((x) => ['inscription', 'artifact', 'manuscript', 'site'].includes(x.other.type))],
    ['Patrons, dynasties & institutions', nb.filter((x) => ['person', 'polity', 'institution'].includes(x.other.type))],
    ['Places, temples & networks', nb.filter((x) => ['place', 'temple', 'concept', 'tradition'].includes(x.other.type))],
    ['Debates', nb.filter((x) => x.other.type === 'claim')],
  ]
  const dates = (n.dates ?? []).sort((a, b) => (a.system === 'traditional' ? -1 : 0) - (b.system === 'traditional' ? -1 : 0))
  return (
    <aside className="absolute top-3 right-3 bottom-3 w-[min(380px,calc(100%-24px))] rounded-xl border border-night-rule bg-night-2/97 backdrop-blur overflow-auto scroll-thin p-5 fade-in" aria-label={`${n.name} details`}>
      <button className="absolute top-2 right-2 btn !p-1.5" aria-label="Close" onClick={onClose}><X size={13} /></button>
      <div className="flex items-center gap-2 text-[12px] text-night-ink-2"><Glyph family={n.family} size={11} dark />{TYPE_LABEL[n.type]}{n.subtype ? ` · ${n.subtype}` : ''}</div>
      <div className="display text-[1.8rem] leading-tight font-semibold mt-1 pr-8">{n.name}</div>
      {n.location ? <div className="text-[12px] text-night-ink-2">{n.location.label}</div> : null}
      {n.image ? <img src={n.image.url} alt={n.name} className="mt-3 rounded-lg w-full max-h-48 object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /> : null}
      {n.image ? <div className="text-[10.5px] text-night-ink-2 mt-1">{n.image.credit} · {n.image.license}</div> : null}
      <p className="text-[13.5px] leading-relaxed mt-3">{n.summary}</p>
      {dates.length ? (
        <div className="mt-3 space-y-1.5">
          {dates.map((d, i) => (
            <div key={i} className="rounded-lg bg-night-3 px-2.5 py-1.5 text-[12px]">
              <span className="font-semibold">{d.label}</span> <span className="text-night-ink-2">· {d.event} · {d.system === 'traditional' ? 'traditional account' : d.system === 'material' ? 'material evidence' : d.system} · {d.certainty}</span>
            </div>
          ))}
        </div>
      ) : null}
      {n.limits ? <p className="mt-3 text-[12px] text-night-ink-2 leading-relaxed"><b className="text-night-ink">Limits: </b>{n.limits}</p> : null}
      <div className="flex flex-wrap gap-1.5 mt-4">
        <a className="btn" href={entityHref(n.id)}><ExternalLink size={13} /> Profile</a>
        <a className="btn" href={href('graph', { focus: n.id })} onClick={(e) => { e.preventDefault(); navigate('graph', { focus: n.id }) }}><Network size={13} /> Graph</a>
        <a className="btn" href={href('time', { mode: 'material', subject: n.id })}><Clock size={13} /> Time</a>
      </div>
      <div className="mt-5 space-y-3">
        {groups.filter(([, xs]) => xs.length).map(([label, xs]) => (
          <div key={label}>
            <div className="text-[11px] uppercase tracking-wider text-night-ink-2 mb-1">{label}</div>
            <ul className="space-y-0.5">{xs.slice(0, 10).map((x) => (
              <li key={x.edge.id} className="flex items-center gap-2 text-[13px]"><Glyph family={x.other.family} size={9} dark /><a className="hover:underline truncate" href={entityHref(x.other.id)}>{x.other.name}</a><span className="ml-auto shrink-0"><EvidenceBadge cls={x.edge.evidenceClass} compact /></span></li>
            ))}</ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
