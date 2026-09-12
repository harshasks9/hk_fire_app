import { NextRequest, NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { createCheckout } from '@/lib/billing'
import { isPlanId } from '@/lib/plans'
export const dynamic = 'force-dynamic'

/** Start a Stripe Checkout for a paid plan (owner or admin only). */
export async function POST(req: NextRequest) {
  try {
    const s = await requireSession()
    if (s.role === 'member') return NextResponse.json({ error: 'Only the notebook owner can change the plan' }, { status: 403 })
    const b = (await req.json().catch(() => ({}))) as { plan?: string }
    if (!isPlanId(b.plan) || b.plan === 'free') return NextResponse.json({ error: 'Choose Pro or Team' }, { status: 400 })
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
    const origin = host ? `${req.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}` : new URL(req.url).origin
    const url = await createCheckout({ notebookId: s.notebookId, plan: b.plan, email: s.user.email, origin })
    return NextResponse.json({ url })
  } catch (e) {
    return apiError(e)
  }
}
