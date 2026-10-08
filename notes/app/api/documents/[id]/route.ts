import { NextRequest, NextResponse } from 'next/server'
import { apiError, guardOwned } from '@/lib/api'
import { documentStatus, retryDocument } from '@/lib/documents/ingest'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Where a document note is: uploading, extracting, filing, done or failed. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('note', id)
    if (denied) return denied
    const s = await documentStatus(id)
    if (!s) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json(s)
  } catch (e) {
    return apiError(e)
  }
}

/** Run extraction and filing again (after a failure, or once an AI key is configured). */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('note', id)
    if (denied) return denied
    await retryDocument(id)
    return NextResponse.json({ ok: true, stage: 'extracting' }, { status: 202 })
  } catch (e) {
    return apiError(e)
  }
}
