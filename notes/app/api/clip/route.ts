import { NextRequest, NextResponse } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { resolveContext } from '@/lib/context'
import { getDb, schema } from '@/lib/db'
import { resolveToken } from '@/lib/tokens'
import { scheduleProcessing } from '@/lib/notes'
import { clipToNote, parseShare } from '@/lib/clip'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Web clipper: a page (and optionally the reader's selection and comment) becomes a link note with the
 * readable article inside. Session cookie (the /clip page, the share target) or a capture token
 * (bookmarklet from another origin, shortcuts) — the same two doors as /api/capture.
 */
export async function POST(req: NextRequest) {
  const bearer = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  const ct = req.headers.get('content-type') ?? ''
  let b: Record<string, string> = {}
  if (ct.includes('application/json')) b = ((await req.json().catch(() => ({}))) ?? {}) as Record<string, string>
  else { const fd = await req.formData().catch(() => null); if (fd) for (const [k, v] of fd.entries()) if (typeof v === 'string') b[k] = v }
  const share = parseShare({ title: b.title, text: b.text, url: b.url })
  if (!share.url) return NextResponse.json({ error: 'A web address is required' }, { status: 400 })
  let contextId: string
  if (bearer) {
    const t = await resolveToken(bearer)
    if (!t) return NextResponse.json({ error: 'Invalid or revoked token' }, { status: 401 })
    const db = await getDb()
    const all = await db.select().from(schema.contexts).where(eq(schema.contexts.notebookId, t.notebook.id)).orderBy(asc(schema.contexts.position))
    const wanted = String(b.context ?? b.contextId ?? '')
    const picked = all.find((c) => c.slug === wanted || c.id === wanted) ?? all.find((c) => c.slug === 'work') ?? all[0]
    if (!picked) return NextResponse.json({ error: 'This notebook has no contexts' }, { status: 400 })
    contextId = picked.id
  } else {
    contextId = (await resolveContext(b.contextId || b.context || undefined)).id
  }
  const r = await clipToNote({ contextId, url: share.url, title: share.title, comment: b.comment ?? '', selection: b.selection ?? share.text, source: bearer ? 'api' : b.via === 'share' ? 'share' : b.via === 'bookmarklet' ? 'bookmarklet' : 'clip' })
  scheduleProcessing(r.id)
  return NextResponse.json({ id: r.id, title: r.title, url: `/notes/${r.id}`, fetched: r.article.fetched, words: r.article.wordCount, method: r.article.method, error: r.article.error ?? null }, { status: 201 })
}
