import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { assertOwned } from '@/lib/tenant'
import { createTemplate, listTemplates } from '@/lib/templates'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { markdownToDoc, type PMNode } from '@/lib/markdown'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const s = await requireSession()
    return NextResponse.json({ templates: await listTemplates(s.notebookId) })
  } catch (e) {
    return apiError(e)
  }
}

/** Save a note as a template, or create one from markdown. */
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    const b = (await req.json().catch(() => ({}))) as { name?: string; description?: string; noteId?: string; markdown?: string; title?: string; kind?: 'note' | 'meeting' }
    let doc: PMNode
    let kind: 'note' | 'meeting' = b.kind ?? 'note'
    if (b.noteId) {
      await assertOwned('note', b.noteId)
      const db = await getDb()
      const note = (await db.select().from(schema.notes).where(eq(schema.notes.id, b.noteId)))[0]
      if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
      doc = note.contentJson as PMNode
      kind = note.kind === 'meeting' ? 'meeting' : 'note'
    } else {
      doc = markdownToDoc(b.markdown ?? '')
    }
    const t = await createTemplate({ notebookId: s.notebookId, userId: s.userId, name: b.name ?? '', description: b.description, kind, title: b.title, doc })
    return NextResponse.json({ ok: true, id: t.id, name: t.name }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
