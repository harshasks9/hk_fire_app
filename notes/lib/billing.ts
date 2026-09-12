/*
  Billing through Stripe Checkout and the customer portal, called over REST so
  no SDK is needed. Everything is optional: without STRIPE_SECRET_KEY the
  platform admin assigns plans by hand and the upgrade buttons say so.

  Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_PRO, STRIPE_PRICE_TEAM.
*/
import { createHmac, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getDb, schema } from './db'
import { isPlanId } from './plans'
import { logAdminEvent } from './notebooks'
import type { PlanId } from './db/schema'

export function billingConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && (process.env.STRIPE_PRICE_PRO || process.env.STRIPE_PRICE_TEAM))
}

export function priceFor(plan: PlanId): string | undefined {
  if (plan === 'pro') return process.env.STRIPE_PRICE_PRO || undefined
  if (plan === 'team') return process.env.STRIPE_PRICE_TEAM || undefined
  return undefined
}

function form(data: Record<string, string | undefined>): string {
  return Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`).join('&')
}

async function stripe<T>(path: string, data: Record<string, string | undefined>): Promise<T> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form(data) })
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok) throw Object.assign(new Error(j.error?.message ?? `Stripe error ${res.status}`), { status: 502 })
  return j
}

/** A Checkout session for upgrading a notebook. Returns the URL to send the browser to. */
export async function createCheckout(input: { notebookId: string; plan: PlanId; email: string | null; origin: string }): Promise<string> {
  const price = priceFor(input.plan)
  if (!billingConfigured() || !price) throw Object.assign(new Error('Online billing is not set up on this deployment. Ask the administrator to change your plan.'), { status: 400 })
  const db = await getDb()
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, input.notebookId)))[0]
  const r = await stripe<{ url: string }>('checkout/sessions', {
    mode: 'subscription',
    'line_items[0][price]': price,
    'line_items[0][quantity]': '1',
    success_url: `${input.origin}/settings?billing=success#plan`,
    cancel_url: `${input.origin}/settings?billing=cancel#plan`,
    client_reference_id: input.notebookId,
    customer: nb?.stripeCustomerId ?? undefined,
    customer_email: nb?.stripeCustomerId ? undefined : input.email ?? undefined,
    'metadata[notebookId]': input.notebookId,
    'metadata[plan]': input.plan,
    'subscription_data[metadata][notebookId]': input.notebookId,
    'subscription_data[metadata][plan]': input.plan,
    allow_promotion_codes: 'true',
  })
  return r.url
}

/** The customer portal (change card, cancel). */
export async function createPortal(notebookId: string, origin: string): Promise<string> {
  const db = await getDb()
  const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, notebookId)))[0]
  if (!billingConfigured() || !nb?.stripeCustomerId) throw Object.assign(new Error('No billing account yet for this notebook.'), { status: 400 })
  const r = await stripe<{ url: string }>('billing_portal/sessions', { customer: nb.stripeCustomerId, return_url: `${origin}/settings#plan` })
  return r.url
}

/** Verify a Stripe-Signature header (v1 scheme) against the raw body. */
export function verifyStripeSignature(rawBody: string, header: string | null, secret: string, now = Math.floor(Date.now() / 1000), toleranceS = 300): boolean {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((kv) => kv.split('=') as [string, string]))
  const t = Number(parts.t)
  const v1 = parts.v1
  if (!t || !v1 || Math.abs(now - t) > toleranceS) return false
  const expected = createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(v1)
  return a.length === b.length && timingSafeEqual(a, b)
}

interface StripeEvent { type: string; data: { object: Record<string, unknown> } }

/** Apply a webhook event: checkout completed → plan on; subscription updated/deleted → plan follows. */
export async function applyStripeEvent(ev: StripeEvent): Promise<string> {
  const db = await getDb()
  const o = ev.data.object
  const meta = (o.metadata ?? {}) as Record<string, string>
  if (ev.type === 'checkout.session.completed') {
    const notebookId = (o.client_reference_id as string) || meta.notebookId
    const plan = isPlanId(meta.plan) ? meta.plan : 'pro'
    if (!notebookId) return 'ignored: no notebook'
    await db.update(schema.notebooks).set({ plan, planExpiresAt: null, stripeCustomerId: (o.customer as string) ?? undefined, stripeSubscriptionId: (o.subscription as string) ?? undefined, updatedAt: new Date() }).where(eq(schema.notebooks.id, notebookId))
    await logAdminEvent(null, 'billing.subscribed', { type: 'notebook', id: notebookId }, { plan, subscription: o.subscription })
    return `plan ${plan} on ${notebookId}`
  }
  if (ev.type === 'customer.subscription.updated' || ev.type === 'customer.subscription.deleted') {
    const subId = o.id as string
    const nb = (await db.select().from(schema.notebooks).where(eq(schema.notebooks.stripeSubscriptionId, subId)))[0] ?? (meta.notebookId ? (await db.select().from(schema.notebooks).where(eq(schema.notebooks.id, meta.notebookId)))[0] : undefined)
    if (!nb) return 'ignored: unknown subscription'
    const status = o.status as string
    const periodEnd = typeof o.current_period_end === 'number' ? new Date(o.current_period_end * 1000) : null
    const cancelAtEnd = Boolean(o.cancel_at_period_end)
    if (ev.type === 'customer.subscription.deleted' || ['canceled', 'unpaid', 'incomplete_expired'].includes(status)) {
      await db.update(schema.notebooks).set({ plan: 'free', planExpiresAt: null, stripeSubscriptionId: null, updatedAt: new Date() }).where(eq(schema.notebooks.id, nb.id))
      await logAdminEvent(null, 'billing.cancelled', { type: 'notebook', id: nb.id, name: nb.name }, { status })
      return `plan free on ${nb.id}`
    }
    const plan = isPlanId(meta.plan) ? meta.plan : nb.plan
    await db.update(schema.notebooks).set({ plan, planExpiresAt: cancelAtEnd ? periodEnd : null, stripeSubscriptionId: subId, updatedAt: new Date() }).where(eq(schema.notebooks.id, nb.id))
    return `plan ${plan} on ${nb.id}${cancelAtEnd ? ' (ends at period end)' : ''}`
  }
  return `ignored: ${ev.type}`
}
