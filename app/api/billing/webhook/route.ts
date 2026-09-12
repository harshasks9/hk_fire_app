import { NextRequest, NextResponse } from 'next/server'
import { ensureReady } from '@/lib/bootstrap'
import { applyStripeEvent, verifyStripeSignature } from '@/lib/billing'
export const dynamic = 'force-dynamic'

/** Stripe webhook: signature-checked, then applied to the notebook's plan. */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook not configured' }, { status: 404 })
  const raw = await req.text()
  if (!verifyStripeSignature(raw, req.headers.get('stripe-signature'), secret)) return NextResponse.json({ error: 'Bad signature' }, { status: 400 })
  await ensureReady()
  try {
    const ev = JSON.parse(raw) as Parameters<typeof applyStripeEvent>[0]
    const result = await applyStripeEvent(ev)
    return NextResponse.json({ received: true, result })
  } catch (e) {
    console.error('[stripe]', e)
    return NextResponse.json({ error: String((e as Error).message ?? e) }, { status: 500 })
  }
}
