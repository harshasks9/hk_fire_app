import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError, sessionCookieOptions } from '@/lib/api'
import { signOutEverywhere } from '@/lib/signup'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken } from '@/lib/auth'
export const dynamic = 'force-dynamic'

/** Invalidate every other session of the signed-in user; this browser gets a fresh cookie. */
export async function POST() {
  try {
    const s = await requireSession()
    const v = await signOutEverywhere(s.userId)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: s.userId, n: s.notebookId, r: s.role, h: s.homeNotebookId, v }), { ...sessionCookieOptions(), maxAge: SESSION_DAYS * 86400 })
    return res
  } catch (e) {
    return apiError(e)
  }
}
