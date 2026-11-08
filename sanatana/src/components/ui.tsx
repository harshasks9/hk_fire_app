/** Small shared pieces: entity links, glyphs, evidence badges, source citations, dates. */
import { useState, type ReactNode } from 'react'
import { ExternalLink, Info, ChevronDown } from 'lucide-react'
import type { DateClaim, SourceRef } from '../../schema/types.ts'
import { useStore, type Family, type GNode } from '../data/store.tsx'
import { entityHref } from '../app/router.ts'
import { EVIDENCE, FAMILY_BY_ID, STATUS, SYSTEM_LABEL, TYPE_LABEL } from '../lib/meta.ts'

/** Family glyph — shape is the secondary encoding next to colour. */
export function Glyph({ family, size = 12, dark = false }: { family: Family; size?: number; dark?: boolean }) {
  const f = FAMILY_BY_ID[family]
  const c = dark ? f.dark : `var(${f.cssVar})`
  const s = size
  const h = s / 2
  const shape = (() => {
    switch (family) {
      case 'literature': return <rect x={1} y={2} width={s - 2} height={s - 4} rx={2} fill={c} />
      case 'deity': {
        const pts = Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? h * 0.45 : h - 0.5; const a = (Math.PI / 5) * i - Math.PI / 2; return `${h + r * Math.cos(a)},${h + r * Math.sin(a)}` }).join(' ')
        return <polygon points={pts} fill={c} />
      }
      case 'figure': return <circle cx={h} cy={h} r={h - 1} fill={c} />
      case 'narrative': return <polygon points={`${h},1 ${s - 1},${h} ${h},${s - 1} 1,${h}`} fill={c} />
      case 'geography': return <polygon points={`${h},1.5 ${s - 1},${s - 1.5} 1,${s - 1.5}`} fill={c} strokeLinejoin="round" stroke={c} strokeWidth={1} />
      case 'material': {
        const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i; return `${h + (h - 1) * Math.cos(a)},${h + (h - 1) * Math.sin(a)}` }).join(' ')
        return <polygon points={pts} fill={c} />
      }
      case 'history': {
        const pts = Array.from({ length: 5 }, (_, i) => { const a = ((2 * Math.PI) / 5) * i - Math.PI / 2; return `${h + (h - 1) * Math.cos(a)},${h + (h - 1) * Math.sin(a)}` }).join(' ')
        return <polygon points={pts} fill={c} />
      }
      case 'claim': return <polygon points={`1,2 ${h},${s - 1.5} ${s - 1},2 ${h},${h - 0.5}`} fill={c} />
    }
  })()
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden="true" className="shrink-0 inline-block">
      {shape}
    </svg>
  )
}

export function EntityLink({ id, className = '', showGlyph = true, children }: { id: string; className?: string; showGlyph?: boolean; children?: ReactNode }) {
  const { byId } = useStore()
  const n = byId.get(id)
  if (!n) return <span className="text-ink-3">{id}</span>
  return (
    <a href={entityHref(id)} className={`inline-flex items-baseline gap-1.5 link ${className}`} title={`${TYPE_LABEL[n.type] ?? n.type}: ${n.summary?.slice(0, 140) ?? ''}`}>
      {showGlyph && <span className="self-center"><Glyph family={n.family} size={10} /></span>}
      <span>{children ?? n.name}</span>
    </a>
  )
}

export function TypeTag({ n }: { n: GNode }) {
  return (
    <span className="chip">
      <Glyph family={n.family} size={10} />
      {TYPE_LABEL[n.type] ?? n.type}
      {n.subtype ? <span className="text-ink-3">· {n.subtype}</span> : null}
    </span>
  )
}

export function EvidenceBadge({ cls, compact = false }: { cls: number; compact?: boolean }) {
  const e = EVIDENCE[cls]
  if (!e) return null
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-none border"
      style={{ color: `var(--ev-${cls})`, borderColor: `color-mix(in srgb, var(--ev-${cls}) 45%, transparent)`, background: `color-mix(in srgb, var(--ev-${cls}) 9%, transparent)` }}
      title={`Evidence class ${cls}: ${e.label} — ${e.blurb}`}
    >
      <span aria-hidden="true" className="tabular-nums">{cls}</span>
      {compact ? null : <span>{e.short}</span>}
      <span className="sr-only">Evidence class {cls}: {e.label}</span>
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status]
  if (!s) return null
  const tone = status === 'verified-online' || status === 'source-checked' ? 'var(--f-history)' : status === 'disputed' || status === 'unresolved' ? 'var(--ev-7)' : 'var(--ink-3)'
  const mark = status === 'verified-online' ? '✓' : status === 'source-checked' ? '✓' : status === 'disputed' ? '⇄' : status === 'unresolved' ? '?' : '…'
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: tone }} title={s.blurb}>
      <span aria-hidden="true">{mark}</span>
      {s.label}
    </span>
  )
}

