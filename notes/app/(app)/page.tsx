import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Page } from '@/components/shell/AppShell'
import { Section, EmptyState } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { getHomeData } from '@/lib/queries'
import { briefLines } from '@/lib/briefing'
import { greeting, formatTime, isToday, formatDate } from '@/lib/util'
import { Briefing } from '@/components/home/Briefing'
import { InsightRow, LoopRow, MeetingRow, NoteRow, TaskRow, EntityIcon } from '@/components/entities'
import { entityHref } from '@/lib/ui-helpers'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const ctx = await getActiveContext()
  const userName = process.env.USER_NAME || 'Harsha'
  const h = await getHomeData(ctx.id)
  const brief = { lines: briefLines(h) }
  const today = h.meetings.filter((m) => isToday(m.startsAt))
  const nextMeeting = h.meetings[0]
  const empty = h.noteCount === 0

  return (
    <Page>
      <div className="mb-6">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em]">{greeting()}, {userName}</h1>
        <p className="mt-1 text-[14px] text-fg-2">{formatDate(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })} · {ctx.name}{nextMeeting ? ` · next: ${nextMeeting.title} ${isToday(nextMeeting.startsAt) ? formatTime(nextMeeting.startsAt) : formatDate(nextMeeting.startsAt, { weekday: 'short' })}` : ''}</p>
      </div>

      {empty ? (
        <EmptyState title="Nothing here yet" description="Capture anything — a thought, a link, a voice note, a meeting. Organization is automatic." action={<Link href="/notes" className="text-[13.5px] font-medium text-accent">Start writing →</Link>} />
      ) : (
        <>
          <div className="mb-8"><Briefing initialLines={brief.lines} /></div>

          <div className="grid gap-x-10 md:grid-cols-[1.4fr_1fr]">
            <div className="min-w-0">
              {today.length || h.meetings.length ? (
                <Section title={today.length ? 'Today' : 'Coming up'} action={<Link href="/meetings" className="rounded-md text-[12.5px] text-fg-3 hover:text-fg pointer-coarse:px-2 pointer-coarse:py-2">All meetings</Link>}>
                  {(today.length ? today : h.meetings.slice(0, 3)).map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <div className="min-w-0 flex-1"><MeetingRow m={m} /></div>
                      <Link href={`/meetings/${m.id}`} className="hidden shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-accent hover:bg-accent-soft sm:inline-flex">Prep <ArrowRight className="h-3 w-3" /></Link>
                    </div>
                  ))}
                </Section>
              ) : null}

              {h.overdue.length || h.dueSoon.length ? (
                <Section title="Actions" count={h.overdue.length + h.dueSoon.length} action={<Link href="/tasks" className="text-[12.5px] text-fg-3 hover:text-fg">All tasks</Link>}>
                  {[...h.overdue, ...h.dueSoon].slice(0, 6).map((t) => <TaskRow key={t.id} task={t} entityName={t.entityName} sourceTitle={t.sourceTitle} />)}
                </Section>
              ) : null}

              <Section title="Open loops" hint="commitments not yet resolved" action={<Link href="/loops" className="text-[12.5px] text-fg-3 hover:text-fg">All open loops</Link>}>
                {h.loops.length ? h.loops.slice(0, 5).map((l) => <LoopRow key={l.id} loop={l} />) : <p className="text-[13.5px] text-fg-3">Nothing unresolved. Rare — enjoy it.</p>}
              </Section>

              <Section title="Continue where you left off" action={<Link href="/notes" className="text-[12.5px] text-fg-3 hover:text-fg">All notes</Link>}>
                {h.recent.map((n) => <NoteRow key={n.id} note={n} />)}
              </Section>
            </div>

            <div className="min-w-0">
              {h.insights.length ? (
                <Section title="Noticed" hint="quietly, from your notes">
                  {h.insights.map((i) => <InsightRow key={i.id} insight={i} />)}
                </Section>
              ) : null}

              {h.changes.length ? (
                <Section title="Changed" hint="facts that moved">
                  <ul className="space-y-1.5 text-[13.5px]">
                    {h.changes.map((c) => (
                      <li key={c.id} className="flex gap-2">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                        <span>
                          {c.description}
                          {c.sourceNoteId ? <Link href={`/notes/${c.sourceNoteId}`} className="ml-1 text-[12px] text-accent hover:underline">source</Link> : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              <Section title="Recently active">
                <ul className="divide-y divide-border">
                  {h.recentEntities.map((e) => (
                    <li key={e.id}>
                      <Link href={entityHref(e.type, e.id)} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 row-hover">
                        <EntityIcon type={e.type} className="h-3.5 w-3.5 text-fg-3" />
                        <span className="min-w-0 flex-1 truncate text-[13.5px]">{e.name}</span>
                        <span className="text-[11.5px] text-fg-3">{e.attributes.status ?? e.attributes.role ?? e.type}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </div>
        </>
      )}
    </Page>
  )
}
