import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { scopedContexts } from '@/lib/tenant'
import { findNoteByTitle, searchNoteTitles } from '@/lib/links'
import { createNote } from '@/lib/notes'
import { apiError } from '@/lib/api'
export const dynamic = 'force-dynamic'

/** Titles for the [[ autocomplete: the whole notebook, most recent first, exact and prefix matches on top. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const exclude = req.nextUrl.searchParams.get('exclude') ?? undefined
  const ids = await scopedContexts()
  const rows = await searchNoteTitles(ids, q, 8, exclude)
  return NextResponse.json(rows.map((r) => ({ id: r.id, title: r.title, kind: r.kind, updatedAt: r.updatedAt.toISOString() })))
}

/** Resolve a title to a note, creating an empty note with that title when none exists (following an unresolved [[link]]). */
export async function POST(req: NextRequest) {
  try {
    const b = (await req.json().catch(() => ({}))) as { title?: string; contextId?: string; create?: boolean }
    const title = (b.title ?? '').trim().slice(0, 300)
    if (!title) return NextResponse.json({ error: 'A title is required' }, { status: 400 })
    const ids = await scopedContexts()
    const found = await findNoteByTitle(ids, title)
    if (found) return NextResponse.json({ id: found.id, title: found.title, created: false })
    if (b.create === false) return NextResponse.json({ error: 'No note with that title' }, { status: 404 })
    const ctx = await getActiveContext()
    const contextId = b.contextId && ids.includes(b.contextId) ? b.contextId : ctx.id
    const id = await createNote({ contextId, title, source: 'link' })
    return NextResponse.json({ id, title, created: true }, { status: 201 })
  } catch (e) {
    return apiError(e)
  }
}
