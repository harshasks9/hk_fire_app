import { NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { and, inArray, isNull } from 'drizzle-orm'
import { sessionContextIds } from '@/lib/tenant'
import { docToMarkdown } from '@/lib/markdown'
export const dynamic = 'force-dynamic'
/** Full export: every note as Markdown plus the structured graph as JSON. */
export async function GET() {
  const db = await getDb()
  const ctxIds = await sessionContextIds()
  const ids = ctxIds.length ? ctxIds : ['__none__']
  const notes = await db.select().from(schema.notes).where(and(isNull(schema.notes.deletedAt), inArray(schema.notes.contextId, ids)))
  const decisions = await db.select().from(schema.decisions).where(inArray(schema.decisions.contextId, ids))
  const decisionIds = decisions.map((d) => d.id)
  const [entities, tasks, revisions, commitments, facts, changes, meetings, contexts, research] = await Promise.all([
    db.select().from(schema.entities).where(inArray(schema.entities.contextId, ids)), db.select().from(schema.tasks).where(inArray(schema.tasks.contextId, ids)), decisionIds.length ? db.select().from(schema.decisionRevisions).where(inArray(schema.decisionRevisions.decisionId, decisionIds)) : Promise.resolve([]), db.select().from(schema.commitments).where(inArray(schema.commitments.contextId, ids)), db.select().from(schema.facts).where(inArray(schema.facts.contextId, ids)), db.select().from(schema.changes).where(inArray(schema.changes.contextId, ids)), db.select().from(schema.meetings).where(inArray(schema.meetings.contextId, ids)), db.select().from(schema.contexts).where(inArray(schema.contexts.id, ids)), db.select().from(schema.researchProjects).where(inArray(schema.researchProjects.contextId, ids)),
  ])
  const payload = {
    exportedAt: new Date().toISOString(),
    contexts,
    notes: notes.map((n) => ({ id: n.id, contextId: n.contextId, title: n.title, kind: n.kind, createdAt: n.createdAt, updatedAt: n.updatedAt, markdown: docToMarkdown(n.contentJson), summary: n.summary })),
    entities, tasks, decisions, decisionRevisions: revisions, commitments, facts, changes, meetings, research,
  }
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="notes-export-${new Date().toISOString().slice(0, 10)}.json"` } })
}
