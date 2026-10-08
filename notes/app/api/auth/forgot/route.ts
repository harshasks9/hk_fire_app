import { NextRequest, NextResponse } from 'next/server'
import { ensureReady } from '@/lib/bootstrap'
import { rateLimitLogin, authEnabled } from '@/lib/auth'
import { requestPasswordReset } from '@/lib/signup'
export const dynamic = 'force-dynamic'

/** Password reset request. The response is the same whether or not the address exists. */
export async function POST(req: NextRequest) {
  if (!authEnabled()) return NextResponse.json({ ok: true })
  await ensureReady()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!rateLimitLogin(`forgot:${ip}`).allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  const b = (await req.json().catch(() => ({}))) as { email?: string }
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const origin = host ? `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : undefined
  const r = await requestPasswordReset(b.email ?? '', origin)
  return NextResponse.json({ ok: true, link: r.link ?? null })
}
