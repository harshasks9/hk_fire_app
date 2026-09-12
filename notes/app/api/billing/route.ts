import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/session'
import { apiError } from '@/lib/api'
import { PLANS, effectivePlan, quotaLines, usageFor } from '@/lib/plans'
import { billingConfigured, priceFor } from '@/lib/billing'
export const dynamic = 'force-dynamic'

/** The notebook's plan, quotas and month-to-date usage. */
export async function GET() {
  try {
    const s = await requireSession()
    const plan = effectivePlan(s.notebook)
    const usage = await usageFor(s.notebookId)
    return NextResponse.json({ plan, spec: PLANS[plan], stored: s.notebook.plan, expiresAt: s.notebook.planExpiresAt, usage, lines: quotaLines(plan, usage), billing: { configured: billingConfigured(), pro: Boolean(priceFor('pro')), team: Boolean(priceFor('team')), portal: Boolean(s.notebook.stripeCustomerId) } })
  } catch (e) {
    return apiError(e)
  }
}
