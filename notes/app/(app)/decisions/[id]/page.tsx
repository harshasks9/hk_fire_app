import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { Section, Badge, Avatar } from '@/components/ui'
import { getDecision } from '@/lib/queries'
import { EntityChip, GenerateMenu, NoteRow, SourceHover } from '@/components/entities'
import { DecisionStatus } from '@/components/notes/DecisionStatus'
import { DecisionActions } from '@/components/crud/actions'
import { formatDate } from '@/lib/util'
import { GitBranch } from 'lucide-react'
export const dynamic = 'force-dynamic'
export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getDecision(id)
  if (!d) notFound()
  const x = d.decision
  const kindLabel: Record<string, string> = { made: 'Decided', confirmed: 'Reconfirmed', modified: 'Modified', contradicted: 'Contradicted', proposed: 'Proposed' }
  return (
    <Page>
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-[12.5px] text-fg-3"><GitBranch className="h-3.5 w-3.5" /> Decision · {formatDate(x.decidedAt, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{x.title}</h1>
          <div className="flex items-center gap-2"><DecisionStatus id={x.id} status={x.status} /><GenerateMenu target={{ type: 'decision', id: x.id }} /><DecisionActions decision={x} redirectTo="/decisions" always /></div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {d.topic ? <EntityChip id={d.topic.id} name={d.topic.name} type="topic" /> : null}
          {d.company ? <EntityChip id={d.company.id} name={d.company.name} type="company" /> : null}
        </div>
      </header>
      <div className="mb-8 rounded-xl border border-border bg-surface px-5 py-4">
        <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Current statement</div>
        <p className="text-[17px] leading-relaxed"><SourceHover sourceNoteId={x.sourceNoteId} sourceTitle={d.notes.find((n) => n.id === x.sourceNoteId)?.title} excerpt={x.sourceExcerpt} date={x.decidedAt}>{x.statement}</SourceHover></p>
        <Badge tone={x.status === 'active' ? 'success' : x.status === 'revisited' || x.status === 'proposed' ? 'warning' : 'neutral'} className="mt-2">{x.status}</Badge>
      </div>
      <div className="grid gap-x-10 md:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <Section title="Decision history" hint="how this evolved">
            <ol className="relative ml-[5px] border-l border-border pl-5">
              {d.revisions.map((r) => (
                <li key={r.id} className="relative pb-4 last:pb-0">
                  <span className={`absolute -left-[26px] top-[5px] h-3 w-3 rounded-full ring-2 ring-bg ${r.kind === 'contradicted' ? 'bg-danger' : r.kind === 'proposed' ? 'bg-warning' : r.kind === 'modified' ? 'bg-accent' : 'bg-success'}`} />
                  <div className="flex flex-wrap items-baseline gap-x-2 text-[12.5px] text-fg-3"><span className="tabular-nums">{formatDate(r.occurredAt, { month: 'short', day: 'numeric' })}</span><span className="font-medium text-fg-2">{kindLabel[r.kind]}</span>{r.sourceNoteId ? <Link href={`/notes/${r.sourceNoteId}?highlight=${encodeURIComponent((r.sourceExcerpt ?? r.statement).slice(0, 100))}`} className="text-accent hover:underline">{r.sourceTitle ?? 'source'}</Link> : null}</div>
                  <p className="mt-0.5 text-[14.5px] leading-snug">{r.statement}</p>
                </li>
              ))}
            </ol>
          </Section>
          {x.context ? <Section title="Context"><p className="text-[14.5px] leading-relaxed text-fg-2">{x.context}</p></Section> : null}
          {x.reasoning ? <Section title="Reasoning"><p className="text-[14.5px] leading-relaxed text-fg-2">{x.reasoning}</p></Section> : null}
          {x.alternatives.length ? <Section title="Alternatives considered"><ul className="list-disc space-y-1 pl-5 text-[14.5px] text-fg-2">{x.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul></Section> : null}
        </div>
        <div className="min-w-0">
          <Section title="People involved">
            {d.people.length ? <ul className="space-y-1">{d.people.map((p) => <li key={p.id}><Link href={`/people/${p.id}`} className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1 row-hover"><Avatar name={p.name} size={22} /><span className="text-[13.5px]">{p.name}</span><span className="text-[11.5px] text-fg-3">{p.attributes.role}</span></Link></li>)}</ul> : <p className="text-[13px] text-fg-3">Nobody recorded.</p>}
          </Section>
          <Section title="Related notes">{d.notes.map((n) => <NoteRow key={n.id} note={n} showEntities={false} dense />)}</Section>
        </div>
      </div>
    </Page>
  )
}
