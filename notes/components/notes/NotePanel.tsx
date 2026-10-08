'use client'
import Link from 'next/link'
import { Panel, PanelSection } from '@/components/shell/IntelligencePanel'
import { EntityChip, TaskRow, LoopRow, FactList, DecisionCard, NoteKindIcon } from '@/components/entities'
import { formatDate, relativeTime } from '@/lib/util'
import type { NoteDetail } from '@/lib/queries'
import { AskInline } from '@/components/ask/AskInline'
import { Sparkles } from 'lucide-react'
import { TagEditor } from './TagChips'
import { LinksPanel } from './LinksPanel'

export function NotePanel({ d }: { d: NoteDetail }) {
  const people = d.entities.filter((e) => e.type === 'person')
  const companies = d.entities.filter((e) => e.type === 'company')
  const topics = d.entities.filter((e) => e.type === 'topic' || e.type === 'project')
  const s = d.note.summary
  return (
    <Panel>
      {d.note.privacy === 'ai_excluded' ? <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-[12.5px] text-fg-2">AI is excluded from this note. Nothing is extracted or indexed for retrieval.</p> : null}
      {d.note.status === 'processing' ? <p className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-accent"><Sparkles className="h-3.5 w-3.5 animate-pulse" /> Understanding this note…</p> : null}
      <PanelSection title="Tags">
        <TagEditor noteId={d.note.id} auto={d.note.tags ?? []} manual={d.note.manualTags ?? []} />
      </PanelSection>
      {s?.summary.length ? (
        <PanelSection title="AI summary">
          <ul className="list-disc space-y-1 pl-4 text-[13px] leading-snug">{s.summary.slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}</ul>
        </PanelSection>
      ) : null}
      {companies.length || people.length ? (
        <PanelSection title="People & companies">
          <div className="flex flex-wrap gap-1">{[...companies, ...people].map((e) => <EntityChip key={e.id} id={e.id} name={e.name} type={e.type} />)}</div>
        </PanelSection>
      ) : null}
      {topics.length ? (
        <PanelSection title="Topics">
          <div className="flex flex-wrap gap-1">{topics.map((e) => <EntityChip key={e.id} id={e.id} name={e.name} type={e.type} />)}</div>
        </PanelSection>
      ) : null}
      {d.tasks.length ? (
        <PanelSection title="Actions">
          {d.tasks.map((t) => <TaskRow key={t.id} task={t} sourceTitle={d.note.title} showEntity={false} compact />)}
        </PanelSection>
      ) : null}
      {d.decisions.length ? (
        <PanelSection title="Decisions">
          {d.decisions.map((x) => <DecisionCard key={x.id} d={x} compact />)}
        </PanelSection>
      ) : null}
      {d.commitments.length ? (
        <PanelSection title="Open loops">
          {d.commitments.map((c) => <LoopRow key={c.id} loop={{ ...c, sourceTitle: d.note.title }} showCompany={false} />)}
        </PanelSection>
      ) : null}
      {d.facts.length ? (
        <PanelSection title="Numbers">
          <FactList facts={d.facts.map((f) => ({ ...f, sourceTitle: d.note.title }))} showEntity />
        </PanelSection>
      ) : null}
      {d.changes.length ? (
        <PanelSection title="Changed">
          <ul className="space-y-1 text-[13px]">{d.changes.map((c) => <li key={c.id} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />{c.description}</li>)}</ul>
        </PanelSection>
      ) : null}
      {d.meeting ? (
        <PanelSection title="Meeting">
          <Link href={`/meetings/${d.meeting.id}`} className="text-[13.5px] text-accent hover:underline">{d.meeting.title}</Link>
          <div className="text-[12px] text-fg-3">{formatDate(d.meeting.startsAt, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        </PanelSection>
      ) : null}
      <LinksPanel noteId={d.note.id} title={d.note.title} links={d.links} />
      {d.related.length ? (
        <PanelSection title="Related notes">
          <ul className="space-y-1">
            {d.related.map((r) => (
              <li key={r.id}>
                <Link href={`/notes/${r.id}`} className="-mx-2 flex items-start gap-2 rounded-md px-2 py-1 row-hover">
                  <NoteKindIcon kind={r.kind} className="mt-[3px] h-3.5 w-3.5 shrink-0 text-fg-3" />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px]">{r.title || 'Untitled'}</span>
                    <span className="block text-[11.5px] text-fg-3" suppressHydrationWarning>{r.reason} · {relativeTime(r.updatedAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </PanelSection>
      ) : null}
      {d.sources.length || d.attachments.length ? (
        <PanelSection title="Sources">
          <ul className="space-y-1 text-[13px]">
            {d.sources.map((s) => <li key={s.id} className="truncate">{s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="text-accent hover:underline">{s.title || s.domain || s.url}</a> : <span>{s.title ?? s.kind}</span>} <span className="text-fg-3">· {s.kind}</span></li>)}
            {d.attachments.map((a) => <li key={a.id} className="truncate"><a href={`/api/attachments/${a.id}`} target="_blank" rel="noreferrer" className="text-accent hover:underline">{a.name}</a> <span className="text-fg-3">· {Math.round(a.size / 1024)} KB</span></li>)}
          </ul>
        </PanelSection>
      ) : null}
      <PanelSection title="Ask about this note">
        <AskInline noteIds={[d.note.id]} placeholder="What did we agree on?" compact />
      </PanelSection>
    </Panel>
  )
}
