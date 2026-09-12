import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSessionToken, rateLimitLogin, authEnabled } from '@/lib/auth'
import { verifyPassword } from '@/lib/crypto'
import { getDb, schema } from '@/lib/db'
import { ensureReady } from '@/lib/bootstrap'
import { ownerUser, loadNotebook, DEFAULT_NOTEBOOK_ID } from '@/lib/session'
import { findUserByEmail } from '@/lib/notebooks'

/**
  Sign in with email + password. An empty email means the owner account: it
  accepts the stored password, or APP_PASSWORD from the environment while no
  password has been set (the original single-owner flow keeps working).
*/
export async function POST(req: NextRequest) {
  if (!authEnabled()) return NextResponse.json({ ok: true, open: true })
  await ensureReady()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const rl = rateLimitLogin(ip)
  if (!rl.allowed) return NextResponse.json({ error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterS / 60)} min.` }, { status: 429 })
  const { email, password } = (await req.json().catch(() => ({}))) as { email?: string; password?: string }
  if (!password) return NextResponse.json({ error: 'Password required' }, { status: 400 })

  const user = email?.trim() ? await findUserByEmail(email.trim()) : await ownerUser()
  const isOwnerLogin = !email?.trim() || (user && user.role === 'admin')
  let ok = false
  if (user?.passwordHash) ok = verifyPassword(password, user.passwordHash)
  if (!ok && isOwnerLogin && user && (user.role === 'admin' || !user.passwordHash)) ok = checkPassword(password)
  if (!user || !ok) return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
  if (user.status !== 'active') return NextResponse.json({ error: 'This account is disabled' }, { status: 403 })
  const notebook = await loadNotebook(user.notebookId ?? DEFAULT_NOTEBOOK_ID)
  if (!notebook) return NextResponse.json({ error: 'Notebook not found' }, { status: 403 })
  if (notebook.status !== 'active' && user.role !== 'admin') return NextResponse.json({ error: 'This notebook has been disabled. Contact the administrator.' }, { status: 403 })

  const db = await getDb()
  await db.update(schema.users).set({ lastLoginAt: new Date() }).where(eq(schema.users.id, user.id))
  const res = NextResponse.json({ ok: true, role: user.role })
  res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: user.id, n: notebook.id, r: user.role }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_DAYS * 86400 })
  return res
}
