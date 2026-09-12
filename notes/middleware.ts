import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!process.env.APP_PASSWORD) return NextResponse.next()
  // Public: the login flow, health, cron, and the PWA files a browser fetches before (or without) a session.
  if (pathname === '/login' || pathname === '/api/login' || pathname === '/api/health' || pathname.startsWith('/api/cron/') || pathname === '/sw.js' || pathname === '/manifest.json' || pathname.startsWith('/icons/')) {
    return NextResponse.next()
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token)) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = req.nextUrl.clone()
  url.pathname = '/login'
  url.search = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|icons/).*)'],
}
