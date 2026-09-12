import { NextRequest, NextResponse } from 'next/server'
import { ensureReady } from '@/lib/bootstrap'
import { verifyEmailToken } from '@/lib/signup'
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken } from '@/lib/auth'
import { sessionCookieOptions } from '@/lib/api'
export const dynamic = 'force-dynamic'

/** The link in the verification email: marks the address verified and lands in the app. */
export async function GET(req: NextRequest) {
  await ensureReady()
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const user = await verifyEmailToken(token)
  const url = req.nextUrl.clone()
  url.search = ''
  if (!user) {
    url.pathname = '/login'
    url.search = '?verify=invalid'
    return NextResponse.redirect(url)
  }
  url.pathname = '/'
  url.search = '?verified=1'
  const res = NextResponse.redirect(url)
  // Verifying from the same device signs the person straight in (a disabled account still cannot enter).
  if (user.status === 'active' && user.notebookId) res.cookies.set(SESSION_COOKIE, await createSessionToken({ u: user.id, n: user.notebookId, r: user.role, v: user.tokenVersion ?? 0 }), { ...sessionCookieOptions(), maxAge: SESSION_DAYS * 86400 })
  return res
}
