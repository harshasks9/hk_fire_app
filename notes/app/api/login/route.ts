import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_DAYS, checkPassword, createSessionToken, rateLimitLogin, authEnabled } from '@/lib/auth'

export async function POST(req: NextRequest) {
  if (!authEnabled()) return NextResponse.json({ ok: true, open: true })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  const rl = rateLimitLogin(ip)
  if (!rl.allowed) return NextResponse.json({ error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterS / 60)} min.` }, { status: 429 })
  const { password } = (await req.json().catch(() => ({}))) as { password?: string }
  if (!password || !checkPassword(password)) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: SESSION_DAYS * 86400 })
  return res
}
