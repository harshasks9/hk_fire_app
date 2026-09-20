import { NextRequest, NextResponse } from 'next/server'
import { ALL_SLUG, CONTEXT_COOKIE, LAST_CONTEXT_COOKIE, getContexts } from '@/lib/context'
const opts = { path: '/', sameSite: 'lax' as const, maxAge: 365 * 86400 }
export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string }
  const all = await getContexts()
  const res = NextResponse.json({ ok: true })
  if (slug === ALL_SLUG) {
    // Remember the real context so new notes and tasks keep a home while "All" is shown.
    const current = req.cookies.get(CONTEXT_COOKIE)?.value
    if (current && current !== ALL_SLUG && all.some((c) => c.slug === current)) res.cookies.set(LAST_CONTEXT_COOKIE, current, opts)
    res.cookies.set(CONTEXT_COOKIE, ALL_SLUG, opts)
    return res
  }
  if (!all.some((c) => c.slug === slug)) return NextResponse.json({ error: 'unknown context' }, { status: 400 })
  res.cookies.set(CONTEXT_COOKIE, slug, opts)
  res.cookies.set(LAST_CONTEXT_COOKIE, slug, opts)
  return res
}
