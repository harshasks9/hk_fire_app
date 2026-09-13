'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TagChips } from '@/components/notes/TagChips'
import { Users, Building2, Hash, FolderKanban, FileText, CalendarDays, Mic, Zap, Link2, Image as ImageIcon, FileUp, Mail, Star, Check, ExternalLink, GitBranch, Repeat, CheckSquare, ArrowRight, Sparkles, X, TrendingUp } from 'lucide-react'
import { Badge, Popover, AiMark, Button, useToast, Avatar } from '@/components/ui'
import { api } from '@/lib/client'
import { cx, formatDate, formatDateTime, relativeTime, formatTime } from '@/lib/util'
import type { EntityType } from '@/lib/db/schema'
import { TaskActions, LoopActions, DecisionActions, MeetingActions, FactActions } from '@/components/crud/actions'

/* ---------------------------------------------------------------- entity links */
import { entityHref } from '@/lib/ui-helpers'
export { entityHref }
export function EntityIcon({ type, className }: { type: EntityType | string; className?: string }) {
  const Icon = type === 'person' ? Users : type === 'company' ? Building2 : type === 'project' ? FolderKanban : Hash
  return <Icon className={className ?? 'h-3.5 w-3.5'} />
}
export function EntityChip({ id, name, type, className, subtle }: { id: string; name: string; type: EntityType | string; className?: string; subtle?: boolean }) {
  return (
    <Link href={entityHref(type, id)} className={cx('inline-flex max-w-full items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[12px] font-medium text-fg-2 transition hover:border-border-2 hover:bg-surface-2 hover:text-fg', subtle && 'border-transparent bg-surface-2', className)} title={`${type}: ${name}`}>
      <EntityIcon type={type} className="h-3 w-3 shrink-0 text-fg-3" />
      <span className="truncate">{name}</span>
    </Link>
  )
}
export function EntityChips({ entities, max = 6, className }: { entities: { id: string; name: string; type: EntityType | string }[]; max?: number; className?: string }) {
  if (!entities.length) return null
  return (
    <div className={cx('flex flex-wrap gap-1', className)}>
      {entities.slice(0, max).map((e) => <EntityChip key={e.id} {...e} />)}
      {entities.length > max ? <span className="self-center text-[12px] text-fg-3">+{entities.length - max}</span> : null}
    </div>
  )
}

export function NoteKindIcon({ kind, className }: { kind: string; className?: string }) {
  const Icon = kind === 'meeting' ? CalendarDays : kind === 'voice' ? Mic : kind === 'capture' ? Zap : kind === 'link' ? Link2 : kind === 'screenshot' ? ImageIcon : kind === 'document' ? FileUp : kind === 'email' ? Mail : FileText
  return <Icon className={className ?? 'h-4 w-4'} />
}

/* ---------------------------------------------------------------- trust: source hover */
export function SourceHover({ sourceNoteId, sourceTitle, excerpt, date, children, align = 'start' }: { sourceNoteId?: string | null; sourceTitle?: string | null; excerpt?: string | null; date?: Date | string | null; children: React.ReactNode; align?: 'start' | 'end' }) {
  if (!sourceNoteId) return <>{children}</>
  const href = `/notes/${sourceNoteId}${excerpt ? `?highlight=${encodeURIComponent(excerpt.slice(0, 120))}` : ''}`
  return (
    <Popover align={align} className="w-[320px]" trigger={<span className="cursor-help border-b border-dotted border-fg-3/60">{children}</span>}>
      <div className="text-[12px]">
        <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-fg-3">
          <span>Source</span>
          {date ? <span className="font-medium normal-case tracking-normal">{formatDate(date)}</span> : null}
        </div>
        <div className="truncate font-medium text-fg">{sourceTitle || 'Untitled note'}</div>
        {excerpt ? <blockquote className="mt-1.5 border-l-2 border-border-2 pl-2 text-[12.5px] leading-snug text-fg-2">“{excerpt}”</blockquote> : null}
        <Link href={href} className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline">
          View source <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Popover>
  )
}

