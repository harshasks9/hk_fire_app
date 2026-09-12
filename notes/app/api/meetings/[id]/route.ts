import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createNote, scheduleProcessing } from '@/lib/notes'
import { generateOutput } from '@/lib/generate'
export const maxDuration = 60
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, id)))[0]
  if (!m) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const b = (await req.json()) as { title?: string; status?: 'upcoming' | 'live' | 'completed'; generate?: 'follow_up' | 'readout'; ensureNote?: boolean }
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.title) set.title = b.title
  if (b.status) set.status = b.status
  let noteId = m.noteId
  if (b.ensureNote && !noteId) {
    noteId = await createNote({ contextId: m.contextId, title: m.title, kind: 'meeting', meetingId: id, createdAt: m.startsAt })
    set.noteId = noteId
  }
  if (b.generate === 'follow_up') set.followUpEmail = (await generateOutput('customer_follow_up', { type: 'meeting', id })).text
  if (b.generate === 'readout') set.executiveReadout = (await generateOutput('executive_summary', { type: 'meeting', id })).text
  await db.update(schema.meetings).set(set).where(eq(schema.meetings.id, id))
  if (b.status === 'completed' && noteId) scheduleProcessing(noteId)
  return NextResponse.json({ ok: true, noteId, followUpEmail: set.followUpEmail, executiveReadout: set.executiveReadout })
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  await db.delete(schema.meetings).where(eq(schema.meetings.id, id))
  return new NextResponse(null, { status: 204 })
}
