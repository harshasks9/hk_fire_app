import { NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { isNull } from 'drizzle-orm'
import { docToMarkdown } from '@/lib/markdown'
export const dynamic = 'force-dynamic'
/** Full export: every note as Markdown plus the structured graph as JSON. */
export async function GET() {
  const db = await getDb()
  const notes = await db.select().from(schema.notes).where(isNull(schema.notes.deletedAt))
  const [entities, tasks, decisions, revisions, commitments, facts, changes, meetings, contexts, research] = await Promise.all([
    db.select().from(schema.entities), db.select().from(schema.tasks), db.select().from(schema.decisions), db.select().from(schema.decisionRevisions), db.select().from(schema.commitments), db.select().from(schema.facts), db.select().from(schema.changes), db.select().from(schema.meetings), db.select().from(schema.contexts), db.select().from(schema.researchProjects),
  ])
  const payload = {
    exportedAt: new Date().toISOString(),
    contexts,
    notes: notes.map((n) => ({ id: n.id, contextId: n.contextId, title: n.title, kind: n.kind, createdAt: n.createdAt, updatedAt: n.updatedAt, markdown: docToMarkdown(n.contentJson), summary: n.summary })),
    entities, tasks, decisions, decisionRevisions: revisions, commitments, facts, changes, meetings, research,
  }
  return new NextResponse(JSON.stringify(payload, null, 2), { headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="notes-export-${new Date().toISOString().slice(0, 10)}.json"` } })
}
