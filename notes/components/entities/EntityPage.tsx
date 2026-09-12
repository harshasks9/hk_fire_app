import Link from 'next/link'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui'
import { Page } from '@/components/shell/AppShell'
import { Section, Badge, Avatar } from '@/components/ui'
import { Panel, PanelSection } from '@/components/shell/IntelligencePanel'
import { EntityChip, TaskRow, LoopRow, FactList, DecisionCard, Timeline, NoteRow, MeetingRow, InsightRow, GenerateMenu, PinButton, EntityIcon } from '@/components/entities'
import { AskInline } from '@/components/ask/AskInline'
import { ensureEntitySummary } from '@/lib/entity-summary'
import type { EntityDetail } from '@/lib/queries'
import { formatDate, pluralize } from '@/lib/util'
import { AiMark } from '@/components/ui'
import { Share2 } from 'lucide-react'

export async function EntityPage({ d }: { d: EntityDetail }) {
  const e = d.entity
  const isPerson = e.type === 'person'
  const isCompany = e.type === 'company'
  const promised = d.loops.filter((l) => l.kind === 'promised')
  const suggestions = isPerson
    ? [`What have ${e.name.split(' ')[0]} and I discussed recently?`, `What did I promise ${e.name.split(' ')[0]}?`, `What does ${e.name.split(' ')[0]} care about?`]
    : isCompany
      ? [`What is the current status with ${e.name}?`, `What did we decide with ${e.name}?`, `What are the open risks at ${e.name}?`]
      : [`What have I learned about ${e.name.toLowerCase()}?`, `How has ${e.name.toLowerCase()} changed over time?`, `Which customers raised ${e.name.toLowerCase()}?`]

  return (
    <Page>
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {isPerson ? <Avatar name={e.name} size={44} className="mt-0.5" /> : <span className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-2 text-fg-2"><EntityIcon type={e.type} className="h-5 w-5" /></span>}
            <div>
              <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{e.name}</h1>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-fg-2">
                {e.attributes.role ? <span>{e.attributes.role}</span> : null}
                {e.attributes.company ? <span>· {d.companies.find((c) => c.name.toLowerCase() === e.attributes.company?.toLowerCase()) ? <Link href={`/companies/${d.companies.find((c) => c.name.toLowerCase() === e.attributes.company?.toLowerCase())!.id}`} className="hover:text-fg">{e.attributes.company}</Link> : e.attributes.company}</span> : null}
                {e.attributes.status ? <Badge tone={/risk|escalation/i.test(e.attributes.status) ? 'warning' : 'neutral'}>{e.attributes.status}</Badge> : null}
                {e.attributes.stage ? <span className="text-fg-3">· {e.attributes.stage}</span> : null}
                {e.attributes.location ? <span className="text-fg-3">· {e.attributes.location}</span> : null}
                <span className="text-fg-3">· {pluralize(d.notes.length, 'note')}{e.lastSeenAt ? `, last ${formatDate(e.lastSeenAt)}` : ''}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/graph?focus=${e.type}:${e.id}`} className="inline-flex h-8 items-center gap-1 rounded-[9px] border border-border px-2.5 text-[12.5px] text-fg-2 hover:bg-surface-2 hover:text-fg" title="See in the graph"><Share2 className="h-3.5 w-3.5" /> Graph</Link>
            <PinButton id={e.id} pinned={e.pinned} />
            <GenerateMenu target={{ type: 'entity', id: e.id }} />
          </div>
        </div>
      </header>

      <div className="mb-8 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-4 py-3.5">
        <AiMark label={isPerson ? 'Relationship summary' : isCompany ? 'Executive summary' : 'Overview'} className="mb-1.5" />
        <Suspense fallback={<div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-2/3" /></div>}>
          <EntitySummary d={d} />
        </Suspense>
      </div>

      {d.insights.length ? <Section title="Noticed">{d.insights.map((i) => <InsightRow key={i.id} insight={i} />)}</Section> : null}

      <div className="grid gap-x-10 md:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          {d.changes.length ? (
            <Section title="Changed" hint="facts that moved">
              <ul className="space-y-1.5 text-[13.5px]">{d.changes.map((c) => <li key={c.id} className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning" /><span>{c.description} <span className="text-fg-3">· {formatDate(c.detectedAt)}</span>{c.sourceNoteId ? <Link href={`/notes/${c.sourceNoteId}`} className="ml-1 text-[12px] text-accent hover:underline">source</Link> : null}</span></li>)}</ul>
            </Section>
          ) : null}
          {d.tasks.length ? (
            <Section title={isPerson ? 'Open commitments' : 'Open actions'} count={d.tasks.length}>
              {d.tasks.slice(0, 8).map((t) => <TaskRow key={t.id} task={t} entityName={t.entityName} sourceTitle={t.sourceTitle} showEntity={!isCompany} />)}
            </Section>
          ) : null}
          {d.loops.length ? (
            <Section title="Open loops" count={d.loops.length} hint={promised.length ? `${promised.length} you promised` : undefined}>
              {d.loops.slice(0, 6).map((l) => <LoopRow key={l.id} loop={l} showCompany={!isCompany} />)}
            </Section>
          ) : null}
          {d.decisions.length ? (
            <Section title="Decisions" count={d.decisions.length}>
              {d.decisions.slice(0, 6).map((x) => <DecisionCard key={x.id} d={x} />)}
            </Section>
          ) : null}
          <Section title={isPerson ? 'Recent interactions' : 'Timeline'}>
            <Timeline events={d.timeline} />
          </Section>
          {d.meetings.length ? (
            <Section title="Meetings" count={d.meetings.length}>
              {d.meetings.slice(0, 6).map((m) => <MeetingRow key={m.id} m={m} />)}
            </Section>
          ) : null}
          <Section title="Related notes" count={d.notes.length}>
            {d.notes.length ? d.notes.slice(0, 12).map((n) => <NoteRow key={n.id} note={n} showEntities={false} />) : <p className="text-[13.5px] text-fg-3">No notes mention {e.name} yet.</p>}
          </Section>
        </div>
        <div className="min-w-0">
          {d.facts.length ? (
            <Section title={isCompany ? 'Commercials & numbers' : 'Important numbers'}>
              <FactList facts={d.facts} />
            </Section>
          ) : null}
          {d.people.length ? (
            <Section title={isPerson ? 'Works with' : 'Key people'}>
              <ul className="space-y-1">
                {d.people.map((p) => (
                  <li key={p.id}>
                    <Link href={`/people/${p.id}`} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 row-hover">
                      <Avatar name={p.name} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px]">{p.name}</span>
                        <span className="block truncate text-[11.5px] text-fg-3">{[p.attributes.role, p.attributes.company].filter(Boolean).join(' · ')}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
          {d.companies.length && !isCompany ? (
            <Section title="Companies">
              <div className="flex flex-wrap gap-1">{d.companies.map((c) => <EntityChip key={c.id} id={c.id} name={c.name} type="company" />)}</div>
            </Section>
          ) : d.companies.length ? (
            <Section title="Related companies">
              <div className="flex flex-wrap gap-1">{d.companies.filter((c) => c.id !== e.id).map((c) => <EntityChip key={c.id} id={c.id} name={c.name} type="company" />)}</div>
            </Section>
          ) : null}
          {d.topics.length ? (
            <Section title="Topics discussed">
              <div className="flex flex-wrap gap-1">{d.topics.map((t) => <EntityChip key={t.id} id={t.id} name={t.name} type="topic" />)}</div>
            </Section>
          ) : null}
          {d.projects.length ? (
            <Section title="Projects">
              <div className="flex flex-wrap gap-1">{d.projects.map((t) => <EntityChip key={t.id} id={t.id} name={t.name} type="project" />)}</div>
            </Section>
          ) : null}
          {e.aliases.length ? (
            <Section title="Also known as">
              <p className="text-[13px] text-fg-2">{e.aliases.join(', ')}</p>
            </Section>
          ) : null}
        </div>
      </div>

      <Panel title={isPerson ? 'Ask about them' : `Ask about ${e.name}`}>
        <PanelSection title="Ask">
          <AskInline entityId={e.id} placeholder={isPerson ? `What have ${e.name.split(' ')[0]} and I discussed?` : `Ask anything about ${e.name}`} suggestions={suggestions} compact />
        </PanelSection>
        {d.loops.length ? (
          <PanelSection title="Owed">
            <ul className="space-y-1 text-[13px]">{d.loops.slice(0, 4).map((l) => <li key={l.id} className="flex gap-2"><span className="text-fg-3">–</span><span>{l.text}</span></li>)}</ul>
          </PanelSection>
        ) : null}
        {d.meetings[0] ? (
          <PanelSection title="Last meeting">
            <Link href={`/meetings/${d.meetings[0].id}`} className="text-[13.5px] hover:text-accent">{d.meetings[0].title}</Link>
            <div className="text-[12px] text-fg-3">{formatDate(d.meetings[0].startsAt)}</div>
          </PanelSection>
        ) : null}
      </Panel>
    </Page>
  )
}

/** Streams in after the rest of the page: uses the stored summary when fresh, otherwise asks the model. */
async function EntitySummary({ d }: { d: EntityDetail }) {
  const summary = await ensureEntitySummary(d)
  return <p className="text-[15px] leading-relaxed">{summary}</p>
}
