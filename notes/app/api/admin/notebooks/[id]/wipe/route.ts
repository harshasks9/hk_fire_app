import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { requireAdmin } from '@/lib/session'
import { apiError } from '@/lib/api'
import { logAdminEvent } from '@/lib/notebooks'
import { wipeAll, wipeRange } from '@/lib/wipe'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/** Admin: empty any notebook (all content, or a date window). The notebook, its contexts and members stay. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    const db = await getDb()
    const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, id)))[0]
    if (!nb) return NextResponse.json({ error: 'Notebook not found' }, { status: 404 })
    const b = (await req.json().catch(() => ({}))) as { mode?: 'all' | 'range'; since?: string | null; until?: string | null }
    const range = { since: b.since ? new Date(b.since) : null, until: b.until ? new Date(b.until) : null }
    const result = b.mode === 'range' ? await wipeRange(id, range) : await wipeAll(id)
    await logAdminEvent({ id: s.userId, name: s.user.name }, b.mode === 'range' ? 'notebook.wipe-range' : 'notebook.wipe', { type: 'notebook', id, name: nb.name }, { ...result, since: range.since, until: range.until })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return apiError(e)
  }
}
