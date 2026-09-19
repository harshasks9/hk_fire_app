import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { resolveContext } from '@/lib/context'
import { actorFromRequest, chooseContext, notebookContexts } from '@/lib/recordings/ingest'
import { startDocument } from '@/lib/documents/ingest'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Files small enough for one request (about 4 MB each on Vercel). Larger files go through /api/documents/upload in pieces. */
const MAX_DIRECT = 4 * 1024 * 1024

/**
 * Upload documents and turn each into a note: multipart `files` (many), optional `contextId` / `context` (id or slug).
 * The session cookie or a capture token (`Authorization: Bearer …`) authenticates the request.
 */
export async function POST(req: NextRequest) {
  try {
    const actor = await actorFromRequest(req)
    if (actor instanceof NextResponse) return actor
    const form = await req.formData()
    const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
    const single = form.get('file')
    if (single instanceof File && single.size > 0) files.push(single)
    if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 })
    const big = files.find((f) => f.size > MAX_DIRECT)
    if (big) return NextResponse.json({ error: `${big.name} is larger than ${MAX_DIRECT / 1048576} MB; upload it in pieces through /api/documents/upload` }, { status: 413 })
    const wanted = String(form.get('contextId') ?? form.get('context') ?? '') || undefined
    let contextId: string
    if (actor.via === 'token') {
      const { context } = chooseContext(await notebookContexts(actor.notebookId), wanted)
      if (!context) return NextResponse.json({ error: 'This notebook has no contexts' }, { status: 400 })
      contextId = context.id
    } else contextId = (await resolveContext(wanted)).id
    const items: { noteId: string; name: string }[] = []
    for (const f of files) {
      const r = await startDocument({ contextId, file: { name: f.name, mime: f.type, size: f.size }, bytes: Buffer.from(await f.arrayBuffer()), source: actor.via === 'token' ? 'api' : 'upload' })
      items.push({ noteId: r.noteId, name: f.name })
    }
    return NextResponse.json({ ok: true, items }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
