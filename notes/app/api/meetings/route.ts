import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { createMeetingWithNote, scheduleProcessing } from '@/lib/notes'
import { getDb, schema } from '@/lib/db'
import { uid } from '@/lib/util'
export const maxDuration = 60

/** Create a meeting. With a transcript/notes it is completed and processed; otherwise it is scheduled. */
export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const b = (await req.json()) as { title: string; startsAt?: string; endsAt?: string; location?: string; notesMarkdown?: string; transcript?: { t: number; speaker: string; text: string }[]; participants?: string[]; status?: 'upcoming' | 'completed'; meetingId?: string }
  const title = b.title?.trim() || 'Untitled meeting'
  const startsAt = b.startsAt ? new Date(b.startsAt) : new Date()
  if (b.status === 'upcoming') {
    const db = await getDb()
    const id = uid('mtg')
    await db.insert(schema.meetings).values({ id, contextId: ctx.id, title, startsAt, endsAt: b.endsAt ? new Date(b.endsAt) : undefined, status: 'upcoming', location: b.location })
    return NextResponse.json({ meetingId: id }, { status: 201 })
  }
  const r = await createMeetingWithNote({ contextId: ctx.id, title, startsAt, endsAt: b.endsAt ? new Date(b.endsAt) : new Date(), location: b.location, notesMarkdown: b.notesMarkdown, transcript: b.transcript, participants: b.participants, meetingId: b.meetingId })
  scheduleProcessing(r.noteId)
  return NextResponse.json(r, { status: 201 })
}
