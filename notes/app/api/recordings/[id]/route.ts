import { NextRequest, NextResponse } from 'next/server'
import { apiError, guardOwned } from '@/lib/api'
import { ingestStatus, retryRecording } from '@/lib/recordings/ingest'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Where the job is (for the progress view). */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('meeting', id)
    if (denied) return denied
    const s = await ingestStatus(id)
    if (!s) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json(s)
  } catch (e) {
    return apiError(e)
  }
}

/** Re-run structuring (after a failure, or to rebuild the note from the transcript). */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('meeting', id)
    if (denied) return denied
    await retryRecording(id)
    return NextResponse.json({ ok: true, status: 'queued' }, { status: 202 })
  } catch (e) {
    return apiError(e)
  }
}
