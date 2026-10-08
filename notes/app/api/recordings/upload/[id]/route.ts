import { NextRequest, NextResponse } from 'next/server'
import { apiError, guardOwned } from '@/lib/api'
import { appendChunk, finishUpload } from '@/lib/recordings/ingest'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** PUT one raw chunk of the audio file (header x-chunk-last: 1 on the final piece). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('attachment', id)
    if (denied) return denied
    const bytes = Buffer.from(await req.arrayBuffer())
    if (!bytes.length) return NextResponse.json({ error: 'empty chunk' }, { status: 400 })
    const r = await appendChunk(id, bytes, req.headers.get('x-chunk-last') === '1')
    return NextResponse.json(r)
  } catch (e) {
    return apiError(e)
  }
}

/** POST when every chunk has landed: starts transcription and structuring. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('meeting', id)
    if (denied) return denied
    const b = (await req.json().catch(() => ({}))) as { durationSeconds?: number }
    await finishUpload(id, { durationSeconds: b.durationSeconds })
    return NextResponse.json({ ok: true, status: 'queued' }, { status: 202 })
  } catch (e) {
    return apiError(e)
  }
}
