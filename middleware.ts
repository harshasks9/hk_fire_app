import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Cron routes authenticate with CRON_SECRET inside the handler.
  if (
    pathname === '/login' ||
    pathname === '/api/login' ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/cron/')
  ) {
    return NextResponse.next()
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token)) return NextResponse.next()
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  return NextResponse.redirect(url)
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
}
