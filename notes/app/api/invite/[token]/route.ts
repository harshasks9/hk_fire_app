import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, rateLimitLogin } from '@/lib/auth'
import { ensureReady } from '@/lib/bootstrap'
import { acceptInvite, inviteByToken } from '@/lib/notebooks'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await ensureReady()
  const { token } = await params
  const found = await inviteByToken(token)
  if (!found) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  return NextResponse.json({ valid: found.valid, notebook: found.notebook.name, email: found.invite.email, role: found.invite.role, expiresAt: found.invite.expiresAt })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  await ensureReady()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!rateLimitLogin(`invite:${ip}`).allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  const { token } = await params
  const body = (await req.json().catch(() => ({}))) as { name?: string; email?: string; password?: string }
  try {
    const user = await acceptInvite(token, { name: body.name ?? '', email: body.email, password: body.password ?? '' })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: user.id, n: user.notebookId!, r: user.role }), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_DAYS * 86400 })
    return res
  } catch (e) {
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 400 })
  }
}
