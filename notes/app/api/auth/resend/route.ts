import { NextRequest, NextResponse } from 'next/server'
import { ensureReady } from '@/lib/bootstrap'
import { rateLimitLogin } from '@/lib/auth'
import { getSession } from '@/lib/session'
import { findUserByEmail } from '@/lib/notebooks'
import { sendVerification } from '@/lib/signup'
export const dynamic = 'force-dynamic'

/** Re-send the verification email: for the signed-in user, or for an address that could not sign in yet. */
export async function POST(req: NextRequest) {
  await ensureReady()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
  if (!rateLimitLogin(`resend:${ip}`).allowed) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 })
  const s = await getSession()
  const b = (await req.json().catch(() => ({}))) as { email?: string }
  const user = s?.user ?? (b.email ? await findUserByEmail(b.email) : undefined)
  if (!user || !user.email) return NextResponse.json({ ok: true })
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, verified: true })
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const origin = host ? `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : undefined
  const r = await sendVerification(user, origin)
  return NextResponse.json({ ok: true, sent: r.email.sent, link: s ? r.link ?? null : null })
}
