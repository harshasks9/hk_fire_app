import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Page } from '@/components/shell/AppShell'
import { Section, Badge, Avatar, AiMark, Skeleton } from '@/components/ui'
import { Panel, PanelSection } from '@/components/shell/IntelligencePanel'
import { getMeeting } from '@/lib/queries'
import { meetingPrep } from '@/lib/prep'
import { MeetingDetailActions } from '@/components/meetings/MeetingDetailActions'
import { Transcript } from '@/components/meetings/Transcript'
import { IngestBanner } from '@/components/meetings/IngestBanner'
import { TagChips } from '@/components/notes/TagChips'
import { AiSummary, TaskRow, LoopRow, FactList, DecisionCard, MeetingRow, EntityChip } from '@/components/entities'
import { AskInline } from '@/components/ask/AskInline'
import { formatDate, formatTime, isToday } from '@/lib/util'
import { MapPin, Users, FileAudio, Share2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getMeeting(id)
  if (!d) notFound()
  const m = d.meeting
  const upcoming = m.status !== 'completed'
  const note = d.note
  const summary = m.summary ?? note?.note.summary ?? null
  return (
    <Page>
      <header className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[12.5px] text-fg-3">
              <span className={isToday(m.startsAt) ? 'font-medium text-accent' : ''}>{isToday(m.startsAt) ? 'Today' : formatDate(m.startsAt, { weekday: 'long', month: 'long', day: 'numeric' })} · {formatTime(m.startsAt)}{m.endsAt ? `–${formatTime(m.endsAt)}` : ''}</span>
              {m.location ? <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span> : null}
              <Badge tone={m.status === 'live' ? 'danger' : m.status === 'upcoming' ? 'accent' : 'neutral'}>{m.status}</Badge>
              <Link href={`/graph?focus=meeting:${m.id}`} className="inline-flex items-center gap-1 hover:text-fg"><Share2 className="h-3 w-3" /> graph</Link>
            </div>
            <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">{m.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {m.company ? <EntityChip id={m.company.id} name={m.company.name} type="company" /> : null}
              {m.participants.map((p) => (
                <Link key={p.id} href={`/people/${p.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-[12px] font-medium text-fg-2 hover:bg-surface-2 hover:text-fg"><Avatar name={p.name} size={16} />{p.name}</Link>
              ))}
              {!m.participants.length ? <span className="inline-flex items-center gap-1 text-[12.5px] text-fg-3"><Users className="h-3.5 w-3.5" /> Participants are detected from notes</span> : null}
              {note && (note.note.tags?.length || note.note.manualTags?.length) ? <TagChips tags={[...(note.note.manualTags ?? []), ...(note.note.tags ?? [])]} max={8} /> : null}
            </div>
          </div>
        </div>
        <div className="mt-4"><MeetingDetailActions meetingId={m.id} status={m.status} noteId={m.noteId} followUpEmail={m.followUpEmail} executiveReadout={m.executiveReadout} meeting={{ title: m.title, startsAt: m.startsAt, endsAt: m.endsAt, location: m.location }} /></div>
      </header>

      {m.ingestStatus && m.ingestStatus !== 'done' ? <IngestBanner initial={{ meetingId: m.id, noteId: m.noteId, title: m.title, status: m.ingestStatus, error: m.ingestError, stageAt: m.ingestStageAt?.toISOString() ?? null, hasRecording: Boolean(m.recordingAttachmentId) }} /> : null}
      {m.recordingAttachmentId ? (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border px-4 py-3">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-fg-2"><FileAudio className="h-4 w-4 text-accent" /> Recording{m.durationSeconds ? <span className="text-fg-3"> · {Math.round(m.durationSeconds / 60)} min</span> : null}</span>
          <audio controls preload="none" src={`/api/attachments/${m.recordingAttachmentId}`} className="h-9 min-w-0 flex-1" />
        </div>
      ) : null}

      {upcoming ? (
        <Suspense fallback={<div className="mb-8 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-5 py-4"><AiMark label="Meeting prep" className="mb-2" /><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div></div>}>
          <MeetingPrepSection meetingId={id} />
        </Suspense>
      ) : null}

      {summary ? <div className="mb-8"><AiSummary summary={summary} /></div> : null}

      {note ? (
        <div className="grid gap-x-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            {note.note.summary?.keyPoints?.length ? (
              <Section title="Key discussion points"><ul className="list-disc space-y-1 pl-5 text-[14px]">{note.note.summary.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul></Section>
            ) : null}
            {note.decisions.length ? <Section title="Decisions">{note.decisions.map((x) => <DecisionCard key={x.id} d={x} />)}</Section> : null}
            {note.tasks.length ? <Section title="Action items">{note.tasks.map((t) => <TaskRow key={t.id} task={t} sourceTitle={m.title} showEntity={false} />)}</Section> : null}
            {note.commitments.length ? <Section title="Questions & unresolved">{note.commitments.map((c) => <LoopRow key={c.id} loop={{ ...c, sourceTitle: m.title }} showCompany={false} />)}</Section> : null}
            {d.transcript ? (
              <Section title="Transcript" hint={Object.keys(d.transcript.speakerMap ?? {}).length ? `speakers identified: ${Object.entries(d.transcript.speakerMap).map(([k, v]) => `${k} → ${v}`).join(', ')}` : undefined}>
                <Transcript segments={d.transcript.segments} text={d.transcript.text} />
              </Section>
            ) : null}
            <Section title="Notes" action={<Link href={`/notes/${note.note.id}`} className="text-[12.5px] text-accent hover:underline">Open in editor</Link>}>
              <div className="prose-static rounded-xl border border-border px-4 py-3 text-[14px] text-fg-2">
                {note.note.contentText.split('\n').filter(Boolean).slice(0, 14).map((l, i) => <p key={i}>{l}</p>)}
                {note.note.contentText.split('\n').filter(Boolean).length > 14 ? <Link href={`/notes/${note.note.id}`} className="text-accent">Read more →</Link> : null}
              </div>
            </Section>
          </div>
          <div className="min-w-0">
            {note.facts.length ? <Section title="Important numbers"><FactList facts={note.facts.map((f) => ({ ...f, sourceTitle: m.title }))} showEntity /></Section> : null}
            {d.history.length ? <Section title="Related historical meetings">{d.history.map((h) => <MeetingRow key={h.id} m={h} />)}</Section> : null}
            {note.entities.length ? <Section title="Entities"><div className="flex flex-wrap gap-1">{note.entities.map((e) => <EntityChip key={e.id} id={e.id} name={e.name} type={e.type} />)}</div></Section> : null}
          </div>
        </div>
      ) : upcoming ? (
        <div>
          {d.history.length ? <Section title="Previous meetings">{d.history.map((h) => <MeetingRow key={h.id} m={h} />)}</Section> : null}
        </div>
      ) : null}

      <Panel title="Ask about this meeting">
        <PanelSection title="Ask">
          <AskInline noteIds={note ? [note.note.id, ...d.history.map((h) => h.noteId).filter((x): x is string => Boolean(x))] : undefined} entityId={!note ? m.company?.id : undefined} placeholder="What did they ask for?" suggestions={['What did we decide?', 'What do I owe them?', 'What changed since last time?']} compact />
        </PanelSection>
      </Panel>
    </Page>
  )
}

function PrepBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{title}</div>
      <ul className="space-y-0.5 text-[13.5px] leading-snug">{children}</ul>
    </div>
  )
}

/** Prep streams in after the header so the page is usable while the model writes the narrative. */
async function MeetingPrepSection({ meetingId }: { meetingId: string }) {
  const prep = await meetingPrep(meetingId)
  if (!prep) return null
  return (
        <div className="mb-8 rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40 px-5 py-4">
          <AiMark label="Meeting prep" className="mb-2" />
          {prep.narrative ? <p className="mb-4 text-[15px] leading-relaxed">{prep.narrative}</p> : null}
          <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <PrepBlock title="Who am I meeting?">
              {prep.people.length ? prep.people.map((p) => <li key={p.id}><Link href={`/people/${p.id}`} className="font-medium hover:text-accent">{p.name}</Link>{p.attributes.role ? <span className="text-fg-2"> — {p.attributes.role}</span> : null}</li>) : <li className="text-fg-3">No participants listed yet.</li>}
            </PrepBlock>
            <PrepBlock title="What did we discuss last time?">
              {prep.lastMeeting ? (<><li><Link href={`/meetings/${prep.lastMeeting.id}`} className="font-medium hover:text-accent">{prep.lastMeeting.title}</Link> <span className="text-fg-3">· {formatDate(prep.lastMeeting.startsAt)}</span></li>{prep.lastSummary.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}</>) : <li className="text-fg-3">First conversation on record.</li>}
            </PrepBlock>
            <PrepBlock title="What did they ask for?">
              {prep.theyAsked.length ? prep.theyAsked.slice(0, 4).map((l) => <li key={l.id}>{l.text}</li>) : <li className="text-fg-3">Nothing outstanding.</li>}
            </PrepBlock>
            <PrepBlock title="What did I promise?">
              {prep.iPromised.length ? prep.iPromised.slice(0, 4).map((l) => <li key={l.id} className={l.ageDays >= 5 ? 'text-danger' : ''}>{l.text} <span className="text-fg-3">· {l.ageDays}d</span></li>) : <li className="text-fg-3">Nothing open.</li>}
            </PrepBlock>
            <PrepBlock title="What remains unresolved?">
              {prep.unresolved.length ? prep.unresolved.slice(0, 5).map((t) => <li key={t.id}>{t.owner}: {t.title}</li>) : <li className="text-fg-3">No open actions.</li>}
            </PrepBlock>
            <PrepBlock title="What changed since then?">
              {prep.changes.length ? prep.changes.map((c) => <li key={c.id}>{c.description}</li>) : <li className="text-fg-3">No facts changed.</li>}
              {prep.decisions.filter((x) => x.status !== 'active').map((x) => <li key={x.id}>Decision open: {x.title}</li>)}
            </PrepBlock>
            <PrepBlock title="What should I ask?">
              {prep.questions.map((q, i) => <li key={i}>{q}</li>)}
            </PrepBlock>
            {prep.numbers.length ? (
              <PrepBlock title="Numbers to have in hand">
                {prep.numbers.map((n, i) => <li key={i}>{n.label}: <span className="font-medium tabular-nums">{n.value}</span></li>)}
              </PrepBlock>
            ) : null}
          </div>
        </div>
  )
}
