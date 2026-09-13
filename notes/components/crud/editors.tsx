'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui'
import { api } from '@/lib/client'
import { EditDialog, toDateInput, toDateTimeInput, fromDateInput, fromDateTimeInput, type Field } from './EditDialog'

/* ------------------------------------------------------------------ tasks */
const PRIORITY = [{ value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]
export function TaskEditor({ task, onClose }: { task: { id: string; title: string; owner: string; dueAt: Date | string | null; priority: string }; onClose: () => void }) {
  const router = useRouter()
  const fields: Field[] = [{ name: 'title', label: 'Task', required: true }, { name: 'owner', label: 'Owner', placeholder: 'Me' }, { name: 'dueAt', label: 'Due', type: 'date' }, { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY }]
  return <EditDialog title="Edit task" fields={fields} initial={{ title: task.title, owner: task.owner, dueAt: toDateInput(task.dueAt), priority: task.priority }} onClose={onClose} onSubmit={async (v) => { await api(`/api/tasks/${task.id}`, { method: 'PATCH', json: { title: v.title, owner: v.owner || 'Me', dueAt: fromDateInput(v.dueAt, true), priority: v.priority } }); router.refresh() }} />
}

/* ------------------------------------------------------------------ loops */
const LOOP_KINDS = [{ value: 'promised', label: 'I promised' }, { value: 'waiting', label: 'Waiting on someone' }, { value: 'follow_up', label: 'Follow up' }, { value: 'question', label: 'Open question' }]
const loopFields: Field[] = [{ name: 'text', label: 'What', type: 'textarea', required: true, placeholder: 'Send Priya the revised proposal' }, { name: 'kind', label: 'Kind', type: 'select', options: LOOP_KINDS }, { name: 'byWhom', label: 'Who', placeholder: 'Me, or the person you are waiting on' }, { name: 'dueAt', label: 'Due', type: 'date' }, { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY }]
export function LoopEditor({ loop, onClose }: { loop: { id: string; text: string; kind: string; byWhom: string; dueAt?: Date | string | null; priority?: string }; onClose: () => void }) {
  const router = useRouter()
  return <EditDialog title="Edit open loop" fields={loopFields} initial={{ text: loop.text, kind: loop.kind, byWhom: loop.byWhom, dueAt: toDateInput(loop.dueAt), priority: loop.priority ?? 'normal' }} onClose={onClose} onSubmit={async (v) => { await api(`/api/commitments/${loop.id}`, { method: 'PATCH', json: { text: v.text, kind: v.kind, byWhom: v.byWhom, dueAt: fromDateInput(v.dueAt, true), priority: v.priority } }); router.refresh() }} />
}
export function NewLoop() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  return <>
    <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Loop</Button>
    {open ? <EditDialog title="New open loop" submitLabel="Add" fields={loopFields} initial={{ kind: 'promised', priority: 'normal' }} onClose={() => setOpen(false)} onSubmit={async (v) => { await api('/api/commitments', { method: 'POST', json: { text: v.text, kind: v.kind, byWhom: v.byWhom, dueAt: fromDateInput(v.dueAt, true), priority: v.priority } }); router.refresh() }} /> : null}
  </>
}

/* ------------------------------------------------------------------ decisions */
const DECISION_STATUS = ['active', 'proposed', 'revisited', 'superseded', 'reversed'].map((s) => ({ value: s, label: s }))
const decisionFields: Field[] = [{ name: 'title', label: 'Decision', required: true, placeholder: 'Ship in October' }, { name: 'statement', label: 'What exactly was decided', type: 'textarea' }, { name: 'decidedAt', label: 'Decided on', type: 'date' }, { name: 'status', label: 'Status', type: 'select', options: DECISION_STATUS }, { name: 'reasoning', label: 'Why', type: 'textarea' }]
export function DecisionEditor({ decision, onClose }: { decision: { id: string; title: string; statement: string; decidedAt: Date | string; status: string; reasoning?: string | null }; onClose: () => void }) {
  const router = useRouter()
  return <EditDialog title="Edit decision" fields={decisionFields} initial={{ title: decision.title, statement: decision.statement, decidedAt: toDateInput(decision.decidedAt), status: decision.status, reasoning: decision.reasoning ?? '' }} onClose={onClose} onSubmit={async (v) => { await api(`/api/decisions/${decision.id}`, { method: 'PATCH', json: { title: v.title, statement: v.statement || v.title, decidedAt: fromDateInput(v.decidedAt), status: v.status, reasoning: v.reasoning } }); router.refresh() }} />
}
export function NewDecision() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  return <>
    <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Decision</Button>
    {open ? <EditDialog title="Record a decision" submitLabel="Record" fields={decisionFields.filter((f) => f.name !== 'status')} initial={{ decidedAt: toDateInput(new Date()) }} onClose={() => setOpen(false)} onSubmit={async (v) => { const r = await api<{ id: string }>('/api/decisions', { method: 'POST', json: { title: v.title, statement: v.statement, decidedAt: fromDateInput(v.decidedAt), reasoning: v.reasoning } }); router.push(`/decisions/${r.id}`); router.refresh() }} /> : null}
  </>
}

