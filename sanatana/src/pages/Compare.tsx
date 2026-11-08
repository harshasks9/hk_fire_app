import { useStore } from '../data/store.tsx'
import { href, entityHref } from '../app/router.ts'
import { ComparisonTable } from '../components/ComparisonTable.tsx'
import { Empty } from '../components/ui.tsx'

/** All comparison tables, or one. */
export function Compare({ id }: { id?: string }) {
  const store = useStore()
  if (id) {
    const c = store.comparisons.find((x) => x.id === decodeURIComponent(id))
    if (!c) return <div className="max-w-3xl mx-auto px-4 py-24"><Empty title="Comparison not found" /></div>
    const subj = store.byId.get(c.subject)
    return (
      <div className="max-w-[1100px] mx-auto px-4 pt-10 pb-16">
        <a className="link text-sm" href={href('compare')}>← All comparisons</a>
        {subj ? <div className="mt-3 text-sm text-ink-3">About <a className="link" href={entityHref(subj.id)}>{subj.name}</a></div> : null}
        <div className="mt-4"><ComparisonTable c={c} /></div>
        <p className="text-[12.5px] text-ink-3 mt-4 max-w-3xl">Rows are ordered by the scholarly date of each source where one is recorded. The table does not decide which version is authentic: an older or better-known version is not thereby more correct, and each tradition’s telling is presented in its own terms.</p>
      </div>
    )
  }
  return (
    <div className="max-w-[1100px] mx-auto px-4 pt-10 pb-16">
      <div className="eyebrow">Contradictions and alternative accounts</div>
      <h1 className="display text-5xl font-semibold mt-1">What each text actually says</h1>
      <p className="text-ink-2 mt-3 max-w-2xl leading-relaxed">{store.comparisons.length} comparison tables, each setting out what different sources state on a single point — side by side, with locators, and without reconciling them.</p>
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {store.comparisons.map((c) => (
          <a key={c.id} href={href(`compare/${encodeURIComponent(c.id)}`)} className="card p-4 hover:border-gold">
            <div className="eyebrow">{store.byId.get(c.subject)?.name ?? ''} · {c.rows.length} sources</div>
            <div className="display text-xl font-semibold mt-1 leading-snug">{c.title}</div>
            <p className="text-[13px] text-ink-2 mt-1 line-clamp-2">{c.question}</p>
          </a>
        ))}
      </div>
    </div>
  )
}
