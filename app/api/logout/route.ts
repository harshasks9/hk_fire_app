import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url), { status: 303 })
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', maxAge: 0, path: '/' })
  return res
}
