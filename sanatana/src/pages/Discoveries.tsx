import { useState } from 'react'
import { useStore } from '../data/store.tsx'
import type { Route } from '../app/router.ts'
import { EntityLink, SourceList, ConfidenceDots, Empty, EvidenceBadge } from '../components/ui.tsx'
import { ChevronDown } from 'lucide-react'

/** Deliverable F — research discoveries, each with its evidence and its caveat. */
export function Discoveries({ route }: { route: Route }) {
  const store = useStore()
  const [open, setOpen] = useState<string | null>(route.query.get('d'))
  const kickers = [...new Set(store.discoveries.map((d) => d.kicker))]
  const [k, setK] = useState('')
  const list = store.discoveries.filter((d) => !k || d.kicker === k)
  return (
    <div className="max-w-[1000px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Research discoveries</div>
      <h1 className="display text-5xl font-semibold mt-1">What the connected record reveals</h1>
      <p className="text-ink-2 mt-3 max-w-2xl leading-relaxed">Findings that emerge only when texts, objects, inscriptions and places sit in one graph. Each states its evidence, links the assertions that carry it, and says plainly what it does not show.</p>
      <div className="mt-5 flex flex-wrap gap-1.5">
        <button className="chip" aria-pressed={!k} onClick={() => setK('')}>All {store.discoveries.length}</button>
        {kickers.map((x) => <button key={x} className="chip" aria-pressed={k === x} onClick={() => setK(x)}>{x}</button>)}
      </div>
      {!list.length ? <div className="mt-8"><Empty title="No discoveries compiled yet" /></div> : null}
      <ol className="mt-8 space-y-4">
        {list.map((d, i) => {
          const isOpen = open === d.id
          return (
            <li key={d.id} className="card overflow-hidden">
              <button className="w-full text-left p-5 flex gap-4 items-start" onClick={() => setOpen(isOpen ? null : d.id)} aria-expanded={isOpen}>
                <span className="display text-3xl font-semibold text-gold tabular-nums w-10 shrink-0">{String(store.discoveries.indexOf(d) + 1).padStart(2, '0')}</span>
                <span className="flex-1 min-w-0">
                  <span className="eyebrow">{d.kicker}</span>
                  <span className="block display text-[1.55rem] leading-snug font-semibold mt-1">{d.title}</span>
                  {!isOpen ? <span className="block text-[14px] text-ink-2 mt-2 line-clamp-2">{d.body.split('\n\n')[0]}</span> : null}
                </span>
                <span className="flex flex-col items-end gap-2 shrink-0"><ConfidenceDots c={d.confidence} /><ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} /></span>
              </button>
              {isOpen ? (
                <div className="px-5 pb-6 sm:pl-[76px] fade-in">
                  <div className="prose-museum text-[15.5px]">{d.body.split(/\n\n+/).map((p, j) => <p key={j}>{p}</p>)}</div>
                  <div className="mt-3 rounded-lg p-3 text-[13.5px]" style={{ background: 'var(--accent-bg)' }}><b>What this does not show. </b>{d.caveat}</div>
                  {d.entities.length ? <div className="mt-4"><div className="eyebrow mb-1.5">Records</div><div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">{d.entities.map((id) => <EntityLink key={id} id={id} />)}</div></div> : null}
                  {d.assertions?.length ? (
                    <div className="mt-4"><div className="eyebrow mb-1.5">Assertions that carry it</div>
                      <ul className="space-y-1 text-[13px]">{d.assertions.map((aid) => { const a = store.edgeById.get(aid); if (!a) return null; return (
                        <li key={aid} className="flex flex-wrap items-baseline gap-x-2"><EvidenceBadge cls={a.evidenceClass} compact /><EntityLink id={a.s} showGlyph={false} /><span className="text-ink-3">{store.meta.predicates[a.p]}</span><EntityLink id={a.o} showGlyph={false} />{a.sources[0]?.locator ? <span className="font-mono text-[11.5px]">{a.sources[0].locator}</span> : null}</li>) })}</ul>
                    </div>
                  ) : null}
                  <div className="mt-4"><div className="eyebrow mb-1.5">Sources</div><SourceList refs={d.sources} /></div>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
      <p className="text-[12px] text-ink-3 mt-6">Numbered {list.length ? `1–${store.discoveries.length}` : ''}. {i18nNote}</p>
    </div>
  )
}
const i18nNote = 'Network rankings and counts describe this dataset — which reflects research coverage — and are never evidence of religious importance or historical truth.'
