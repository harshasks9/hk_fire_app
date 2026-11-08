/**
 * The Time Machine — five modes, four chronological systems, never one axis:
 *   literature  A · scholarly textual chronology of works, with manuscripts and references
 *   figure      B · one character / deity / narrative: its dated textual and material attestations
 *   material    C · dated temples, objects, inscriptions and manuscripts appearing on the map
 *   sacred      D · the traditional cosmological chronology (yugas, manvantaras, kalpas)
 *   spread      E · geographic development of documented traditions
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Play, Pause, SkipBack, Columns2 } from 'lucide-react'
import { useStore, type GNode } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { navigate, entityHref } from '../app/router.ts'
import { ERAS, yearLabel, centuryLabel, materialDate, TYPE_LABEL } from '../lib/meta.ts'
import { MapView, type MapPoint } from '../components/MapView.tsx'
import { AttestationChart } from '../components/AttestationChart.tsx'
import { gatherAttestations } from '../lib/attest.ts'
import { Glyph } from '../components/ui.tsx'
import { search } from '../lib/search.ts'

type Mode = 'literature' | 'figure' | 'material' | 'sacred' | 'spread'
const MODES: { id: Mode; label: string; letter: string; system: string }[] = [
  { id: 'literature', label: 'Evolution of literature', letter: 'A', system: 'Scholarly textual chronology' },
  { id: 'figure', label: 'Characters & narratives', letter: 'B', system: 'Textual + material attestations' },
  { id: 'material', label: 'Temples & artifacts', letter: 'C', system: 'Material chronology' },
  { id: 'sacred', label: 'Traditional sacred chronology', letter: 'D', system: 'Traditional cosmology' },
  { id: 'spread', label: 'Geographic spread', letter: 'E', system: 'Material + reception chronology' },
]
const MIN = -2600
const MAX = 2026

function useClock(initial: number) {
  const [year, setYear] = useState(initial)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const raf = useRef(0)
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    const step = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      setYear((y) => {
        const ny = y + dt * 120 * speed
        if (ny >= MAX) { setPlaying(false); return MAX }
        return ny
      })
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, speed])
  return { year: Math.round(year), setYear, playing, setPlaying, speed, setSpeed }
}

function Controls({ clock, min = MIN }: { clock: ReturnType<typeof useClock>; min?: number }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-night-rule bg-night-2 px-4 py-3">
      <button className="btn !p-2" aria-label="Back to start" onClick={() => { clock.setPlaying(false); clock.setYear(min) }}><SkipBack size={14} /></button>
      <button className="btn" onClick={() => { if (clock.year >= MAX) clock.setYear(min); clock.setPlaying(!clock.playing) }} aria-label={clock.playing ? 'Pause' : 'Play'}>{clock.playing ? <Pause size={14} /> : <Play size={14} />}{clock.playing ? 'Pause' : 'Play'}</button>
      <label className="text-[12px] flex items-center gap-1.5">Speed
        <select className="field" value={clock.speed} onChange={(e) => clock.setSpeed(+e.target.value)}>{[0.5, 1, 2, 4].map((s) => <option key={s} value={s}>{s}×</option>)}</select>
      </label>
      <div className="flex-1 min-w-[220px]">
        <input type="range" min={min} max={MAX} step={5} value={clock.year} onChange={(e) => { clock.setPlaying(false); clock.setYear(+e.target.value) }} className="w-full" aria-label="Year" aria-valuetext={yearLabel(clock.year)} />
      </div>
      <div className="text-right min-w-[150px]">
        <div className="display text-3xl font-semibold tabular-nums leading-none">{yearLabel(clock.year)}</div>
        <div className="text-[11px] text-night-ink-2">{centuryLabel(clock.year)}</div>
      </div>
      <label className="text-[12px] flex items-center gap-1.5">Era
        <select className="field w-48" value="" onChange={(e) => { if (e.target.value) { clock.setPlaying(false); clock.setYear(+e.target.value) } }}>
          <option value="">jump to…</option>
          {ERAS.map((er) => <option key={er.label} value={er.end}>{er.label} (to {yearLabel(er.end)})</option>)}
        </select>
      </label>
    </div>
  )
}

export default function TimeMachine({ route }: { route: Route }) {
  const mode = (route.query.get('mode') as Mode) || 'literature'
  const subject = route.query.get('subject') ?? undefined
  const setMode = (m: Mode) => navigate('time', { mode: m, subject: m === 'figure' ? subject : undefined }, true)
  const traditional = mode === 'sacred'
  return (
    <div className="max-w-[1400px] mx-auto px-4 pt-6 pb-12">
      <div className="flex flex-wrap items-end gap-4 justify-between">
        <div>
          <div className="eyebrow !text-night-ink-2">The time machine</div>
          <h1 className="display text-4xl sm:text-5xl font-semibold mt-1">Travel through time</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-night-rule p-1 text-[12px]" role="group" aria-label="Chronology system">
          <button className={`px-3 py-1 rounded-full ${!traditional ? 'bg-night-ink text-night' : 'text-night-ink-2'}`} onClick={() => traditional && setMode('literature')} aria-pressed={!traditional}>Historical chronologies</button>
          <button className={`px-3 py-1 rounded-full ${traditional ? 'bg-[var(--gold-soft)] text-night' : 'text-night-ink-2'}`} onClick={() => setMode('sacred')} aria-pressed={traditional}>Traditional chronology</button>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 sm:grid-cols-5 gap-2" role="tablist">
        {MODES.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} onClick={() => setMode(m.id)} className={`text-left rounded-xl border px-3 py-2.5 transition-colors ${mode === m.id ? 'border-[var(--gold-soft)] bg-night-2' : 'border-night-rule hover:border-night-ink-2'}`}>
            <div className="text-[11px] text-night-ink-2">Time machine {m.letter}</div>
            <div className="font-semibold text-[14px] leading-snug">{m.label}</div>
            <div className="text-[10.5px] text-night-ink-2 mt-0.5">{m.system}</div>
          </button>
        ))}
      </div>
      <div className="mt-5">
        {mode === 'literature' ? <Literature subject={subject} /> : mode === 'figure' ? <Figure subject={subject} /> : mode === 'material' ? <Material subject={subject} /> : mode === 'sacred' ? <Sacred /> : <Spread />}
      </div>
    </div>
  )
}

// ───────────── A · literature ─────────────
function Literature({ subject }: { subject?: string }) {
  const store = useStore()
  const clock = useClock(-1200)
  const [col, setCol] = useState('')
  const texts = useMemo(() => store.real.filter((n) => n.type === 'text' && store.dateOf(n.id, 'scholarly-textual', 'earliest')), [store])
  const cols = useMemo(() => store.real.filter((n) => n.type === 'collection'), [store])
  const rows = texts
    .filter((t) => !col || t.m.corpora.includes(col))
    .sort((a, b) => store.dateOf(a.id, 'scholarly-textual', 'earliest')!.start! - store.dateOf(b.id, 'scholarly-textual', 'earliest')!.start!)
  const lo = -1700, hi = 2026
  const x = (y: number) => `${((Math.max(lo, Math.min(hi, y)) - lo) / (hi - lo)) * 100}%`
  const begun = rows.filter((t) => store.dateOf(t.id, 'scholarly-textual', 'earliest')!.start! <= clock.year)
  const surely = rows.filter((t) => { const ds = (t.dates ?? []).filter((d) => d.system === 'scholarly-textual' && typeof d.end === 'number'); return ds.length && Math.max(...ds.map((d) => d.end!)) <= clock.year })
  const markers = useMemo(() => {
    const m = new Map<string, { y: number; node: GNode; kind: string }[]>()
    for (const e of store.edges) {
      if (e.p !== 'WITNESS_OF' && e.p !== 'REFERS_TO_TEXT') continue
      const src = store.byId.get(e.s)
      const d = src ? store.dateOf(src.id, 'material') ?? store.dateOf(src.id, 'scholarly-textual') : undefined
      if (!src || !d) continue
      ;(m.get(e.o) ?? m.set(e.o, []).get(e.o)!).push({ y: d.start!, node: src, kind: e.p === 'WITNESS_OF' ? 'manuscript' : 'external reference' })
    }
    return m
  }, [store])
  useEffect(() => { if (subject && store.byId.get(subject)?.type === 'collection') setCol(subject) }, [subject, store])
  return (
    <div className="space-y-4">
      <Controls clock={clock} min={-1700} />
      <div className="grid lg:grid-cols-[1fr_300px] gap-4">
        <div className="rounded-xl border border-night-rule bg-night-2 p-4 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-3 text-[12px]">
            <label className="flex items-center gap-1.5">Corpus <select className="field" value={col} onChange={(e) => setCol(e.target.value)}><option value="">all</option>{cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <span className="text-night-ink-2 ml-auto">{rows.length} dated works · bars = scholarly ranges (one per view) · ◆ manuscript · ● external reference</span>
          </div>
          <div className="relative text-[10.5px] text-night-ink-2 h-4 ml-[34%]">{[-1500, -1000, -500, 1, 500, 1000, 1500, 2000].map((y) => <span key={y} className="absolute -translate-x-1/2" style={{ left: x(y) }}>{y < 0 ? `${-y} BCE` : y === 1 ? '1 CE' : y}</span>)}</div>
          <ul className="max-h-[62vh] overflow-auto scroll-thin">
            {rows.map((t) => {
              const ds = (t.dates ?? []).filter((d) => d.system === 'scholarly-textual' && typeof d.start === 'number')
              const on = store.dateOf(t.id, 'scholarly-textual', 'earliest')!.start! <= clock.year
              return (
                <li key={t.id} className="grid grid-cols-[34%_1fr] items-center gap-2 py-1 border-b border-night-rule/50" style={{ opacity: on ? 1 : 0.28, transition: 'opacity .3s' }}>
                  <a href={entityHref(t.id)} className="truncate text-[12.5px] hover:underline" title={t.name}>{t.name}</a>
                  <div className="relative h-4">
                    {ds.map((d, i) => <div key={i} title={`${d.label}${d.view ? ' — ' + d.view : ''}`} className="absolute rounded-sm" style={{ left: x(d.start!), width: `max(4px, calc(${x(d.end!)} - ${x(d.start!)}))`, top: 1 + (i % 3) * 4, height: 3.5, background: '#c98500', opacity: d.certainty === 'disputed' ? 0.5 : 0.95 }} />)}
                    {(markers.get(t.id) ?? []).map((mk, i) => <a key={i} href={entityHref(mk.node.id)} title={`${mk.kind}: ${mk.node.name}`} className="absolute -translate-x-1/2 top-[1px] text-[10px] leading-none" style={{ left: x(mk.y), color: mk.kind === 'manuscript' ? '#3987e5' : '#d55181' }}>{mk.kind === 'manuscript' ? '◆' : '●'}</a>)}
                    <div className="absolute top-0 bottom-0 w-px" style={{ left: x(clock.year), background: 'var(--saffron)' }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        <div className="rounded-xl border border-night-rule bg-night-2 p-4 text-[13px] space-y-3 self-start">
          <div className="eyebrow !text-night-ink-2">By {yearLabel(clock.year)}</div>
          <div><span className="display text-3xl font-semibold">{begun.length}</span> works had begun to take shape <span className="text-night-ink-2">by the earliest scholarly estimate</span></div>
          <div><span className="display text-3xl font-semibold">{surely.length}</span> were complete <span className="text-night-ink-2">even by the latest estimate</span></div>
          <p className="text-[12px] text-night-ink-2 leading-relaxed">The two counts bracket the uncertainty instead of hiding it. Composition estimates rest on language, metre, internal references and external citations; they are revised as scholarship moves.</p>
          <div className="text-[12px]"><div className="text-night-ink-2 mb-1">Newest by earliest estimate:</div>{begun.slice(-6).reverse().map((t) => <div key={t.id}><a className="hover:underline" href={entityHref(t.id)}>{t.name}</a> <span className="text-night-ink-2">{store.dateOf(t.id, 'scholarly-textual', 'earliest')!.label}</span></div>)}</div>
        </div>
      </div>
    </div>
  )
}

// ───────────── B · figure ─────────────
const FIGURE_PRESETS = ['char:krishna', 'deity:vishnu', 'deity:shiva', 'char:rama', 'char:hanuman', 'deity:devi', 'deity:skanda', 'narr:samudra-manthana']
function Figure({ subject }: { subject?: string }) {
  const store = useStore()
  const id = subject && store.byId.has(subject) ? subject : FIGURE_PRESETS.find((p) => store.byId.has(p)) ?? store.real.find((n) => n.type === 'character')?.id
  const clock = useClock(-200)
  const [identified, setIdentified] = useState(true)
  const [q, setQ] = useState('')
  const hits = useMemo(() => (q ? search(store.search, q, 8, (s) => ['character', 'deity', 'narrative', 'concept'].includes(s.type)) : []), [q, store.search])
  const items = useMemo(() => (id ? gatherAttestations(store, id, identified) : []), [store, id, identified])
  if (!id) return null
  const n = store.byId.get(id)!
  const by = items.filter((i) => i.start <= clock.year)
  const textual = by.filter((i) => !i.disputed && (i.lane === 'text' || i.lane === 'reception'))
  const material = by.filter((i) => !i.disputed && i.lane === 'material')
  const contested = by.filter((i) => i.disputed)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FIGURE_PRESETS.filter((p) => store.byId.has(p)).map((p) => <button key={p} className="chip" aria-pressed={p === id} onClick={() => navigate('time', { mode: 'figure', subject: p }, true)}>{store.byId.get(p)!.name}</button>)}
        <div className="relative ml-auto">
          <input className="field w-64" placeholder="Any character, deity or narrative…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Choose a figure" />
          {hits.length ? <ul className="absolute z-20 right-0 mt-1 w-72 rounded-lg border border-night-rule bg-night-2 py-1 shadow-xl">{hits.map((h) => <li key={h.id}><button className="w-full text-left px-3 py-1.5 text-sm hover:bg-night-3" onClick={() => { setQ(''); navigate('time', { mode: 'figure', subject: h.id }, true) }}>{store.byId.get(h.id)!.name}</button></li>)}</ul> : null}
        </div>
      </div>
      <Controls clock={clock} min={-1800} />
      <div className="grid lg:grid-cols-[1fr_340px] gap-4">
        <div className="rounded-xl border border-night-rule bg-night-2 p-4">
          <div className="flex flex-wrap items-baseline gap-3 mb-2">
            <a href={entityHref(n.id)} className="display text-3xl font-semibold hover:underline">{n.name}</a>
            <span className="text-[12px] text-night-ink-2">{TYPE_LABEL[n.type]} · {items.length} dated attestations</span>
            <label className="ml-auto text-[12px] flex items-center gap-1.5"><input type="checkbox" checked={identified} onChange={(e) => setIdentified(e.target.checked)} /> include figures identified with it (labelled)</label>
          </div>
          <AttestationChart id={n.id} items={items} cursor={clock.year} dark />
        </div>
        <div className="rounded-xl border border-night-rule bg-night-2 p-4 text-[13px] self-start max-h-[70vh] overflow-auto scroll-thin">
          <div className="eyebrow !text-night-ink-2">Documented by {yearLabel(clock.year)}</div>
          <div className="mt-2"><span className="display text-3xl font-semibold">{textual.length}</span> textual references <span className="text-night-ink-2">(texts whose earliest estimated date precedes the cursor)</span></div>
          <ul className="mt-1 space-y-0.5">{textual.map((i) => <li key={i.key} className="text-[12.5px]"><a className="hover:underline" href={entityHref(i.node.id)}>{i.node.name}</a> <span className="text-night-ink-2">{i.label}{i.via ? ` · via ${i.via.name}` : ''}</span></li>)}</ul>
          <div className="mt-4"><span className="display text-3xl font-semibold">{material.length}</span> dated physical representations or references</div>
          <ul className="mt-1 space-y-0.5">{material.map((i) => <li key={i.key} className="text-[12.5px]"><a className="hover:underline" href={entityHref(i.node.id)}>{i.node.name}</a> <span className="text-night-ink-2">{i.label}{i.via ? ` · via ${i.via.name}` : ''}</span></li>)}</ul>
          {contested.length ? (
            <div className="mt-4"><div className="text-[12px] text-night-ink-2">Not counted — linked only by a disputed identification:</div>
              <ul className="mt-1 space-y-0.5">{contested.map((i) => <li key={i.key} className="text-[12.5px] opacity-80"><a className="hover:underline" href={entityHref(i.node.id)}>{i.node.name}</a> <span className="text-night-ink-2">{i.label}</span></li>)}</ul></div>
          ) : null}
          <p className="text-[11.5px] text-night-ink-2 mt-4 leading-relaxed">A textual date is an estimate of composition, not of the oldest copy; a material date establishes that a representation existed then — not that narrated events occurred, and not that the tradition began then.</p>
        </div>
      </div>
    </div>
  )
}

// ───────────── C · material ─────────────
const MAT_TYPES = ['temple', 'artifact', 'inscription', 'manuscript', 'site'] as const
function Material({ subject }: { subject?: string }) {
  const store = useStore()
  const clock = useClock(subject ? Math.min(MAX, (materialDate(store.byId.get(subject)!)?.start ?? 0) + 25) : -300)
  const [types, setTypes] = useState<Set<string>>(new Set(MAT_TYPES))
  const [country, setCountry] = useState('')
  const [compare, setCompare] = useState(false)
  const [yearB, setYearB] = useState(1200)
  const [sel, setSel] = useState<string | null>(subject ?? null)
  const items = useMemo(() => store.real.filter((n) => n.location && (MAT_TYPES as readonly string[]).includes(n.type) && materialDate(n)), [store])
  const countries = [...new Set(items.map((n) => n.location!.country))].sort()
  const filtered = items.filter((n) => types.has(n.type) && (!country || n.location!.country === country))
  const pts = (y: number): MapPoint[] => filtered.filter((n) => materialDate(n)!.start! <= y).map((n) => {
    const d = materialDate(n)!
    const fresh = y - d.start! < 100
    return { id: n.id, lat: n.location!.lat, lon: n.location!.lon, label: n.name, family: n.family, size: fresh ? 6.5 : 5, opacity: fresh ? 1 : 0.75, sub: `${TYPE_LABEL[n.type]} · ${d.label}` }
  })
  const century = filtered.filter((n) => { const s = materialDate(n)!.start!; return s <= clock.year && s > clock.year - 100 }).sort((a, b) => materialDate(a)!.start! - materialDate(b)!.start!)
  const selN = sel ? store.byId.get(sel) : undefined
  return (
    <div className="space-y-4">
      <Controls clock={clock} />
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        {MAT_TYPES.map((t) => <button key={t} className="chip" aria-pressed={types.has(t)} onClick={() => setTypes((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n })}><Glyph family={t === 'temple' ? 'geography' : 'material'} size={9} dark />{TYPE_LABEL[t]}s</button>)}
        <select className="field" value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Region"><option value="">all regions</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
        <button className="chip" aria-pressed={compare} onClick={() => setCompare((c) => !c)}><Columns2 size={12} /> Side-by-side</button>
        {compare ? <label className="flex items-center gap-1.5">compare with <input type="range" min={MIN} max={MAX} step={25} value={yearB} onChange={(e) => setYearB(+e.target.value)} aria-label="Comparison year" /> <b>{yearLabel(yearB)}</b></label> : null}
        <span className="ml-auto text-night-ink-2">{pts(clock.year).length} of {filtered.length} dated, located records visible</span>
      </div>
      <div className={`grid gap-4 ${compare ? 'lg:grid-cols-2' : 'lg:grid-cols-[1fr_320px]'}`}>
        <div className="relative">
          <MapView points={pts(clock.year)} dark height={compare ? 460 : 560} selected={sel} onSelect={setSel} label={`Dated records by ${yearLabel(clock.year)}`} />
          <div className="absolute top-3 left-3 rounded-lg bg-night-2/90 px-3 py-1.5 text-sm font-semibold">{yearLabel(clock.year)}</div>
        </div>
        {compare ? (
          <div className="relative">
            <MapView points={pts(yearB)} dark height={460} selected={sel} onSelect={setSel} label={`Dated records by ${yearLabel(yearB)}`} />
            <div className="absolute top-3 left-3 rounded-lg bg-night-2/90 px-3 py-1.5 text-sm font-semibold">{yearLabel(yearB)} · {pts(yearB).length} records</div>
          </div>
        ) : (
          <div className="rounded-xl border border-night-rule bg-night-2 p-4 text-[13px] self-start max-h-[560px] overflow-auto scroll-thin">
            {selN ? (
              <div className="mb-4 pb-4 border-b border-night-rule">
                <div className="text-[11px] text-night-ink-2">{TYPE_LABEL[selN.type]}</div>
                <a className="display text-2xl font-semibold hover:underline" href={entityHref(selN.id)}>{selN.name}</a>
                <div className="text-[12px] text-night-ink-2">{materialDate(selN)?.label} · {materialDate(selN)?.basis}</div>
                <p className="mt-2 text-[12.5px] leading-relaxed">{selN.summary}</p>
              </div>
            ) : null}
            <div className="eyebrow !text-night-ink-2">Appearing in the century to {yearLabel(clock.year)}</div>
            {century.length ? <ul className="mt-2 space-y-1">{century.map((n) => <li key={n.id}><button className="text-left hover:underline" onClick={() => setSel(n.id)}><Glyph family={n.family} size={9} dark /> {n.name}</button> <span className="text-night-ink-2 text-[12px]">{materialDate(n)!.label}</span></li>)}</ul> : <p className="text-night-ink-2 mt-2">No dated record in the dataset begins in this century. Play or drag the slider.</p>}
            <p className="text-[11.5px] text-night-ink-2 mt-4 leading-relaxed">Points appear at the earliest dated material phase of a structure or object — a surviving building, a documented earlier building, or an inscription on site — never at the date a tradition assigns to its founding, nor at a recorded destruction. Disputed dates are used only when no other date exists.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ───────────── D · sacred chronology ─────────────
function Sacred() {
  const store = useStore()
  const eras = [...store.sacred].sort((a, b) => a.order - b.order)
  const yugas = eras.filter((e) => e.kind === 'yuga')
  const bigger = eras.filter((e) => e.kind !== 'yuga' && e.kind !== 'narrative-sequence')
  const seq = eras.filter((e) => e.kind === 'narrative-sequence')
  const total = yugas.reduce((s, y) => s + (y.humanYears ?? 0), 0)
  const fmt = (n?: number) => (n ? n.toLocaleString() : '—')
  return (
    <div className="space-y-5">
      <div className="rounded-xl border p-4 text-[13.5px] leading-relaxed" style={{ borderColor: 'var(--gold-soft)', background: 'rgba(214,169,87,0.08)' }}>
        <b>Traditional cosmological chronology.</b> This mode shows time as the Purāṇas and Dharmaśāstra describe it — cycles of yugas within manvantaras within kalpas, and the narrative eras the tradition assigns to stories. It is a religious and cosmological framework, presented in its own terms. It is <b>not</b> on the same scale as the historical modes, and nothing here is converted into historical dates except where the tradition itself states an epoch.
      </div>
      {!eras.length ? <p className="text-night-ink-2">The sacred chronology dataset has not been compiled yet.</p> : null}
      {yugas.length ? (
        <div className="rounded-xl border border-night-rule bg-night-2 p-5">
          <div className="eyebrow !text-night-ink-2 mb-3">One mahāyuga — the four yugas in proportion{total ? ` (${fmt(total)} human years in the cited reckoning)` : ''}</div>
          <div className="flex h-16 rounded-lg overflow-hidden gap-[2px]" role="img" aria-label="The four yugas drawn in proportion to their stated durations">
            {yugas.map((y, i) => (
              <div key={y.id} className="flex flex-col justify-center px-3" style={{ flexGrow: y.humanYears ?? 1, background: ['#c98500', '#d95926', '#9085e9', '#3987e5'][i % 4], color: '#12162b' }} title={y.description}>
                <div className="font-semibold text-[14px] leading-tight">{y.name}</div>
                <div className="text-[11px] opacity-80">{fmt(y.humanYears)} yrs{y.divineYears ? ` · ${fmt(y.divineYears)} divine` : ''}</div>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-4 gap-3 mt-4">
            {yugas.map((y) => (
              <div key={y.id} className="text-[12.5px]">
                <div className="font-semibold">{y.name} {y.iast && y.iast !== y.name ? <span className="italic text-night-ink-2">{y.iast}</span> : null}</div>
                <p className="text-night-ink-2 mt-1 leading-relaxed">{y.description}</p>
                {y.narratives?.length ? <div className="mt-1.5 flex flex-wrap gap-1">{y.narratives.filter((nid) => store.byId.has(nid)).map((nid) => <a key={nid} className="chip hover:border-gold" href={entityHref(nid)}>{store.byId.get(nid)!.name}</a>)}</div> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {bigger.length ? (
        <div className="rounded-xl border border-night-rule bg-night-2 p-5">
          <div className="eyebrow !text-night-ink-2 mb-3">Larger cycles</div>
          <ol className="space-y-3">
            {bigger.map((e) => (
              <li key={e.id} className="grid md:grid-cols-[220px_1fr] gap-2 text-[13px]">
                <div><div className="font-semibold text-[15px]">{e.name}</div><div className="text-night-ink-2 text-[12px]">{e.kind}{e.humanYears ? ` · ${fmt(e.humanYears)} human years` : ''}</div></div>
                <div className="text-night-ink-2 leading-relaxed">{e.description}{e.note ? <span className="block mt-1 text-[12px] italic">{e.note}</span> : null}</div>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {seq.length ? (
        <div className="rounded-xl border border-night-rule bg-night-2 p-5">
          <div className="eyebrow !text-night-ink-2 mb-3">Narrative order as the tradition gives it</div>
          <ol className="space-y-2">{seq.map((e) => <li key={e.id} className="text-[13px]"><b>{e.name}</b> — <span className="text-night-ink-2">{e.description}</span> {e.narratives?.filter((nid) => store.byId.has(nid)).map((nid) => <a key={nid} className="chip ml-1 hover:border-gold" href={entityHref(nid)}>{store.byId.get(nid)!.name}</a>)}</li>)}</ol>
        </div>
      ) : null}
      {eras.length ? <div className="text-[12px] text-night-ink-2">Sources for each era are listed on the cited texts; reckonings differ between texts (e.g. Manusmṛti counts in divine years; the Viṣṇu Purāṇa converts at 360 human years per divine year).</div> : null}
    </div>
  )
}

// ───────────── E · geographic spread ─────────────
const TRAD_COLORS: [string, string, string][] = [['trad:vaishnava', 'Vaiṣṇava', '#3987e5'], ['trad:shaiva', 'Śaiva', '#d95926'], ['trad:shakta', 'Śākta', '#199e70']]
function traditionOf(store: ReturnType<typeof useStore>, n: GNode): string {
  const direct = n.traditions ?? []
  for (const [id] of TRAD_COLORS) if (direct.includes(id)) return id
  // via worshipped / referenced deity and that deity's tradition
  for (const x of store.neighbours(n.id)) {
    if (x.other.type !== 'deity') continue
    const ts = new Set([...(x.other.traditions ?? []), ...store.neighbours(x.other.id).filter((y) => y.edge.p === 'CENTRAL_TO' && y.dir === 'out').map((y) => y.other.id)])
    for (const [id] of TRAD_COLORS) if (ts.has(id)) return id
  }
  for (const t of direct) if (t.startsWith('trad:')) return 'other'
  return 'other'
}
function Spread() {
  const store = useStore()
  const clock = useClock(-200)
  const items = useMemo(() => store.real.filter((n) => n.location && ['temple', 'artifact', 'inscription', 'site', 'manuscript'].includes(n.type) && materialDate(n)).map((n) => ({ n, d: materialDate(n)!, t: traditionOf(store, n) })), [store])
  const color = (t: string) => TRAD_COLORS.find((c) => c[0] === t)?.[2] ?? '#9a93a8'
  const pts: MapPoint[] = items.filter((i) => i.d.start! <= clock.year).map((i) => ({ id: i.n.id, lat: i.n.location!.lat, lon: i.n.location!.lon, label: i.n.name, family: i.n.family, colorOverride: color(i.t), sub: `${i.d.label} · ${TRAD_COLORS.find((c) => c[0] === i.t)?.[1] ?? 'other / unassigned'}` }))
  const regions = useMemo(() => {
    const m = new Map<string, Map<string, { y: number; n: GNode }>>()
    for (const i of items) {
      const c = i.n.location!.country
      const r = m.get(c) ?? m.set(c, new Map()).get(c)!
      const cur = r.get(i.t)
      if (!cur || i.d.start! < cur.y) r.set(i.t, { y: i.d.start!, n: i.n })
    }
    return [...m.entries()].sort((a, b) => Math.min(...[...a[1].values()].map((v) => v.y)) - Math.min(...[...b[1].values()].map((v) => v.y)))
  }, [items])
  return (
    <div className="space-y-4">
      <Controls clock={clock} />
      <div className="grid lg:grid-cols-[1fr_380px] gap-4">
        <div className="relative">
          <MapView points={pts} dark height={560} label={`Documented traditions by ${yearLabel(clock.year)}`} />
          <div className="absolute top-3 left-3 rounded-lg bg-night-2/92 px-3 py-2 text-[12px] space-y-1">
            {TRAD_COLORS.map(([id, label, c]) => <div key={id} className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: c }} />{label}</div>)}
            <div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: '#9a93a8' }} />Other / unassigned</div>
            <div className="text-night-ink-2 pt-1">{pts.length} dated records by {yearLabel(clock.year)}</div>
          </div>
        </div>
        <div className="rounded-xl border border-night-rule bg-night-2 p-4 text-[13px] self-start max-h-[560px] overflow-auto scroll-thin">
          <div className="eyebrow !text-night-ink-2">Earliest dated record in the dataset, by region and tradition</div>
          <table className="w-full mt-2 text-[12px]">
            <tbody>
              {regions.map(([c, r]) => (
                <tr key={c} className="border-b border-night-rule/60 align-top">
                  <td className="py-1.5 pr-2 font-semibold w-24">{c}</td>
                  <td className="py-1.5">{[...r.entries()].sort((a, b) => a[1].y - b[1].y).map(([t, v]) => (
                    <div key={t} className="flex items-baseline gap-1.5" style={{ opacity: v.y <= clock.year ? 1 : 0.35 }}>
                      <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: color(t) }} />
                      <span className="tabular-nums w-[72px] shrink-0">{yearLabel(v.y)}</span>
                      <a className="hover:underline truncate" href={entityHref(v.n.id)}>{v.n.name}</a>
                    </div>
                  ))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11.5px] text-night-ink-2 mt-3 leading-relaxed">Spread is shown as documented points, not as migration arrows: transmission ran through many routes — trade, courts, monastic and Brahmin networks, pilgrimage, literature — and the earliest surviving evidence in a region dates only the record, not the arrival of a tradition. Tradition colours are inferred from a record’s own tradition or from the deity it is dedicated to.</p>
        </div>
      </div>
    </div>
  )
}
