import type { Comparison } from '../../schema/types.ts'
import { useStore } from '../data/store.tsx'
import { EntityLink, SourceList, StatusBadge } from './ui.tsx'
import { href } from '../app/router.ts'

/** What each source says on one point — side by side, unreconciled. */
export function ComparisonTable({ c, compact = false }: { c: Comparison; compact?: boolean }) {
  const store = useStore()
  const rows = [...c.rows].sort((a, b) => (store.dateOf(a.text)?.start ?? 9999) - (store.dateOf(b.text)?.start ?? 9999))
  return (
    <div className="card overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b hairline">
        <div className="eyebrow mb-1">Comparison · {rows.length} sources</div>
        <a href={href(`compare/${encodeURIComponent(c.id)}`)} className="display text-2xl font-semibold leading-snug hover:text-gold">{c.title}</a>
        <p className="text-sm text-ink-2 mt-1">{c.question}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="data">
          <thead><tr><th style={{ width: '24%' }}>Source</th><th>What it says</th>{compact ? null : <th style={{ width: '28%' }}>Evidence</th>}</tr></thead>
          <tbody>
            {rows.map((r, i) => {
              const d = store.dateOf(r.text)
              return (
                <tr key={i}>
                  <td>
                    <EntityLink id={r.text} className="font-medium" />
                    {r.locator ? <div className="font-mono text-[11.5px] text-ink mt-0.5">{r.locator}</div> : null}
                    {d ? <div className="text-[11px] text-ink-3 mt-0.5">{d.label}</div> : null}
                  </td>
                  <td className="!text-ink leading-relaxed">{r.statement}</td>
                  {compact ? null : <td><StatusBadge status={r.status} /><div className="mt-1"><SourceList refs={r.sources} max={2} /></div></td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {c.note ? <div className="px-5 py-3 text-[13px] text-ink-2 border-t hairline">{c.note}</div> : null}
    </div>
  )
}
