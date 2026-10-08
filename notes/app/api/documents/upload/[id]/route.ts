import { NextRequest, NextResponse } from 'next/server'
import { apiError, guardOwned } from '@/lib/api'
import { appendDocumentChunk, finishDocumentUpload } from '@/lib/documents/ingest'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** PUT one raw chunk of the file against the attachment id (header x-chunk-last: 1 on the final piece). */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('attachment', id)
    if (denied) return denied
    const bytes = Buffer.from(await req.arrayBuffer())
    if (!bytes.length) return NextResponse.json({ error: 'empty chunk' }, { status: 400 })
    return NextResponse.json(await appendDocumentChunk(id, bytes, req.headers.get('x-chunk-last') === '1'))
  } catch (e) {
    return apiError(e)
  }
}

/** POST against the note id when every chunk has landed: starts extraction and filing. */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const denied = await guardOwned('note', id)
    if (denied) return denied
    await finishDocumentUpload(id)
    return NextResponse.json({ ok: true, stage: 'extracting' }, { status: 202 })
  } catch (e) {
    return apiError(e)
  }
}
