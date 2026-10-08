import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Page } from '@/components/shell/AppShell'
import { PageHeader, Badge } from '@/components/ui'
import { getActiveScope } from '@/lib/context'
import { buildWeekReview, parseWeekKey, weekKey } from '@/lib/review'
import { ReviewNarrative } from '@/components/review/ReviewNarrative'
import { addDays, formatDate, relativeTime } from '@/lib/util'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'Weekly review' }

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams
  const scope = await getActiveScope()
  const ctx = { name: scope.label }
  const start = parseWeekKey(week)
  const reviewKey = scope.all ? `all:${scope.active.notebookId}` : scope.active.id
  const r = await buildWeekReview(scope.ids, start, reviewKey)
  const prev = weekKey(addDays(start, -7))
  const next = weekKey(addDays(start, 7))
  const isCurrent = weekKey(new Date()) === r.weekStart
  const empty = !r.notes.length && !r.meetings.length && !r.decisions.length && !r.tasksDone.length && !r.tasksAdded.length && !r.changes.length
  return (
    <Page>
      <PageHeader
        title="Weekly review"
        subtitle={`${ctx.name} · what moved, what slipped, and who mattered.`}
        actions={
          <div className="flex items-center gap-1">
            <Link href={`/review?week=${prev}`} className="rounded-md border border-border p-2 text-fg-2 hover:bg-surface-2" aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></Link>
            <span className="min-w-[190px] text-center text-[13.5px] font-medium">{r.label}{isCurrent ? <Badge tone="accent" className="ml-1.5">this week</Badge> : null}</span>
            <Link href={`/review?week=${next}`} className="rounded-md border border-border p-2 text-fg-2 hover:bg-surface-2" aria-label="Next week"><ChevronRight className="h-4 w-4" /></Link>
          </div>
        }
      />
      <ReviewNarrative contextId={reviewKey} week={r.weekStart} narrative={r.narrative ? { text: r.narrative.text, provider: r.narrative.provider, updatedAt: r.narrative.updatedAt.toISOString() } : null} empty={empty} />

      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Notes" value={r.notes.length} sub={`${r.notes.reduce((a, n) => a + n.wordCount, 0)} words`} />
        <Stat label="Meetings" value={r.meetings.length} sub={r.meetings.filter((m) => m.status === 'completed').length ? `${r.meetings.filter((m) => m.status === 'completed').length} held` : undefined} />
        <Stat label="Actions closed" value={r.tasksDone.length} sub={`${r.tasksAdded.length} added`} />
        <Stat label="Decisions moved" value={r.decisions.length} sub={r.changes.length ? `${r.changes.length} numbers changed` : undefined} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Decisions" empty="No decisions moved this week.">
          {r.decisions.map((d) => <li key={d.id}><Link href={`/decisions/${d.decisionId}`} className="hover:text-fg"><Badge tone={d.kind === 'contradicted' ? 'warning' : d.kind === 'proposed' ? 'outline' : 'success'} className="mr-1.5">{d.kind}</Badge>{d.statement}</Link><span className="ml-1.5 text-[12px] text-fg-3">{formatDate(d.occurredAt, { weekday: 'short' })}</span></li>)}
        </Section>
        <Section title="Numbers that changed" empty="No tracked numbers changed.">
          {r.changes.map((c) => <li key={c.id}>{c.description}<span className="ml-1.5 text-[12px] text-fg-3">{formatDate(c.detectedAt, { weekday: 'short' })}</span></li>)}
        </Section>
        <Section title="Meetings" empty="No meetings this week.">
          {r.meetings.map((m) => <li key={m.id}><Link href={`/meetings/${m.id}`} className="hover:text-fg">{m.title}</Link><span className="ml-1.5 text-[12px] text-fg-3">{formatDate(m.startsAt, { weekday: 'short' })} · {m.status}</span></li>)}
        </Section>
        <Section title="Notes captured" empty="Nothing captured this week.">
          {r.notes.map((n) => <li key={n.id}><Link href={`/notes/${n.id}`} className="hover:text-fg">{n.title || 'Untitled'}</Link><span className="ml-1.5 text-[12px] text-fg-3">{formatDate(n.createdAt, { weekday: 'short' })} · {n.wordCount} words</span></li>)}
        </Section>
        <Section title="Closed" empty="No actions were completed.">
          {r.tasksDone.map((t) => <li key={t.id} className="text-fg-2 line-through decoration-border-2">{t.title}<span className="ml-1.5 text-[12px] text-fg-3 no-underline">{t.owner}</span></li>)}
        </Section>
        <Section title="Still overdue" empty="Nothing overdue. Nice." tone="warning">
          {r.overdue.map((t) => <li key={t.id}><Link href="/tasks?view=overdue" className="hover:text-fg">{t.title}</Link><span className="ml-1.5 text-[12px] text-danger">{t.owner}{t.dueAt ? ` · due ${relativeTime(t.dueAt)}` : ''}</span></li>)}
        </Section>
        <Section title="New people and companies" empty="Nobody new this week.">
          {[...r.newPeople, ...r.newCompanies].map((e) => <li key={e.id}><Link href={`/${e.type === 'person' ? 'people' : 'companies'}/${e.id}`} className="hover:text-fg">{e.name}</Link><span className="ml-1.5 text-[12px] text-fg-3">{e.type}</span></li>)}
        </Section>
        <Section title="Open loops older than a week" empty="No aging loops." tone="warning">
          {r.agingLoops.map((l) => <li key={l.id}>{l.noteId ? <Link href={`/notes/${l.noteId}`} className="hover:text-fg">{l.text}</Link> : l.text}<span className="ml-1.5 text-[12px] text-fg-3">{l.kind} · {relativeTime(l.createdAt)}</span></li>)}
        </Section>
      </div>
    </Page>
  )
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return <div className="rounded-xl border border-border bg-surface px-4 py-3"><div className="text-[11.5px] uppercase tracking-[0.06em] text-fg-3">{label}</div><div className="mt-0.5 text-[24px] font-semibold tabular-nums">{value}</div>{sub ? <div className="text-[12px] text-fg-3">{sub}</div> : null}</div>
}

function Section({ title, empty, children, tone }: { title: string; empty: string; children: React.ReactNode[]; tone?: 'warning' }) {
  const has = React.Children.count(children) > 0
  return (
    <section>
      <h2 className={`mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] ${tone === 'warning' && has ? 'text-warning' : 'text-fg-3'}`}>{title}</h2>
      {has ? <ul className="space-y-1.5 text-[13.5px]">{children}</ul> : <p className="text-[13px] text-fg-3">{empty}</p>}
    </section>
  )
}

import * as React from 'react'
