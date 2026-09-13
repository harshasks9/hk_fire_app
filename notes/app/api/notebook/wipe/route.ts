import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { checkPassword } from '@/lib/auth'
import { verifyPassword } from '@/lib/crypto'
import { logAdminEvent } from '@/lib/notebooks'
import { wipeAll, wipeCounts, wipeRange, type WipeRange } from '@/lib/wipe'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

function parseRange(b: { since?: string | null; until?: string | null }): WipeRange {
  const since = b.since ? new Date(b.since) : null
  const until = b.until ? new Date(b.until) : null
  if ((since && Number.isNaN(since.getTime())) || (until && Number.isNaN(until.getTime()))) throw Object.assign(new Error('Bad date'), { status: 400 })
  return { since, until }
}

/** Preview: what a wipe would remove. */
export async function GET(req: NextRequest) {
  try {
    const s = await requireSession()
    const range = parseRange({ since: req.nextUrl.searchParams.get('since'), until: req.nextUrl.searchParams.get('until') })
    return NextResponse.json(await wipeCounts(s.notebookId, range))
  } catch (e) {
    return apiError(e)
  }
}

/** The master delete: everything, or everything created in a date window. Owner only, password and typed DELETE required. */
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can delete data in bulk' }, { status: 403 })
    const b = (await req.json().catch(() => ({}))) as { mode?: 'all' | 'range'; since?: string | null; until?: string | null; password?: string; confirm?: string }
    const ok = s.user.passwordHash ? verifyPassword(b.password ?? '', s.user.passwordHash) : checkPassword(b.password ?? '') || !process.env.APP_PASSWORD
    if (!ok) return NextResponse.json({ error: 'Incorrect password' }, { status: 400 })
    if ((b.confirm ?? '').trim().toUpperCase() !== 'DELETE') return NextResponse.json({ error: 'Type DELETE to confirm' }, { status: 400 })
    const range = b.mode === 'range' ? parseRange(b) : {}
    const result = b.mode === 'range' ? await wipeRange(s.notebookId, range) : await wipeAll(s.notebookId)
    await logAdminEvent({ id: s.userId, name: s.user.name }, b.mode === 'range' ? 'notebook.wipe-range' : 'notebook.wipe', { type: 'notebook', id: s.notebookId, name: s.notebook.name }, { ...result, since: range.since ?? null, until: range.until ?? null })
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return apiError(e)
  }
}
