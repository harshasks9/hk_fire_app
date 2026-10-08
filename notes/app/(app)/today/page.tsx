import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, GitBranch } from 'lucide-react'
import { Page } from '@/components/shell/AppShell'
import { Section, Badge, EmptyState } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { dayKey, dayLabel, getDayData, parseDayKey, readerTimeZone, shiftDay } from '@/lib/today'
import { DailyNote } from '@/components/today/DailyNote'
import { TimeZoneCookie } from '@/components/today/TimeZoneCookie'
import { LoopRow, MeetingRow, NoteRow, TaskRow } from '@/components/entities'
import { cx, formatTime, isToday as isTodayDate } from '@/lib/util'

export const dynamic = 'force-dynamic'

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { d: wanted } = await searchParams
  const [scope, tz] = await Promise.all([getActiveScope(), readerTimeZone()])
  const day = parseDayKey(wanted, tz)
  const data = await getDayData(scope.ids, day, tz, scope.active.id)
  const nameOf = (id: string) => (scope.all ? scope.nameOf(id) : undefined)
  const todayKey = dayKey(new Date(), tz)
  const rel = day === todayKey ? 'Today' : day === shiftDay(todayKey, -1) ? 'Yesterday' : day === shiftDay(todayKey, 1) ? 'Tomorrow' : null
  const empty = !data.journal && !data.meetings.length && !data.tasksDue.length && !data.overdue.length && !data.completed.length && !data.captured.length && !data.decisions.length && !data.changes.length && !data.loops.length
  const href = (k: string) => (k === todayKey ? '/today' : `/today?d=${k}`)
  return (
    <Page>
      <TimeZoneCookie current={tz} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-semibold tracking-[-0.02em]">{rel ?? dayLabel(day, { weekday: 'long' })}</h1>
          <p className="mt-1 text-[14px] text-fg-2">{dayLabel(day, { weekday: rel ? 'long' : undefined, month: 'long', day: 'numeric', year: 'numeric' })} · {scope.label}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Link href={href(shiftDay(day, -1))} className="rounded-md border border-border p-2 text-fg-2 hover:bg-surface-2" aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></Link>
          {day !== todayKey ? <Link href="/today" className="rounded-md border border-border px-3 py-1.5 text-[13px] font-medium hover:bg-surface-2">Today</Link> : <Badge tone="accent">today</Badge>}
          <Link href={href(shiftDay(day, 1))} className="rounded-md border border-border p-2 text-fg-2 hover:bg-surface-2" aria-label="Next day"><ChevronRight className="h-4 w-4" /></Link>
        </div>
      </div>

      <nav className="mb-8 grid grid-cols-7 gap-1" aria-label="This week">
        {data.week.map((w) => {
          const active = w.day === day
          return (
            <Link key={w.day} href={href(w.day)} className={cx('flex flex-col items-center rounded-lg border px-1 py-2 text-center transition-colors', active ? 'border-accent bg-accent-soft text-fg' : 'border-border text-fg-2 hover:bg-surface-2', w.day === todayKey && !active && 'border-border-2 font-medium text-fg')}>
              <span className="text-[11px] uppercase tracking-[0.05em] text-fg-3">{dayLabel(w.day, { weekday: 'short' })}</span>
              <span className="text-[15px] font-medium">{dayLabel(w.day, { day: 'numeric' })}</span>
              <span className={cx('mt-1 h-1.5 w-1.5 rounded-full', w.notes ? 'bg-accent' : 'bg-transparent')} title={w.notes ? `${w.notes} notes` : undefined} />
            </Link>
          )
        })}
      </nav>

      <div className="grid gap-x-10 md:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <Section title="Journal" hint={data.journal ? undefined : 'your daily note'}>
            <DailyNote day={day} isToday={data.isToday} note={data.journal ? { id: data.journal.id, title: data.journal.title, contentJson: data.journal.contentJson } : null} contextName={scope.active.name} />
          </Section>

          {data.captured.length ? (
            <Section title={data.isToday ? 'Captured today' : 'Captured'} count={data.captured.length} action={<Link href="/notes" className="text-[12.5px] text-fg-3 hover:text-fg">All notes</Link>}>
              {data.captured.map((n) => <NoteRow key={n.id} note={n} contextName={nameOf(n.contextId)} />)}
            </Section>
          ) : null}

          {empty ? <EmptyState title="Nothing recorded on this day" description="Meetings, tasks due, notes captured, decisions and numbers that changed show up here as they happen." /> : null}
        </div>

        <div className="min-w-0">
          {data.meetings.length ? (
            <Section title="Schedule" count={data.meetings.length} action={<Link href="/meetings" className="text-[12.5px] text-fg-3 hover:text-fg">All meetings</Link>}>
              {data.meetings.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1"><MeetingRow m={m} contextName={nameOf(m.contextId)} showStatus /></div>
                  {m.status === 'upcoming' && isTodayDate(m.startsAt) ? <Link href={`/meetings/${m.id}`} className="hidden shrink-0 items-center gap-1 rounded-md border border-border px-2 py-1 text-[12px] text-accent hover:bg-accent-soft sm:inline-flex">Prep <ArrowRight className="h-3 w-3" /></Link> : null}
                </div>
              ))}
            </Section>
          ) : null}

          {data.overdue.length || data.tasksDue.length ? (
            <Section title={data.isToday ? 'Due' : 'Was due'} count={data.overdue.length + data.tasksDue.length} action={<Link href="/tasks" className="text-[12.5px] text-fg-3 hover:text-fg">All tasks</Link>}>
              {data.overdue.length ? <p className="mb-1 text-[11.5px] font-medium uppercase tracking-[0.06em] text-danger">Overdue</p> : null}
              {data.overdue.map((t) => <TaskRow key={t.id} task={t} entityName={t.entityName} sourceTitle={t.sourceTitle} contextName={nameOf(t.contextId)} />)}
              {data.overdue.length && data.tasksDue.length ? <p className="mb-1 mt-3 text-[11.5px] font-medium uppercase tracking-[0.06em] text-fg-3">Today</p> : null}
              {data.tasksDue.map((t) => <TaskRow key={t.id} task={t} entityName={t.entityName} sourceTitle={t.sourceTitle} contextName={nameOf(t.contextId)} />)}
            </Section>
          ) : null}

          {data.completed.length ? (
            <Section title="Done" count={data.completed.length}>
              {data.completed.map((t) => <TaskRow key={t.id} task={t} entityName={t.entityName} sourceTitle={t.sourceTitle} contextName={nameOf(t.contextId)} compact />)}
            </Section>
          ) : null}

          {data.decisions.length ? (
            <Section title="Decided">
              <ul className="space-y-1.5 text-[13.5px]">
                {data.decisions.map((d) => (
                  <li key={d.id}>
                    <Link href={`/decisions/${d.id}`} className="-mx-2 flex items-start gap-2 rounded-lg px-2 py-1 row-hover">
                      <GitBranch className="mt-1 h-3.5 w-3.5 shrink-0 text-fg-3" />
                      <span className="min-w-0 flex-1">{d.title}{d.topicName ? <span className="ml-1.5 text-[12px] text-fg-3">{d.topicName}</span> : null}</span>
                      <span className="text-[11.5px] text-fg-3">{formatTime(d.decidedAt)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {data.changes.length ? (
            <Section title="Changed" hint="facts that moved">
              <ul className="space-y-1.5 text-[13.5px]">
                {data.changes.map((c) => (
                  <li key={c.id} className="flex gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    <span>{c.description}{c.sourceNoteId ? <Link href={`/notes/${c.sourceNoteId}`} className="ml-1 text-[12px] text-accent hover:underline">source</Link> : null}</span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {data.loops.length ? (
            <Section title={data.isToday ? 'Getting stale' : 'Open loops from this day'} hint={data.isToday ? 'open for a week or more' : undefined} action={<Link href="/loops" className="text-[12.5px] text-fg-3 hover:text-fg">All open loops</Link>}>
              {data.loops.map((l) => <LoopRow key={l.id} loop={l} contextName={nameOf(l.contextId)} />)}
            </Section>
          ) : null}
        </div>
      </div>
    </Page>
  )
}