/* ---------------------------------------------------------------- tasks */
export interface TaskRowProps { task: { id: string; title: string; owner: string; status: string; priority: string; dueAt: Date | string | null; sourceNoteId: string | null; sourceExcerpt: string | null; aiGenerated?: boolean; completedAt?: Date | string | null }; entityName?: string | null; sourceTitle?: string | null; showEntity?: boolean; highlight?: boolean; compact?: boolean }
export function TaskRow({ task, entityName, sourceTitle, showEntity = true, highlight, compact }: TaskRowProps) {
  const router = useRouter()
  const [status, setStatus] = React.useState(task.status)
  const done = status === 'done'
  const toggle = async () => {
    const next = done ? 'open' : 'done'
    setStatus(next)
    await api(`/api/tasks/${task.id}`, { method: 'PATCH', json: { status: next } })
    router.refresh()
  }
  const setTo = async (s: string) => {
    setStatus(s)
    await api(`/api/tasks/${task.id}`, { method: 'PATCH', json: { status: s } })
    router.refresh()
  }
  const due = task.dueAt ? new Date(task.dueAt) : null
  const overdue = due && !done && due < new Date()
  return (
    <div className={cx('group flex items-start gap-2.5 rounded-lg px-2 py-1.5 row-hover', highlight && 'bg-accent-soft', compact ? '-mx-2' : '-mx-2')} id={`task-${task.id}`}>
      <button onClick={toggle} className={cx('mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition pointer-coarse:mt-0 pointer-coarse:h-6 pointer-coarse:w-6', done ? 'border-accent bg-accent text-accent-fg' : 'border-border-2 hover:border-fg-3')} aria-label={done ? 'Mark open' : 'Mark done'}>
        {done ? <Check className="h-3 w-3" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cx('text-[14px] leading-snug', done && 'text-fg-3 line-through')}>
          <SourceHover sourceNoteId={task.sourceNoteId} sourceTitle={sourceTitle} excerpt={task.sourceExcerpt}>{task.title}</SourceHover>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-fg-3">
          {task.owner && task.owner !== 'Harsha' && task.owner !== 'Me' ? <span className="inline-flex items-center gap-1"><Avatar name={task.owner} size={14} />{task.owner}</span> : null}
          {showEntity && entityName ? <span>{entityName}</span> : null}
          {due ? <span className={cx(overdue && 'font-medium text-danger')}>{overdue ? 'Overdue · ' : 'Due '}{formatDate(due)}</span> : null}
          {task.priority === 'urgent' || task.priority === 'high' ? <Badge tone={task.priority === 'urgent' ? 'danger' : 'warning'}>{task.priority}</Badge> : null}
          {status === 'waiting' ? <Badge>waiting</Badge> : status === 'delegated' ? <Badge>delegated</Badge> : null}
          {task.aiGenerated !== false ? <AiMark label="" className="opacity-60" /> : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
      {!done ? (
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 pointer-coarse:opacity-100">
          {status !== 'waiting' ? <button className="rounded px-1.5 py-0.5 text-[11px] text-fg-3 hover:bg-surface-3 hover:text-fg pointer-coarse:px-2.5 pointer-coarse:py-1.5 pointer-coarse:text-[12.5px]" onClick={() => setTo('waiting')}>Waiting</button> : <button className="rounded px-1.5 py-0.5 text-[11px] text-fg-3 hover:bg-surface-3 hover:text-fg pointer-coarse:px-2.5 pointer-coarse:py-1.5 pointer-coarse:text-[12.5px]" onClick={() => setTo('open')}>Open</button>}
          <button className="rounded px-1.5 py-0.5 text-[11px] text-fg-3 hover:bg-surface-3 hover:text-danger pointer-coarse:px-2.5 pointer-coarse:py-1.5 pointer-coarse:text-[12.5px]" onClick={() => setTo('dropped')}>Drop</button>
        </div>
      ) : null}
      <TaskActions task={task} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- open loops */
export function LoopRow({ loop, showCompany = true, highlight }: { loop: { id: string; text: string; kind: string; byWhom: string; status: string; detectedAt: Date | string; sourceNoteId: string | null; sourceExcerpt: string | null; dueHint?: string | null; companyName?: string | null; counterpartyName?: string | null; sourceTitle?: string | null; ageDays?: number; priority?: string }; showCompany?: boolean; highlight?: boolean }) {
  const router = useRouter()
  const [status, setStatus] = React.useState(loop.status)
  const set = async (s: 'resolved' | 'dismissed' | 'open') => {
    setStatus(s)
    await api(`/api/commitments/${loop.id}`, { method: 'PATCH', json: { status: s } })
    router.refresh()
  }
  const label = loop.kind === 'promised' ? 'You promised' : loop.kind === 'waiting' ? 'Waiting on' : loop.kind === 'question' ? 'Open question' : 'Follow up'
  const tone = loop.kind === 'promised' ? 'accent' : loop.kind === 'waiting' ? 'warning' : 'neutral'
  const age = loop.ageDays ?? Math.floor((Date.now() - new Date(loop.detectedAt).getTime()) / 86400000)
  return (
    <div className={cx('group -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 row-hover', status !== 'open' && 'opacity-50', highlight && 'bg-accent-soft')} id={`loop-${loop.id}`}>
      <Repeat className="mt-1 h-3.5 w-3.5 shrink-0 text-fg-3" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
          <Badge tone={tone as 'accent' | 'warning' | 'neutral'}>{label}{loop.kind === 'waiting' && loop.byWhom && loop.byWhom !== 'Them' ? ` ${loop.byWhom}` : ''}</Badge>
          {showCompany && loop.companyName ? <span className="text-fg-3">{loop.companyName}</span> : null}
          {loop.counterpartyName && loop.kind !== 'waiting' ? <span className="text-fg-3">with {loop.counterpartyName}</span> : null}
          <span className={cx('text-fg-3', age >= 7 && loop.kind === 'promised' && 'font-medium text-danger')}>{age === 0 ? 'today' : `${age}d`}</span>
          {loop.dueHint ? <span className="text-fg-3">· {loop.dueHint}</span> : null}
        </div>
        <div className="mt-0.5 text-[14px] leading-snug">
          <SourceHover sourceNoteId={loop.sourceNoteId} sourceTitle={loop.sourceTitle} excerpt={loop.sourceExcerpt} date={loop.detectedAt}>{loop.text}</SourceHover>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
      {status === 'open' ? (
        <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 pointer-coarse:opacity-100">
          <button className="rounded px-1.5 py-0.5 text-[11px] text-fg-3 hover:bg-surface-3 hover:text-fg pointer-coarse:px-2.5 pointer-coarse:py-1.5 pointer-coarse:text-[12.5px]" onClick={() => set('resolved')}>Resolve</button>
          <button className="rounded px-1.5 py-0.5 text-[11px] text-fg-3 hover:bg-surface-3 hover:text-fg pointer-coarse:px-2.5 pointer-coarse:py-1.5 pointer-coarse:text-[12.5px]" onClick={() => set('dismissed')}>Dismiss</button>
        </div>
      ) : (
        <button className="shrink-0 text-[11px] text-fg-3 hover:text-fg" onClick={() => set('open')}>Reopen</button>
      )}
      <LoopActions loop={loop} />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- insights */
export function InsightRow({ insight, compact }: { insight: { id: string; text: string; kind: string; entityId: string | null; evidence: { noteId: string; title: string }[] }; compact?: boolean }) {
  const router = useRouter()
  const [gone, setGone] = React.useState(false)
  if (gone) return null
  const Icon = insight.kind === 'change' ? TrendingUp : insight.kind === 'overdue' ? Repeat : insight.kind === 'unresolved' ? CheckSquare : Sparkles
  return (
    <div className={cx('group -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-1.5 row-hover', compact && 'py-1')}>
      <Icon className="mt-[3px] h-3.5 w-3.5 shrink-0 text-accent" />
      <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
        {insight.text}
        {insight.evidence.length ? (
          <span className="ml-1.5 inline-flex flex-wrap gap-1 align-baseline">
            {insight.evidence.slice(0, 3).map((e, i) => (
              <Link key={e.noteId + i} href={`/notes/${e.noteId}`} className="text-[11.5px] text-accent hover:underline" title={e.title}>[{i + 1}]</Link>
            ))}
          </span>
        ) : null}
      </div>
      <button className="shrink-0 rounded p-0.5 text-fg-3 opacity-0 transition hover:text-fg group-hover:opacity-100 pointer-coarse:p-1.5 pointer-coarse:opacity-100" title="Dismiss" onClick={async () => { setGone(true); await api(`/api/insights/${insight.id}`, { method: 'PATCH' }); router.refresh() }} aria-label="Dismiss">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

/* ---------------------------------------------------------------- timeline */
export function Timeline({ events, limit = 12 }: { events: { id: string; kind: string; title: string; description: string | null; occurredAt: Date | string; noteId: string | null; meetingId: string | null }[]; limit?: number }) {
  const [showAll, setShowAll] = React.useState(false)
  const list = showAll ? events : events.slice(0, limit)
  if (!events.length) return <p className="text-[13.5px] text-fg-3">Nothing yet. Timelines build themselves as notes arrive.</p>
  return (
    <ol className="relative ml-[5px] border-l border-border pl-5">
      {list.map((e) => {
        const Icon = e.kind === 'meeting' ? CalendarDays : e.kind === 'decision' ? GitBranch : e.kind === 'change' ? TrendingUp : e.kind === 'task' ? CheckSquare : e.kind === 'voice' ? Mic : e.kind === 'capture' ? Zap : FileText
        const href = e.meetingId ? `/meetings/${e.meetingId}` : e.noteId ? `/notes/${e.noteId}` : undefined
        const body = (
          <>
            <div className="flex items-baseline gap-2">
              <span className="w-[52px] shrink-0 text-[12px] tabular-nums text-fg-3">{formatDate(e.occurredAt)}</span>
              <span className={cx('text-[13.5px] leading-snug', href && 'group-hover:text-accent')}>{e.title}</span>
            </div>
            {e.description ? <p className="ml-[60px] mt-0.5 line-clamp-2 text-[12.5px] text-fg-3">{e.description}</p> : null}
          </>
        )
        return (
          <li key={e.id} className="group relative pb-3.5 last:pb-0">
            <span className="absolute -left-[26px] top-[3px] flex h-3.5 w-3.5 items-center justify-center rounded-full bg-bg ring-1 ring-border"><Icon className="h-2.5 w-2.5 text-fg-3" /></span>
            {href ? <Link href={href} className="block">{body}</Link> : body}
          </li>
        )
      })}
      {events.length > limit && !showAll ? (
        <li className="relative">
          <button className="text-[12.5px] text-accent hover:underline" onClick={() => setShowAll(true)}>Show all {events.length}</button>
        </li>
      ) : null}
    </ol>
  )
}

/* ---------------------------------------------------------------- notes list */
export function NoteRow({ note, showEntities = true, dense }: { note: { id: string; title: string; kind: string; updatedAt: Date | string; preview: string; favorite?: boolean; status?: string; entities?: { id: string; name: string; type: EntityType }[]; wordCount?: number; source?: string; tags?: string[] }; showEntities?: boolean; dense?: boolean }) {
  return (
    <Link href={`/notes/${note.id}`} className={cx('group -mx-3 flex items-start gap-3 rounded-lg px-3 row-hover', dense ? 'py-2' : 'py-2.5')}>
      <NoteKindIcon kind={note.kind} className="mt-[3px] h-4 w-4 shrink-0 text-fg-3" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-medium">{note.title || 'Untitled'}</span>
          {note.favorite ? <Star className="h-3 w-3 shrink-0 fill-warning text-warning" /> : null}
          {note.status === 'processing' || note.status === 'inbox' ? <Badge tone="accent">{note.status === 'processing' ? 'AI processing' : 'new'}</Badge> : null}
        </div>
        {!dense && note.preview ? <p className="mt-0.5 line-clamp-1 text-[13px] text-fg-2">{note.preview}</p> : null}
        {showEntities && (note.entities?.length || note.tags?.length) ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {(note.entities ?? []).slice(0, 4).map((e) => <span key={e.id} className="inline-flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-[11.5px] text-fg-2"><EntityIcon type={e.type} className="h-2.5 w-2.5 text-fg-3" />{e.name}</span>)}
            {note.tags?.length ? <TagChips tags={note.tags} max={4} plain /> : null}
          </div>
        ) : null}
      </div>
      <span className="shrink-0 pt-0.5 text-[12px] tabular-nums text-fg-3" suppressHydrationWarning>{relativeTime(note.updatedAt)}</span>
    </Link>
  )
}

/* ---------------------------------------------------------------- meetings */
export function MeetingRow({ m, showStatus }: { m: { id: string; title: string; startsAt: Date | string; endsAt?: Date | string | null; status: string; participants: { id: string; name: string }[]; company: { id: string; name: string } | null; noteSummary?: string | null; location?: string | null }; showStatus?: boolean }) {
  const start = new Date(m.startsAt)
  const today = new Date().toDateString() === start.toDateString()
  return (
    <div className="group -mx-3 flex items-start gap-2 rounded-lg px-3 py-2.5 row-hover">
    <Link href={`/meetings/${m.id}`} className="flex min-w-0 flex-1 items-start gap-4">
      <div className="w-[84px] shrink-0 pt-0.5 text-[12.5px] tabular-nums text-fg-3">
        <div className={cx('font-medium', today && 'text-accent')}>{today ? 'Today' : formatDate(start, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
        <div>{formatTime(start)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-medium group-hover:text-accent">{m.title}</span>
          {showStatus ? <Badge tone={m.status === 'live' ? 'danger' : m.status === 'upcoming' ? 'accent' : 'neutral'}>{m.status}</Badge> : null}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-fg-3">
          {m.participants.length ? (
            <span className="inline-flex items-center gap-1">
              <span className="flex -space-x-1">{m.participants.slice(0, 3).map((p) => <Avatar key={p.id} name={p.name} size={16} className="ring-1 ring-surface" />)}</span>
              {m.participants.slice(0, 3).map((p) => p.name.split(' ')[0]).join(', ')}{m.participants.length > 3 ? ` +${m.participants.length - 3}` : ''}
            </span>
          ) : null}
          {m.company ? <span>· {m.company.name}</span> : null}
          {m.location ? <span>· {m.location}</span> : null}
        </div>
        {m.noteSummary ? <p className="mt-1 line-clamp-1 text-[13px] text-fg-2">{m.noteSummary}</p> : null}
      </div>
    </Link>
    <MeetingActions meeting={m} className="mt-0.5" />
    </div>
  )
}

/* ---------------------------------------------------------------- decisions */
export function DecisionCard({ d, compact }: { d: { id: string; title: string; statement: string; decidedAt: Date | string; status: string; revisions?: number; topicName?: string | null; companyName?: string | null; sourceNoteId?: string | null; sourceExcerpt?: string | null; sourceTitle?: string | null }; compact?: boolean }) {
  const tone = d.status === 'active' ? 'success' : d.status === 'revisited' || d.status === 'proposed' ? 'warning' : 'neutral'
  return (
    <div className={cx('group relative -mx-3 rounded-lg px-3 row-hover', compact ? 'py-2' : 'py-2.5')}>
    <Link href={`/decisions/${d.id}`} className="block pr-8">
      <div className="flex items-center gap-2">
        <GitBranch className="h-3.5 w-3.5 shrink-0 text-fg-3" />
        <span className="truncate text-[14px] font-medium group-hover:text-accent">{d.title}</span>
        <Badge tone={tone as 'success' | 'warning' | 'neutral'}>{d.status}</Badge>
        {d.revisions && d.revisions > 1 ? <span className="text-[11.5px] text-fg-3">{d.revisions} revisions</span> : null}
      </div>
      {!compact ? <p className="ml-[22px] mt-0.5 line-clamp-2 text-[13px] text-fg-2">{d.statement}</p> : null}
      <div className="ml-[22px] mt-0.5 flex flex-wrap gap-x-2 text-[12px] text-fg-3">
        <span>{formatDate(d.decidedAt)}</span>
        {d.topicName ? <span>· {d.topicName}</span> : null}
        {d.companyName ? <span>· {d.companyName}</span> : null}
      </div>
    </Link>
    <DecisionActions decision={d} className={cx('absolute right-2', compact ? 'top-1.5' : 'top-2')} />
    </div>
  )
}

/* ---------------------------------------------------------------- facts */
export function FactList({ facts, showEntity }: { facts: { id: string; label: string; value: string; unit?: string | null; observedAt: Date | string; sourceNoteId: string | null; sourceExcerpt: string | null; sourceTitle?: string | null; entityName?: string }[]; showEntity?: boolean }) {
  if (!facts.length) return <p className="text-[13px] text-fg-3">No numbers captured yet.</p>
  return (
    <ul className="text-[13.5px]">
      {facts.map((f) => (
        <li key={f.id} className="group -mx-2 flex items-baseline gap-3 rounded-md px-2 py-1 row-hover">
          <span className="min-w-0 truncate text-fg-2">{showEntity && f.entityName ? `${f.entityName} · ` : ''}{f.label}</span>
          <span className="ml-auto shrink-0 font-medium tabular-nums">
            <SourceHover sourceNoteId={f.sourceNoteId} sourceTitle={f.sourceTitle} excerpt={f.sourceExcerpt} date={f.observedAt} align="end">{f.value}</SourceHover>
          </span>
          <FactActions fact={f} className="-my-1 self-center" />
        </li>
      ))}
    </ul>
  )
}

/* ---------------------------------------------------------------- AI summary block */
export function AiSummary({ summary, defaultOpen = true, sourceNoteId, compact }: { summary: { summary: string[]; decisions: string[]; actions: string[]; risks: string[]; numbers: string[]; questions?: string[]; generatedAt: string; provider: string }; defaultOpen?: boolean; sourceNoteId?: string; compact?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const groups: [string, string[]][] = [['Decisions', summary.decisions], ['Actions', summary.actions], ['Risks', summary.risks], ['Important numbers', summary.numbers], ['Open questions', summary.questions ?? []]]
  return (
    <div className={cx('rounded-xl border border-dashed border-accent-soft-2 bg-accent-soft/40', compact ? 'px-3 py-2' : 'px-4 py-3')}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-accent"><Sparkles className="h-3.5 w-3.5" /> Summary</span>
        <span className="text-[11.5px] text-fg-3" suppressHydrationWarning>{summary.provider === 'local' ? 'heuristic' : summary.provider} · {relativeTime(summary.generatedAt)} · {open ? 'hide' : 'show'}</span>
      </button>
      {open ? (
        <div className="mt-2 space-y-3">
          <ul className="list-disc space-y-1 pl-5 text-[14px] leading-snug">{summary.summary.map((s, i) => <li key={i}>{s}</li>)}</ul>
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {groups.filter(([, xs]) => xs.length).map(([label, xs]) => (
              <div key={label}>
                <div className="mb-0.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">{label}</div>
                <ul className="space-y-0.5 text-[13.5px] leading-snug">{xs.map((x, i) => <li key={i} className="flex gap-1.5"><span className="text-fg-3">–</span><span>{x}</span></li>)}</ul>
              </div>
            ))}
          </div>
          <p className="text-[11.5px] text-fg-3">AI interpretation. The raw note below is untouched{sourceNoteId ? '' : ''}.</p>
        </div>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- generate outputs */
import { OUTPUT_TYPES, type OutputType } from '@/lib/ai/types'
import { Markdown, CopyButton } from '@/components/ui'
export function GenerateMenu({ target, className }: { target: { type: 'note' | 'meeting' | 'entity' | 'decision'; id: string }; className?: string }) {
  const [open, setOpen] = React.useState(false)
  const [result, setResult] = React.useState<{ text: string; label: string; provider: string } | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const toast = useToast()
  const run = async (type: OutputType) => {
    setBusy(type)
    try {
      const r = await api<{ text: string; label: string; provider: string }>('/api/ai/generate', { method: 'POST', json: { type, target } })
      setResult(r)
      setOpen(false)
    } catch (e) {
      toast.push({ text: String(e), tone: 'danger' })
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className={className}>
      <div className="relative inline-flex">
        <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}><Sparkles className="h-3.5 w-3.5 text-accent" /> Generate</Button>
        {open ? (
          <div className="animate-pop absolute right-0 top-full z-40 mt-1 w-64 rounded-xl border border-border bg-surface p-1 shadow-pop" onMouseLeave={() => setOpen(false)}>
            {OUTPUT_TYPES.map((o) => (
              <button key={o.id} onClick={() => run(o.id)} disabled={Boolean(busy)} className="flex w-full flex-col rounded-lg px-2.5 py-1.5 text-left hover:bg-surface-2 disabled:opacity-50">
                <span className="text-[13.5px]">{busy === o.id ? 'Generating…' : o.label}</span>
                <span className="text-[11.5px] text-fg-3">{o.hint}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {result ? (
        <div className="animate-up mt-3 rounded-xl border border-dashed border-accent-soft-2 bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <AiMark label={`${result.label} · ${result.provider}`} />
            <div className="flex items-center gap-1">
              <CopyButton text={result.text} />
              <Button size="sm" variant="ghost" onClick={() => setResult(null)}><X className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <Markdown text={result.text} />
        </div>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- pin toggle */
export function PinButton({ id, pinned }: { id: string; pinned: boolean }) {
  const [p, setP] = React.useState(pinned)
  const router = useRouter()
  return (
    <Button size="sm" variant="ghost" onClick={async () => { setP(!p); await api(`/api/entities/${id}`, { method: 'PATCH', json: { pinned: !p } }); router.refresh() }} title={p ? 'Unpin from sidebar' : 'Pin to sidebar'}>
      <Star className={cx('h-3.5 w-3.5', p && 'fill-warning text-warning')} /> {p ? 'Pinned' : 'Pin'}
    </Button>
  )
}

export function ExternalIcon() {
  return <ExternalLink className="h-3 w-3" />
}

export { formatDateTime }
