import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, loadNotebook } from '@/lib/session'
import { apiError, sessionCookieOptions } from '@/lib/api'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken } from '@/lib/auth'
import { logAdminEvent } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'

/** Switch the admin's session into another notebook (support view). Logged. */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const s = await requireAdmin()
    const { id } = await params
    const nb = await loadNotebook(id)
    if (!nb) return NextResponse.json({ error: 'Notebook not found' }, { status: 404 })
    const home = s.homeNotebookId ?? s.user.notebookId ?? s.notebookId
    await logAdminEvent({ id: s.userId, name: s.user.name }, 'notebook.enter', { type: 'notebook', id, name: nb.name })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: s.userId, n: id, r: 'admin', h: id === home ? undefined : home }), { ...sessionCookieOptions(), maxAge: SESSION_DAYS * 86400 })
    res.cookies.set('hkn_ctx', '', { path: '/', maxAge: 0 })
    return res
  } catch (e) {
    return apiError(e)
  }
}