export function ConfidenceDots({ c }: { c: string }) {
  const n = c === 'high' ? 3 : c === 'medium' ? 2 : 1
  return (
    <span className="inline-flex items-center gap-0.5" title={`Confidence: ${c}`} aria-label={`Confidence ${c}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: i <= n ? 'var(--gold)' : 'var(--rule-2)' }} />
      ))}
    </span>
  )
}

export function SourceCite({ r }: { r: SourceRef }) {
  const { sourceById } = useStore()
  const s = sourceById.get(r.source)
  const url = r.url ?? s?.url
  return (
    <span className="text-[12.5px] text-ink-2 leading-snug">
      {s ? (
        <>
          <span className="font-medium text-ink">{s.author ? `${s.author.split(/,| and /)[0]}${s.year ? ` (${s.year})` : ''}` : s.title}</span>
          {s.author ? <span className="italic">, {s.title}</span> : null}
        </>
      ) : (
        <span className="text-ink-3">{r.source}</span>
      )}
      {r.locator ? <span className="ml-1 font-mono text-[11.5px] text-ink">· {r.locator}</span> : null}
      {r.edition ? <span className="ml-1 text-ink-3">({r.edition})</span> : null}
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-gold hover:underline" aria-label="Open source in a new tab">
          <ExternalLink size={11} />
        </a>
      ) : null}
      {r.quote ? <span className="block mt-1 pl-2 border-l-2 italic text-ink-2" style={{ borderColor: 'var(--gold-soft)' }}>“{r.quote}”</span> : null}
    </span>
  )
}

/** Cites a list of references, grouping several locators in the same source into one line. */
export function SourceList({ refs, max = 6, compact = false }: { refs: SourceRef[]; max?: number; compact?: boolean }) {
  const [all, setAll] = useState(false)
  const groups: SourceRef[][] = []
  for (const r of refs) {
    const g = groups.find((x) => x[0].source === r.source && x[0].edition === r.edition)
    if (g) g.push(r)
    else groups.push([r])
  }
  const list = all ? groups : groups.slice(0, max)
  return (
    <ul className="space-y-1.5">
      {list.map((g, i) => (
        <li key={i}><SourceGroup refs={g} compact={compact} /></li>
      ))}
      {groups.length > max && !all ? (
        <li><button className="text-xs link" onClick={() => setAll(true)}>+ {groups.length - max} more sources</button></li>
      ) : null}
    </ul>
  )
}

function shortAuthor(a?: string): string | undefined {
  if (!a) return undefined
  const first = a.split(/[;,]| and /)[0].trim()
  return first.length > 46 ? first.slice(0, 44) + '…' : first
}

function SourceGroup({ refs, compact }: { refs: SourceRef[]; compact: boolean }) {
  const { sourceById } = useStore()
  const s = sourceById.get(refs[0].source)
  const url = refs[0].url ?? s?.url
  const year = s?.year?.replace(/\s*\(.*\)\s*$/, '')
  const locs = refs.map((r) => r.locator).filter(Boolean) as string[]
  const quotes = refs.map((r) => r.quote).filter(Boolean) as string[]
  return (
    <span className="text-[12.5px] text-ink-2 leading-snug" title={s ? `${s.author ?? ''} — ${s.title}${s.publisher ? `. ${s.publisher}` : ''}${s.year ? `, ${s.year}` : ''}` : refs[0].source}>
      {s ? (
        <>
          <span className="font-medium text-ink">{shortAuthor(s.author) ?? s.title}{year ? ` (${year})` : ''}</span>
          {s.author && !compact ? <span className="italic">, {s.title.length > 90 ? s.title.slice(0, 88) + '…' : s.title}</span> : null}
        </>
      ) : (
        <span className="text-ink-3">{refs[0].source}</span>
      )}
      {locs.length ? <span className="ml-1 font-mono text-[11.5px] text-ink">· {locs.join(' · ')}</span> : null}
      {refs[0].edition ? <span className="ml-1 text-ink-3">({refs[0].edition})</span> : null}
      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-gold hover:underline" aria-label="Open source in a new tab">
          <ExternalLink size={11} />
        </a>
      ) : null}
      {quotes.map((q, i) => <span key={i} className="block mt-1 pl-2 border-l-2 italic text-ink-2" style={{ borderColor: 'var(--gold-soft)' }}>“{q}”</span>)}
    </span>
  )
}

export function DateRow({ d }: { d: DateClaim }) {
  return (
    <div className="py-2 border-b hairline last:border-0">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="display text-xl font-semibold">{d.label}</span>
        <span className="text-xs text-ink-3">{d.event}</span>
        <span className="text-[11px] rounded px-1.5 py-0.5" style={{ background: 'var(--accent-bg)', color: 'var(--ink-2)' }}>{SYSTEM_LABEL[d.system]}</span>
        <span className="text-[11px] font-medium" style={{ color: d.certainty === 'secure' ? 'var(--f-history)' : d.certainty === 'disputed' ? 'var(--ev-7)' : 'var(--ink-3)' }}>
          {d.certainty}
        </span>
        {d.view ? <span className="text-xs text-ink-3">view: {d.view}</span> : null}
      </div>
      <div className="text-xs text-ink-3 mt-0.5">Basis: {d.basis}</div>
      <div className="mt-1"><SourceList refs={d.sources} max={2} /></div>
    </div>
  )
}

export function Section({ id, title, kicker, children, aside }: { id?: string; title: string; kicker?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section id={id} className="py-8 border-t hairline first:border-t-0 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          {kicker ? <div className="eyebrow mb-1">{kicker}</div> : null}
          <h2 className="display text-[1.9rem] leading-tight font-semibold">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-center" style={{ borderColor: 'var(--rule-2)' }}>
      <div className="display text-xl mb-1">{title}</div>
      {children ? <div className="text-sm text-ink-3 max-w-xl mx-auto">{children}</div> : null}
    </div>
  )
}

export function Disclosure({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button className="flex items-center gap-1 text-sm text-ink-2 hover:text-ink" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <ChevronDown size={14} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
        {summary}
      </button>
      {open ? <div className="mt-2 fade-in">{children}</div> : null}
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2 rounded-lg p-3 text-[13px] leading-relaxed" style={{ background: 'var(--accent-bg)', color: 'var(--ink-2)' }}>
      <Info size={15} className="shrink-0 mt-0.5 text-gold" />
      <div>{children}</div>
    </div>
  )
}

export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <div title={hint}>
      <div className="display text-4xl font-semibold tabular-nums leading-none">{value}</div>
      <div className="eyebrow mt-2">{label}</div>
    </div>
  )
}
