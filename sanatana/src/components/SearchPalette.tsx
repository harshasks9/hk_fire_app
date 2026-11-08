import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, CornerDownLeft } from 'lucide-react'
import { useStore } from '../data/store.tsx'
import { search, fold } from '../lib/search.ts'
import { entityHref } from '../app/router.ts'
import { Glyph } from './ui.tsx'
import { TYPE_LABEL } from '../lib/meta.ts'

const EXAMPLES = ['Krishna', 'Kṛṣṇa', 'कृष्ण', 'Hanuman', 'Brihadisvara', 'Heliodorus', 'Rigveda', 'शिव', 'Kamba']

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(() => input.current?.focus(), 10) } }, [open])
  const hits = useMemo(() => search(store.search, q, 14), [q, store.search])
  useEffect(() => setSel(0), [q])
  if (!open) return null
  const go = (id: string) => { window.location.hash = entityHref(id); onClose() }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-4 pt-[12vh]" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label="Search the knowledge graph">
      <div className="w-full max-w-xl card shadow-2xl overflow-hidden text-ink" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 border-b hairline">
          <Search size={16} className="text-ink-3" />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(hits.length - 1, s + 1)) }
              if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
              if (e.key === 'Enter' && hits[sel]) go(hits[sel].id)
            }}
            placeholder="Krishna · Kṛṣṇa · कृष्ण · a temple, a text, an inscription…"
            className="w-full py-3.5 bg-transparent outline-none text-[15px]"
            aria-label="Search"
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls="search-results"
          />
          <kbd className="text-[10px] text-ink-3">Esc</kbd>
        </div>
        <ul id="search-results" role="listbox" className="max-h-[52vh] overflow-auto scroll-thin">
          {hits.map((h, i) => {
            const n = store.byId.get(h.id)!
            return (
              <li key={h.id} role="option" aria-selected={i === sel}>
                <button onMouseEnter={() => setSel(i)} onClick={() => go(h.id)} className={`w-full text-left px-4 py-2.5 flex items-start gap-3 ${i === sel ? 'bg-accent-bg' : ''}`}>
                  <span className="mt-1"><Glyph family={n.family} size={12} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-2">
                      <span className="font-medium truncate">{n.name}</span>
                      {n.devanagari ? <span className="deva text-ink-3 text-sm">{n.devanagari}</span> : null}
                    </span>
                    <span className="block text-xs text-ink-3 truncate">
                      {TYPE_LABEL[n.type]}{h.matched !== n.name && fold(h.matched) !== fold(n.name) ? ` · matched “${h.matched}”` : ''} — {n.summary}
                    </span>
                  </span>
                  {i === sel ? <CornerDownLeft size={14} className="text-ink-3 mt-1" /> : null}
                </button>
              </li>
            )
          })}
          {q && hits.length === 0 ? <li className="px-4 py-6 text-sm text-ink-3">No record matches “{q}”. The graph covers only what has been researched and verified so far — try another spelling or script.</li> : null}
          {!q ? (
            <li className="px-4 py-4 text-sm text-ink-3">
              Search across English spellings, IAST and Devanāgarī. Try:
              <div className="flex flex-wrap gap-1.5 mt-2">{EXAMPLES.map((x) => <button key={x} className="chip hover:border-gold" onClick={() => setQ(x)}><span className={/[ऀ-ॿ]/.test(x) ? 'deva' : ''}>{x}</span></button>)}</div>
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  )
}
