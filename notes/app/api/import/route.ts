import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { getContexts, resolveContext } from '@/lib/context'
import { importNotes, type ImportFile } from '@/lib/import'
import { processNote } from '@/lib/pipeline'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MAX_BYTES = 25 * 1024 * 1024

/** Import Markdown / text files or the app's JSON export into the active (or named) context. */
export async function POST(req: NextRequest) {
  try {
    await requireSession()
    const form = await req.formData()
    const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
    if (!files.length) return NextResponse.json({ error: 'No files' }, { status: 400 })
    if (files.reduce((a, f) => a + f.size, 0) > MAX_BYTES) return NextResponse.json({ error: 'Too large: keep each import under 25 MB' }, { status: 413 })
    const contexts = await getContexts()
    const target = await resolveContext(String(form.get('contextId') ?? '') || undefined)
    const modified = String(form.get('lastModified') ?? '').split(',').map((s) => Number(s)).filter((n) => Number.isFinite(n) && n > 0)
    const input: ImportFile[] = []
    for (let i = 0; i < files.length; i++) input.push({ name: files[i]!.name, text: await files[i]!.text(), lastModified: modified[i] })
    const result = await importNotes({ files: input, contexts: contexts.map((c) => ({ id: c.id, slug: c.slug })), defaultContextId: target.id })
    const ids = result.created.map((c) => c.id)
    after(async () => {
      for (const id of ids) await processNote(id).catch((err) => console.error('[import]', id, err))
    })
    return NextResponse.json({ ok: true, created: result.created.length, skipped: result.skipped, ids })
  } catch (e) {
    return apiError(e)
  }
}
