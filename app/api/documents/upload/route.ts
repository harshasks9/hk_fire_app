import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { requireSession } from '@/lib/session'
import { resolveContext } from '@/lib/context'
import { startDocument, MAX_DOCUMENT_BYTES } from '@/lib/documents/ingest'
import { CHUNK_SIZE } from '@/lib/uploads'
export const dynamic = 'force-dynamic'

/** Begin a chunked document upload: creates the note and reserves the attachment. */
export async function POST(req: NextRequest) {
  try {
    await requireSession()
    const b = (await req.json()) as { name: string; mime?: string; size: number; contextId?: string; lastModified?: number }
    if (!b.name || !b.size) return NextResponse.json({ error: 'name and size required' }, { status: 400 })
    if (b.size > MAX_DOCUMENT_BYTES) return NextResponse.json({ error: `Files are limited to ${Math.round(MAX_DOCUMENT_BYTES / 1048576)} MB` }, { status: 413 })
    const ctx = await resolveContext(b.contextId || undefined)
    const r = await startDocument({ contextId: ctx.id, file: { name: b.name, mime: b.mime || 'application/octet-stream', size: b.size } })
    return NextResponse.json({ ...r, chunkSize: CHUNK_SIZE }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