/* ------------------------------------------------------------------ entities */
export type EntityType = 'person' | 'company' | 'topic' | 'project'
const ENTITY_LABEL: Record<EntityType, string> = { person: 'Person', company: 'Company', topic: 'Topic', project: 'Project' }
function entityFields(type: EntityType): Field[] {
  const base: Field[] = [{ name: 'name', label: 'Name', required: true }]
  if (type === 'person') return [...base, { name: 'role', label: 'Role' }, { name: 'company', label: 'Company' }, { name: 'email', label: 'Email' }, { name: 'aliases', label: 'Also known as', help: 'Comma-separated; used to recognise the person in notes.' }]
  if (type === 'company') return [...base, { name: 'status', label: 'Status', placeholder: 'customer, prospect, at risk…' }, { name: 'stage', label: 'Stage' }, { name: 'location', label: 'Location' }, { name: 'aliases', label: 'Also known as', help: 'Comma-separated.' }]
  return [...base, { name: 'summary', label: 'Description', type: 'textarea' }, { name: 'aliases', label: 'Also known as', help: 'Comma-separated.' }]
}
export function EntityEditor({ entity, onClose }: { entity: { id: string; type: string; name: string; attributes: Record<string, string | undefined>; aliases?: string[]; summary?: string | null }; onClose: () => void }) {
  const router = useRouter()
  const type = (entity.type as EntityType) || 'person'
  const fields = entityFields(type)
  const initial: Record<string, string> = { name: entity.name, aliases: (entity.aliases ?? []).join(', '), summary: entity.summary ?? '' }
  for (const [k, v] of Object.entries(entity.attributes ?? {})) if (typeof v === 'string') initial[k] = v
  return <EditDialog title={`Edit ${ENTITY_LABEL[type].toLowerCase()}`} fields={fields} initial={initial} onClose={onClose} onSubmit={async (v) => {
    const attributes: Record<string, string> = { ...(entity.attributes as Record<string, string>) }
    for (const f of fields) if (!['name', 'aliases', 'summary'].includes(f.name)) { { const val = v[f.name]?.trim(); if (val) attributes[f.name] = val; else delete attributes[f.name] } }
    await api(`/api/entities/${entity.id}`, { method: 'PATCH', json: { name: v.name, attributes, aliases: (v.aliases ?? '').split(',').map((a) => a.trim()).filter(Boolean), ...(type === 'topic' || type === 'project' ? { summary: v.summary } : {}) } })
    router.refresh()
  }} />
}
export function NewEntity({ type }: { type: EntityType }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const fields = entityFields(type)
  return <>
    <Button variant="primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {ENTITY_LABEL[type]}</Button>
    {open ? <EditDialog title={`New ${ENTITY_LABEL[type].toLowerCase()}`} submitLabel="Create" fields={fields} onClose={() => setOpen(false)} onSubmit={async (v) => {
      const attributes: Record<string, string> = {}
      for (const f of fields) if (!['name', 'aliases', 'summary'].includes(f.name)) { const val = v[f.name]?.trim(); if (val) attributes[f.name] = val }
      const r = await api<{ id: string }>('/api/entities', { method: 'POST', json: { type, name: v.name, attributes, aliases: v.aliases?.split(',').map((a) => a.trim()).filter(Boolean) } })
      if (v.summary?.trim()) await api(`/api/entities/${r.id}`, { method: 'PATCH', json: { summary: v.summary } })
      router.push(type === 'person' ? `/people/${r.id}` : type === 'company' ? `/companies/${r.id}` : `/topics/${r.id}`)
      router.refresh()
    }} /> : null}
  </>
}

