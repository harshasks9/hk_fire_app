/*
  Note templates. Built-ins ship with the app; notebooks add their own by
  saving a note as a template. Bodies are stored as { title?, doc } where doc is
  editor JSON; {{date}}, {{time}}, {{weekday}}, {{notebook}} and {{name}} are
  filled in when a note is created from the template.
*/
import { and, asc, desc, eq, isNull, or } from 'drizzle-orm'
import { getDb, schema } from './db'
import { markdownToDoc, type PMNode } from './markdown'
import { uid } from './util'
import type { NoteKind, Template } from './db/schema'

export interface TemplateBody { title?: string; doc: PMNode }

interface BuiltIn { id: string; name: string; description: string; icon: string; kind: NoteKind; title: string; markdown: string }

export const BUILT_IN_TEMPLATES: BuiltIn[] = [
  { id: 'tpl_meeting', name: 'Meeting notes', description: 'Agenda, discussion, decisions and actions. Attendees become people; actions become tasks.', icon: 'calendar', kind: 'meeting', title: '{{title}} — {{date}}', markdown: '**Attendees:** \n**Purpose:** \n\n## Agenda\n- \n\n## Discussion\n- \n\n## Decisions\n- Decision: \n\n## Actions\n- [ ] @Name to … by …\n\n## Open questions\n- ' },
  { id: 'tpl_1on1', name: '1:1', description: 'A recurring one-to-one: how they are doing, what is blocked, what you promised.', icon: 'users', kind: 'meeting', title: '1:1 with {{title}} — {{date}}', markdown: '## How are things\n- \n\n## Wins since last time\n- \n\n## Blockers\n- \n\n## Feedback (both ways)\n- \n\n## Actions\n- [ ] I will …\n- [ ] They will …' },
  { id: 'tpl_decision', name: 'Decision record', description: 'What was decided, why, what else was considered and when to revisit.', icon: 'git-branch', kind: 'note', title: 'Decision: {{title}}', markdown: '## Context\n\n\n## Decision\nDecision: \n\n## Reasoning\n- \n\n## Alternatives considered\n- \n\n## Consequences and risks\n- Risk: \n\n## Revisit when\n- ' },
  { id: 'tpl_weekly', name: 'Weekly review', description: 'Look back, look ahead: what moved, what slipped, what matters next week.', icon: 'calendar-range', kind: 'note', title: 'Weekly review — week of {{date}}', markdown: '## What moved this week\n- \n\n## What slipped\n- \n\n## Decisions made\n- \n\n## People I need to follow up with\n- \n\n## Next week, the three things that matter\n1. \n2. \n3. ' },
  { id: 'tpl_project', name: 'Project brief', description: 'Goal, scope, owners, milestones and risks on one page.', icon: 'flask', kind: 'note', title: '{{title}} — brief', markdown: '## Goal\n\n\n## Why now\n\n\n## Scope\n**In:** \n**Out:** \n\n## Owners\n- \n\n## Milestones\n- [ ] … by …\n\n## Risks\n- Risk: \n\n## Open questions\n- ' },
  { id: 'tpl_customer', name: 'Customer call', description: 'Who, what they need, numbers mentioned, commitments and next steps.', icon: 'building', kind: 'meeting', title: '{{title}} — call — {{date}}', markdown: '**Company:** \n**People:** \n\n## What they need\n- \n\n## Numbers and terms mentioned\n- \n\n## What we promised\n- I will … by …\n\n## What they promised\n- \n\n## Next step\n- [ ] ' },
  { id: 'tpl_journal', name: 'Daily journal', description: 'A short daily entry: energy, gratitude, what happened, what is on your mind.', icon: 'pen', kind: 'note', title: '{{weekday}}, {{date}}', markdown: '**Energy:** \n**Grateful for:** \n\n## What happened\n- \n\n## On my mind\n- \n\n## Tomorrow\n- [ ] ' },
]

const cachedBuiltIns = new Map<string, TemplateBody>()
export function builtInBody(id: string): TemplateBody | null {
  const b = BUILT_IN_TEMPLATES.find((t) => t.id === id)
  if (!b) return null
  let body = cachedBuiltIns.get(id)
  if (!body) {
    body = { title: b.title, doc: markdownToDoc(b.markdown) }
    cachedBuiltIns.set(id, body)
  }
  return body
}

export interface TemplateSummary { id: string; name: string; description: string | null; icon: string | null; kind: NoteKind; builtIn: boolean; updatedAt?: string }

