import { useMemo } from 'react'
import { useStore, type GNode } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { entityHref, href } from '../app/router.ts'
import { Glyph, Note } from '../components/ui.tsx'
import { Clock } from 'lucide-react'

const ORDER = ['col:vedic-samhitas', 'col:brahmanas', 'col:aranyakas', 'col:upanishads', 'col:vedangas', 'col:sutras', 'col:itihasa', 'col:mahapuranas', 'col:upapuranas', 'col:dharmashastra', 'col:agamas-tantras', 'col:bhakti-literature', 'col:regional-retellings', 'col:southeast-asian']

/** Explore the Ancient Texts — every corpus and work with its scholarly date range. */
export function Texts({ route }: { route: Route }) {
  const store = useStore()
  void route
  const groups = useMemo(() => {
    const cols = store.real.filter((n) => n.type === 'collection').sort((a, b) => (ORDER.indexOf(a.id) + 1 || 99) - (ORDER.indexOf(b.id) + 1 || 99))
    const assigned = new Set<string>()
    const out = cols.map((c) => {
      const texts = (store.inc.get(c.id) ?? []).filter((e) => e.p === 'PART_OF').map((e) => store.byId.get(e.s)).filter((t): t is GNode => !!t && t.type === 'text')
      texts.forEach((t) => assigned.add(t.id))
      return { c, texts: texts.sort((a, b) => (store.dateOf(a.id)?.start ?? 9999) - (store.dateOf(b.id)?.start ?? 9999)) }
    })
    const rest = store.real.filter((n) => n.type === 'text' && !assigned.has(n.id))
    return { out, rest }
  }, [store])
  const lo = -1600, hi = 2026
  const x = (y: number) => `${((Math.max(lo, Math.min(hi, y)) - lo) / (hi - lo)) * 100}%`
  const Bar = ({ t }: { t: GNode }) => {
    const ds = (t.dates ?? []).filter((d) => d.system === 'scholarly-textual' && typeof d.start === 'number')
    return (
      <div className="relative h-5" aria-hidden="true">
        <div className="absolute inset-y-[9px] left-0 right-0 h-px" style={{ background: 'var(--rule)' }} />
        {ds.map((d, i) => (
          <div key={i} title={`${d.label}${d.view ? ` — ${d.view}` : ''}`} className="absolute rounded-sm" style={{ left: x(d.start!), width: `max(4px, calc(${x(d.end!)} - ${x(d.start!)}))`, top: 2 + i * 5, height: 4, background: 'var(--f-literature)', opacity: d.certainty === 'disputed' ? 0.45 : 0.9, outline: d.certainty === 'disputed' ? '1px dashed var(--f-literature)' : undefined }} />
        ))}
      </div>
    )
  }
  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Explore the ancient texts</div>
      <h1 className="display text-5xl font-semibold mt-1">The literature, corpus by corpus</h1>
      <p className="text-ink-2 mt-3 max-w-2xl leading-relaxed">Bars show scholarly date ranges for composition (several bars = several scholarly views). They are estimates of when a text took shape, not of the events it narrates, and not of its oldest surviving manuscript — which is usually far later.</p>
      <div className="mt-4 flex gap-2"><a className="btn" href={href('time', { mode: 'literature' })}><Clock size={14} /> Animate the literature through time</a></div>
      <div className="mt-6"><Note>Many texts — the Vedas above all — were transmitted orally with great precision for centuries before they were written down. Absence of an early manuscript is not absence of the text.</Note></div>
      <div className="mt-8 hidden md:grid grid-cols-[minmax(240px,1fr)_2fr] text-[10.5px] text-ink-3 px-4">
        <span />
        <div className="relative h-4">{[-1500, -1000, -500, 1, 500, 1000, 1500, 2000].map((y) => <span key={y} className="absolute -translate-x-1/2" style={{ left: x(y) }}>{y < 0 ? `${-y} BCE` : y === 1 ? '1 CE' : y}</span>)}</div>
      </div>
      <div className="space-y-6 mt-2">
        {[...groups.out.filter((g) => g.texts.length), ...(groups.rest.length ? [{ c: null as GNode | null, texts: groups.rest }] : [])].map((g) => (
          <section key={g.c?.id ?? 'rest'} className="card overflow-hidden">
            <div className="px-4 py-3 border-b hairline flex items-baseline gap-3 flex-wrap">
              {g.c ? <a href={entityHref(g.c.id)} className="display text-2xl font-semibold link">{g.c.name}</a> : <span className="display text-2xl font-semibold">Other works</span>}
              {g.c?.devanagari ? <span className="deva text-ink-3">{g.c.devanagari}</span> : null}
              <span className="text-xs text-ink-3 ml-auto">{g.texts.length} works</span>
            </div>
            <ul>
              {g.texts.map((t) => {
                const d = store.dateOf(t.id)
                return (
                  <li key={t.id} className="grid md:grid-cols-[minmax(240px,1fr)_2fr] gap-2 px-4 py-2.5 border-b hairline last:border-0 items-center">
                    <div className="min-w-0">
                      <a href={entityHref(t.id)} className="flex items-center gap-2 font-medium link"><Glyph family="literature" size={10} />{t.name}</a>
                      <div className="text-[11.5px] text-ink-3 ml-[18px]">{d ? d.label : 'undated in graph'}{d?.view ? ` · ${d.view}` : ''} · {t.m.degree} connections</div>
                    </div>
                    <Bar t={t} />
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
