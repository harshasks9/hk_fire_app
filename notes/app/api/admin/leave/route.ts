import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/session'
import { apiError, sessionCookieOptions } from '@/lib/api'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken } from '@/lib/auth'
import { logAdminEvent } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'

/** Return to the admin's own notebook. */
export async function POST() {
  try {
    const s = await requireAdmin()
    const home = s.homeNotebookId ?? s.user.notebookId ?? s.notebookId
    if (s.homeNotebookId) await logAdminEvent({ id: s.userId, name: s.user.name }, 'notebook.leave', { type: 'notebook', id: s.notebookId, name: s.notebook.name })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: s.userId, n: home, r: 'admin', v: s.user.tokenVersion ?? 0 }), { ...sessionCookieOptions(), maxAge: SESSION_DAYS * 86400 })
    res.cookies.set('hkn_ctx', '', { path: '/', maxAge: 0 })
    return res
  } catch (e) {
    return apiError(e)
  }
}