export async function listTemplates(notebookId: string): Promise<TemplateSummary[]> {
  const db = await getDb()
  const custom = await db.select().from(schema.templates).where(eq(schema.templates.notebookId, notebookId)).orderBy(asc(schema.templates.position), desc(schema.templates.updatedAt))
  return [
    ...custom.map((t) => ({ id: t.id, name: t.name, description: t.description, icon: t.icon, kind: t.kind, builtIn: false, updatedAt: t.updatedAt.toISOString() })),
    ...BUILT_IN_TEMPLATES.map((t) => ({ id: t.id, name: t.name, description: t.description, icon: t.icon, kind: t.kind, builtIn: true })),
  ]
}

export async function getTemplate(notebookId: string, id: string): Promise<{ summary: TemplateSummary; body: TemplateBody } | null> {
  const b = BUILT_IN_TEMPLATES.find((t) => t.id === id)
  if (b) return { summary: { id: b.id, name: b.name, description: b.description, icon: b.icon, kind: b.kind, builtIn: true }, body: builtInBody(id)! }
  const db = await getDb()
  const t = (await db.select().from(schema.templates).where(and(eq(schema.templates.id, id), or(eq(schema.templates.notebookId, notebookId), isNull(schema.templates.notebookId)))))[0]
  if (!t) return null
  return { summary: { id: t.id, name: t.name, description: t.description, icon: t.icon, kind: t.kind, builtIn: false, updatedAt: t.updatedAt.toISOString() }, body: t.contentJson as TemplateBody }
}

export async function createTemplate(input: { notebookId: string; userId: string; name: string; description?: string; kind?: NoteKind; title?: string; doc: PMNode }): Promise<Template> {
  const db = await getDb()
  const id = uid('tpl')
  const body: TemplateBody = { title: input.title, doc: stripEmptyTrailing(input.doc) }
  await db.insert(schema.templates).values({ id, notebookId: input.notebookId, name: input.name.trim() || 'Untitled template', description: input.description?.trim() || null, icon: 'file', kind: input.kind ?? 'note', contentJson: body, createdBy: input.userId })
  return (await db.select().from(schema.templates).where(eq(schema.templates.id, id)))[0]!
}

export async function updateTemplate(notebookId: string, id: string, patch: { name?: string; description?: string }) {
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (patch.name?.trim()) set.name = patch.name.trim()
  if (patch.description !== undefined) set.description = patch.description.trim() || null
  await db.update(schema.templates).set(set).where(and(eq(schema.templates.id, id), eq(schema.templates.notebookId, notebookId)))
}

export async function deleteTemplate(notebookId: string, id: string) {
  const db = await getDb()
  await db.delete(schema.templates).where(and(eq(schema.templates.id, id), eq(schema.templates.notebookId, notebookId)))
}

function stripEmptyTrailing(doc: PMNode): PMNode {
  const content = [...(doc.content ?? [])]
  while (content.length > 1 && content[content.length - 1]!.type === 'paragraph' && !content[content.length - 1]!.content?.length) content.pop()
  return { ...doc, content }
}

export interface TemplateVars { date: Date; notebook?: string; name?: string; title?: string }

export function renderTemplateString(s: string, v: TemplateVars): string {
  const date = v.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const time = v.date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const weekday = v.date.toLocaleDateString('en-US', { weekday: 'long' })
  const title = v.title?.trim() || ''
  return s
    .replace(/\{\{\s*date\s*\}\}/gi, date)
    .replace(/\{\{\s*time\s*\}\}/gi, time)
    .replace(/\{\{\s*weekday\s*\}\}/gi, weekday)
    .replace(/\{\{\s*notebook\s*\}\}/gi, v.notebook ?? '')
    .replace(/\{\{\s*name\s*\}\}/gi, v.name ?? '')
    .replace(/\{\{\s*title\s*\}\}/gi, title)
    .replace(/^\s*[—:-]\s*|\s*[—:-]\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/** Deep-copy a template body with placeholders filled in. */
export function renderTemplate(body: TemplateBody, v: TemplateVars): { title: string; doc: PMNode } {
  const walk = (n: PMNode): PMNode => ({ ...n, text: n.text !== undefined ? renderTemplateString(n.text, v) : undefined, content: n.content?.map(walk) })
  const doc = walk(body.doc)
  return { title: body.title ? renderTemplateString(body.title, v) : '', doc: JSON.parse(JSON.stringify(doc)) as PMNode }
}
