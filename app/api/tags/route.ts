import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api'
import { getActiveContext, getContexts } from '@/lib/context'
import { listTags, untaggedNoteIds } from '@/lib/tags'
import { processNote } from '@/lib/pipeline'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

/** Tags in the active context (or every context with ?all=1) with counts. */
export async function GET(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get('all') === '1'
    const ids = all ? (await getContexts()).map((c) => c.id) : [(await getActiveContext()).id]
    const tags = await listTags(ids, { limit: Number(req.nextUrl.searchParams.get('limit') ?? 300) })
    const untagged = await untaggedNoteIds(ids, 1)
    return NextResponse.json({ tags, untagged: untagged.remaining })
  } catch (e) {
    return apiError(e)
  }
}

/**
 * Backfill: run understanding on a slice of notes that have no tags yet
 * (older notes written before tagging existed). Loop until `remaining` is 0.
 */
export async function POST(req: NextRequest) {
  try {
    const all = req.nextUrl.searchParams.get('all') === '1'
    const ids = all ? (await getContexts()).map((c) => c.id) : [(await getActiveContext()).id]
    const { ids: noteIds, remaining } = await untaggedNoteIds(ids, 6)
    const started = Date.now()
    let done = 0
    for (const id of noteIds) {
      if (Date.now() - started > 70_000) break
      await processNote(id).catch((err) => console.error('[tags] backfill', id, String(err).slice(0, 200)))
      done++
    }
    return NextResponse.json({ processed: done, remaining: Math.max(0, remaining - done) })
  } catch (e) {
    return apiError(e)
  }
}
