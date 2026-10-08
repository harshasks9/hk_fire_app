import { NextRequest, NextResponse } from 'next/server'
import { ensureReady } from '@/lib/bootstrap'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, rateLimitLogin } from '@/lib/auth'
import { sessionCookieOptions } from '@/lib/api'
import { resetPasswordWithToken, SignupError } from '@/lib/signup'
import { loadNotebook } from '@/lib/session'
export const dynamic = 'force-dynamic'

/** Choose a new password from a reset link. Every other session of the account is signed out. */
export async function POST(req: NextRequest) {
  await ensureReady()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!rateLimitLogin(`reset:${ip}`).allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { token?: string; password?: string }
  try {
    const user = await resetPasswordWithToken(b.token ?? '', b.password ?? '')
    const res = NextResponse.json({ ok: true })
    const nb = user.notebookId ? await loadNotebook(user.notebookId) : undefined
    if (user.status === 'active' && nb && (nb.status === 'active' || user.role === 'admin')) res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: user.id, n: nb.id, r: user.role, v: user.tokenVersion ?? 0 }), { ...sessionCookieOptions(), maxAge: SESSION_DAYS * 86400 })
    return res
  } catch (e) {
    if (e instanceof SignupError) return NextResponse.json({ error: e.message }, { status: e.status })
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 400 })
  }
}
