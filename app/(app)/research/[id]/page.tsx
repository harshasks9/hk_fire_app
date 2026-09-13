import { notFound } from 'next/navigation'
import { Page } from '@/components/shell/AppShell'
import { Section, Badge, AiMark } from '@/components/ui'
import { Panel, PanelSection } from '@/components/shell/IntelligencePanel'
import { getResearch } from '@/lib/queries'
import { NoteRow, FactList, TaskRow, DecisionCard } from '@/components/entities'
import { NewNoteButton } from '@/components/notes/NewNoteButton'
import { Synthesize } from '@/components/notes/Synthesize'
import { ResearchActions } from '@/components/crud/actions'
import { AskInline } from '@/components/ask/AskInline'
import { relativeTime } from '@/lib/util'
export const dynamic = 'force-dynamic'
export default async function ResearchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getResearch(id)
  if (!r) notFound()
  const p = r.project
  return (
    <Page>
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 text-[12.5px] text-fg-3">Research project · <Badge tone={p.status === 'active' ? 'accent' : 'neutral'}>{p.status}</Badge></div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{p.name}</h1>
            {p.question ? <p className="mt-1 text-[15px] text-fg-2">{p.question}</p> : p.description ? <p className="mt-1 text-[15px] text-fg-2">{p.description}</p> : null}
          </div>
          <div className="flex items-center gap-1.5"><Synthesize id={p.id} hasSynthesis={Boolean(p.synthesis)} /><NewNoteButton researchProjectId={p.id} label="Add note" /><ResearchActions project={p} redirectTo="/research" always /></div>
        </div>
      </header>
      {p.synthesis ? (
        <div className="mb-8 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-5 py-4">
          <div className="mb-1.5 flex items-center justify-between"><AiMark label="Synthesis" /><span className="text-[11.5px] text-fg-3">{p.synthesisUpdatedAt ? `updated ${relativeTime(p.synthesisUpdatedAt)}` : ''}</span></div>
          <p className="whitespace-pre-line text-[15px] leading-relaxed">{p.synthesis}</p>
        </div>
      ) : null}
      <div className="grid gap-x-10 md:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <Section title="Notes" count={r.notes.length}>{r.notes.length ? r.notes.map((n) => <NoteRow key={n.id} note={n} />) : <p className="text-[13.5px] text-fg-3">Add notes, drop PDFs or paste links. Everything in the project is synthesized together.</p>}</Section>
          {r.decisions.length ? <Section title="Working conclusions">{r.decisions.map((d) => <DecisionCard key={d.id} d={d} />)}</Section> : null}
        </div>
        <div className="min-w-0">
          {r.facts.length ? <Section title="Numbers"><FactList facts={r.facts.map((f) => ({ ...f, sourceTitle: r.notes.find((n) => n.id === f.sourceNoteId)?.title }))} showEntity /></Section> : null}
          {r.tasks.length ? <Section title="To do">{r.tasks.map((t) => <TaskRow key={t.id} task={t} showEntity={false} />)}</Section> : null}
          {r.sources.length ? <Section title="Sources"><ul className="space-y-1 text-[13px]">{r.sources.map((s) => <li key={s.id} className="truncate">{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{s.title || s.url}</a> : s.title} <span className="text-fg-3">· {s.kind}</span></li>)}</ul></Section> : null}
        </div>
      </div>
      <Panel title="Ask this project">
        <PanelSection title="Ask"><AskInline noteIds={r.notes.map((n) => n.id)} placeholder={p.question ?? 'Ask across the project'} suggestions={['What is the working conclusion?', 'What numbers matter most?', 'What is still unknown?']} compact /></PanelSection>
      </Panel>
    </Page>
  )
}
