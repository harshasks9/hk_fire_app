/* Task details: the rich body a person writes by hand, its attachments, and its public links. */
import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb, schema } from './db'
import { docToText, markdownToDoc, type PMNode } from './markdown'
import { listShareLinks } from './share'
import type { Task } from './db/schema'

export interface TaskAttachment { id: string; name: string; mime: string; size: number; durationSeconds: number | null; createdAt: Date }
export interface TaskDetail {
  task: Task
  contextName: string
  entity: { id: string; name: string; type: string } | null
  sourceNote: { id: string; title: string } | null
  attachments: TaskAttachment[]
  /** A live public link, if one exists. */
  publicUrl: string | null
}

export async function getTaskDetail(id: string, origin: string): Promise<TaskDetail | null> {
  const db = await getDb()
  const task = (await db.select().from(schema.tasks).where(eq(schema.tasks.id, id)))[0]
  if (!task) return null
  const [ctx, ent, note, attachments, links] = await Promise.all([
    db.select({ name: schema.contexts.name }).from(schema.contexts).where(eq(schema.contexts.id, task.contextId)),
    task.entityId ? db.select({ id: schema.entities.id, name: schema.entities.name, type: schema.entities.type }).from(schema.entities).where(eq(schema.entities.id, task.entityId)) : Promise.resolve([]),
    task.sourceNoteId ? db.select({ id: schema.notes.id, title: schema.notes.title }).from(schema.notes).where(eq(schema.notes.id, task.sourceNoteId)) : Promise.resolve([]),
    db.select({ id: schema.attachments.id, name: schema.attachments.name, mime: schema.attachments.mime, size: schema.attachments.size, durationSeconds: schema.attachments.durationSeconds, createdAt: schema.attachments.createdAt }).from(schema.attachments).where(eq(schema.attachments.taskId, id)).orderBy(asc(schema.attachments.createdAt)),
    listShareLinks({ taskId: id }, origin),
  ])
  return { task, contextName: ctx[0]?.name ?? '', entity: ent[0] ?? null, sourceNote: note[0] ?? null, attachments, publicUrl: links.find((l) => l.active)?.url ?? null }
}

/** Plain text typed into a small box becomes a proper document (paragraphs, lists). */
export function detailsFromText(text: string): PMNode | null {
  const t = text.trim()
  return t ? markdownToDoc(t) : null
}

export async function setTaskDetails(id: string, details: unknown | null) {
  const db = await getDb()
  await db.update(schema.tasks).set({ details: details ?? null, detailsText: details ? docToText(details) : '', updatedAt: new Date() }).where(eq(schema.tasks.id, id))
}

/** Everything hanging off tasks (files, public links) goes with them. */
export async function deleteTaskExtras(taskIds: string[]) {
  if (!taskIds.length) return
  const db = await getDb()
  await db.delete(schema.attachments).where(inArray(schema.attachments.taskId, taskIds))
  await db.delete(schema.shareLinks).where(and(inArray(schema.shareLinks.taskId, taskIds)))
}
