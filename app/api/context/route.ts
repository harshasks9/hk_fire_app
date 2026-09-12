import { NextRequest, NextResponse } from 'next/server'
import { CONTEXT_COOKIE, getContexts } from '@/lib/context'
export async function POST(req: NextRequest) {
  const { slug } = (await req.json()) as { slug: string }
  const all = await getContexts()
  if (!all.some((c) => c.slug === slug)) return NextResponse.json({ error: 'unknown context' }, { status: 400 })
  const res = NextResponse.json({ ok: true })
  res.cookies.set(CONTEXT_COOKIE, slug, { path: '/', sameSite: 'lax', maxAge: 365 * 86400 })
  return res
}
