'use client'
/*
  Per-row action menus (edit / delete) for every kind of thing the app lists.
  Each one owns its editor dialog so server components can drop it in anywhere.
*/
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/client'
import { RowActions } from './RowActions'
import { TaskEditor, LoopEditor, DecisionEditor, EntityEditor, MeetingEditor, ResearchEditor, FactEditor } from './editors'

type Common = { className?: string; always?: boolean; redirectTo?: string }

function useDelete(path: string, redirectTo?: string) {
  const router = useRouter()
  return React.useCallback(async () => {
    await api(path, { method: 'DELETE' })
    if (redirectTo) router.push(redirectTo)
    router.refresh()
  }, [path, redirectTo, router])
}

export function TaskActions({ task, ...c }: { task: React.ComponentProps<typeof TaskEditor>['task'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/tasks/${task.id}`, c.redirectTo)
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel="Delete task" confirmText="Delete this task?" className={c.className} always={c.always} />
    {edit ? <TaskEditor task={task} onClose={() => setEdit(false)} /> : null}
  </>
}

export function LoopActions({ loop, ...c }: { loop: React.ComponentProps<typeof LoopEditor>['loop'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/commitments/${loop.id}`, c.redirectTo)
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel="Delete loop" confirmText="Delete this open loop?" className={c.className} always={c.always} />
    {edit ? <LoopEditor loop={loop} onClose={() => setEdit(false)} /> : null}
  </>
}

export function DecisionActions({ decision, ...c }: { decision: React.ComponentProps<typeof DecisionEditor>['decision'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/decisions/${decision.id}`, c.redirectTo)
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel="Delete decision" confirmText="Delete this decision and its history? Notes are kept." className={c.className} always={c.always} />
    {edit ? <DecisionEditor decision={decision} onClose={() => setEdit(false)} /> : null}
  </>
}

export function EntityActions({ entity, ...c }: { entity: React.ComponentProps<typeof EntityEditor>['entity'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/entities/${entity.id}`, c.redirectTo)
  const noun = entity.type === 'person' ? 'person' : entity.type === 'company' ? 'company' : entity.type === 'project' ? 'project' : 'topic'
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel={`Delete ${noun}`} confirmText={`Delete ${entity.name}? Notes that mention it are kept; its facts, relations and timeline are removed.`} className={c.className} always={c.always} />
    {edit ? <EntityEditor entity={entity} onClose={() => setEdit(false)} /> : null}
  </>
}

export function MeetingActions({ meeting, ...c }: { meeting: React.ComponentProps<typeof MeetingEditor>['meeting'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/meetings/${meeting.id}`, c.redirectTo)
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel="Delete meeting" confirmText="Delete this meeting? Its notes remain." className={c.className} always={c.always} />
    {edit ? <MeetingEditor meeting={meeting} onClose={() => setEdit(false)} /> : null}
  </>
}

export function ResearchActions({ project, ...c }: { project: React.ComponentProps<typeof ResearchEditor>['project'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/research/${project.id}`, c.redirectTo)
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel="Delete project" confirmText={`Delete "${project.name}"? Its notes are kept and simply unfiled.`} className={c.className} always={c.always} />
    {edit ? <ResearchEditor project={project} onClose={() => setEdit(false)} /> : null}
  </>
}

export function FactActions({ fact, ...c }: { fact: React.ComponentProps<typeof FactEditor>['fact'] } & Common) {
  const [edit, setEdit] = React.useState(false)
  const del = useDelete(`/api/facts/${fact.id}`, c.redirectTo)
  return <>
    <RowActions onEdit={() => setEdit(true)} onDelete={del} deleteLabel="Delete number" confirmText="Delete this observation?" className={c.className} always={c.always} />
    {edit ? <FactEditor fact={fact} onClose={() => setEdit(false)} /> : null}
  </>
}
