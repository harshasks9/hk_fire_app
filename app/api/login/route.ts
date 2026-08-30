import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, createSessionToken, rateLimitLogin, SESSION_COOKIE, SESSION_DAYS } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rl = rateLimitLogin(ip)
  if (!rl.allowed) {
    return NextResponse.redirect(
      new URL(`/login?error=rate&retry=${rl.retryAfterS}`, req.url),
      { status: 303 },
    )
  }
  const form = await req.formData()
  const password = String(form.get('password') ?? '')
  if (!checkPassword(password)) {
    return NextResponse.redirect(new URL('/login?error=bad', req.url), { status: 303 })
  }
  const res = NextResponse.redirect(new URL('/', req.url), { status: 303 })
  res.cookies.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_DAYS * 24 * 3600,
    path: '/',
  })
  return res
}
