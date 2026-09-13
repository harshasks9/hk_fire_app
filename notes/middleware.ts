import { NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from './lib/auth'

// Public: the marketing and account pages, the login/sign-up/recovery flows, health, cron, billing webhooks and the PWA files a browser fetches before (or without) a session.
const PUBLIC_EXACT = new Set(['/login', '/signup', '/welcome', '/forgot', '/terms', '/privacy', '/api/login', '/api/signup', '/api/health', '/sw.js', '/manifest.json'])
const PUBLIC_PREFIXES = ['/api/cron/', '/icons/', '/invite/', '/api/invite/', '/s/', '/api/share/', '/reset/', '/api/auth/']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!process.env.APP_PASSWORD) return NextResponse.next()
  // Public: the login flow, health, cron, and the PWA files a browser fetches before (or without) a session.
  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }
  // Capture tokens (shortcuts, automations) authenticate the request themselves.
  if ((pathname === '/api/capture' || pathname.startsWith('/api/recordings')) && req.headers.get('authorization')?.startsWith('Bearer ')) {
    return NextResponse.next()
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (await verifySessionToken(token)) return NextResponse.next()
  if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const url = req.nextUrl.clone()
  // A signed-out visitor landing on the root sees the product page; deep links go to sign-in and come back.
  if (pathname === '/' && !token) {
    url.pathname = '/welcome'
    url.search = ''
    return NextResponse.redirect(url)
  }
  url.pathname = '/login'
  url.search = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : ''
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|icons/).*)'],
}
