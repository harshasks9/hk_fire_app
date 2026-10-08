import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { getSession } from '@/lib/session'
import { CHUNK_SIZE, MAX_AUDIO_BYTES, startRecording } from '@/lib/recordings/ingest'
export const dynamic = 'force-dynamic'

/** Begin a chunked audio upload from the app: creates the meeting and reserves the attachment. */
export async function POST(req: NextRequest) {
  try {
    const s = await getSession()
    if (!s) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
    const b = (await req.json()) as { name: string; mime: string; size: number; title?: string; context?: string; recordedAt?: string; participants?: string[]; notes?: string; transcript?: string }
    if (!b.name || !b.size) return NextResponse.json({ error: 'name and size required' }, { status: 400 })
    if (b.size > MAX_AUDIO_BYTES) return NextResponse.json({ error: `Recording is larger than ${Math.round(MAX_AUDIO_BYTES / 1048576)} MB` }, { status: 413 })
    const r = await startRecording({
      actor: { notebookId: s.notebookId, userId: s.userId, via: 'session' },
      context: b.context,
      title: b.title,
      recordedAt: b.recordedAt ? new Date(b.recordedAt) : undefined,
      participants: b.participants,
      notes: b.notes,
      transcript: b.transcript?.trim() ? { text: b.transcript } : undefined,
      audioPlaceholder: { name: b.name, mime: b.mime || 'audio/mp4', size: b.size },
    })
    return NextResponse.json({ ...r, chunkSize: CHUNK_SIZE }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