/* ------------------------------------------------------------------ meetings */
export function MeetingEditor({ meeting, onClose }: { meeting: { id: string; title: string; startsAt: Date | string; endsAt?: Date | string | null; location?: string | null }; onClose: () => void }) {
  const router = useRouter()
  const fields: Field[] = [{ name: 'title', label: 'Title', required: true }, { name: 'startsAt', label: 'Starts', type: 'datetime', required: true }, { name: 'endsAt', label: 'Ends', type: 'datetime' }, { name: 'location', label: 'Location' }]
  return <EditDialog title="Edit meeting" fields={fields} initial={{ title: meeting.title, startsAt: toDateTimeInput(meeting.startsAt), endsAt: toDateTimeInput(meeting.endsAt), location: meeting.location ?? '' }} onClose={onClose} onSubmit={async (v) => { await api(`/api/meetings/${meeting.id}`, { method: 'PATCH', json: { title: v.title, startsAt: fromDateTimeInput(v.startsAt), endsAt: fromDateTimeInput(v.endsAt), location: v.location } }); router.refresh() }} />
}

/* ------------------------------------------------------------------ research */
const RESEARCH_STATUS = [{ value: 'active', label: 'Active' }, { value: 'parked', label: 'Parked' }, { value: 'done', label: 'Done' }]
export function ResearchEditor({ project, onClose }: { project: { id: string; name: string; question?: string | null; description?: string | null; status: string }; onClose: () => void }) {
  const router = useRouter()
  const fields: Field[] = [{ name: 'name', label: 'Project', required: true }, { name: 'question', label: 'The question', type: 'textarea' }, { name: 'description', label: 'Description', type: 'textarea' }, { name: 'status', label: 'Status', type: 'select', options: RESEARCH_STATUS }]
  return <EditDialog title="Edit research project" fields={fields} initial={{ name: project.name, question: project.question ?? '', description: project.description ?? '', status: project.status }} onClose={onClose} onSubmit={async (v) => { await api(`/api/research/${project.id}`, { method: 'PATCH', json: { name: v.name, question: v.question, description: v.description, status: v.status } }); router.refresh() }} />
}

/* ------------------------------------------------------------------ facts (numbers) */
const factFields: Field[] = [{ name: 'label', label: 'What it measures', required: true, placeholder: 'ARR' }, { name: 'value', label: 'Value', required: true, placeholder: '$7.6M' }, { name: 'unit', label: 'Unit', placeholder: '$, %, users…' }, { name: 'observedAt', label: 'As of', type: 'date' }]
export function FactEditor({ fact, onClose }: { fact: { id: string; label: string; value: string; unit?: string | null; observedAt: Date | string }; onClose: () => void }) {
  const router = useRouter()
  return <EditDialog title="Edit number" fields={factFields} initial={{ label: fact.label, value: fact.value, unit: fact.unit ?? '', observedAt: toDateInput(fact.observedAt) }} onClose={onClose} onSubmit={async (v) => { await api(`/api/facts/${fact.id}`, { method: 'PATCH', json: { label: v.label, value: v.value, unit: v.unit || null, observedAt: fromDateInput(v.observedAt) } }); router.refresh() }} />
}
export function NewFact({ entities, entityId }: { entities: { id: string; name: string }[]; entityId?: string }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const fields: Field[] = [...(entityId ? [] : [{ name: 'entityId', label: 'About', type: 'select' as const, options: entities.map((e) => ({ value: e.id, label: e.name })), required: true }]), ...factFields]
  return <>
    <Button variant="primary" onClick={() => setOpen(true)} disabled={!entityId && entities.length === 0} title={!entityId && entities.length === 0 ? 'Create a person or company first' : undefined}><Plus className="h-4 w-4" /> Number</Button>
    {open ? <EditDialog title="Add a number" submitLabel="Add" fields={fields} initial={{ entityId: entityId ?? entities[0]?.id ?? '', observedAt: toDateInput(new Date()) }} onClose={() => setOpen(false)} onSubmit={async (v) => { await api('/api/facts', { method: 'POST', json: { entityId: entityId ?? v.entityId, label: v.label, value: v.value, unit: v.unit || undefined, observedAt: fromDateInput(v.observedAt) } }); router.refresh() }} /> : null}
  </>
}
