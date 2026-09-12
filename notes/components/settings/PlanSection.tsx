'use client'
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Sparkles } from 'lucide-react'
import { Button, Badge, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { cx, formatDate } from '@/lib/util'
import { PLANS, PLAN_ORDER, UNLIMITED, type QuotaLine } from '@/lib/plans-spec'
import type { PlanId } from '@/lib/db/schema'

export interface PlanView { plan: PlanId; stored: PlanId; expiresAt: string | null; lines: QuotaLine[]; billing: { configured: boolean; pro: boolean; team: boolean; portal: boolean }; monthStart: string }

/** Settings → Plan & usage: the plan in force, the five quotas as bars, and the way to change it. */
export function PlanSection({ view, canManage, isAdmin }: { view: PlanView; canManage: boolean; isAdmin: boolean }) {
  const router = useRouter()
  const params = useSearchParams()
  const toast = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  React.useEffect(() => {
    const b = params.get('billing')
    if (b === 'success') toast.push({ text: 'Thanks! Your plan updates as soon as the payment is confirmed.', tone: 'success' })
    if (b === 'cancel') toast.push({ text: 'Checkout cancelled. Nothing changed.' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const spec = PLANS[view.plan]
  const lapsed = view.stored !== view.plan
  const go = async (key: string, path: string, json?: unknown) => {
    setBusy(key)
    try { const r = await api<{ url: string }>(path, { method: 'POST', json }); window.location.href = r.url } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }); setBusy(null) }
  }
  return (
    <section id="plan">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><CreditCard className="h-3.5 w-3.5" /> Plan &amp; usage</h2>
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[16px] font-semibold">{spec.name} plan</span>
            <Badge tone={view.plan === 'free' ? 'neutral' : 'accent'}>{spec.priceMonthly ? `$${spec.priceMonthly}/month` : 'free'}</Badge>
            {lapsed ? <Badge tone="warning">{PLANS[view.stored].name} expired {view.expiresAt ? formatDate(view.expiresAt) : ''}</Badge> : view.expiresAt ? <Badge tone="outline">until {formatDate(view.expiresAt)}</Badge> : null}
          </div>
          <p className="mt-1 text-[12.5px] text-fg-3">Usage resets on the first of each month (since {formatDate(view.monthStart)}).</p>
          <ul className="mt-4 space-y-3">
            {view.lines.map((l) => (
              <li key={l.kind}>
                <div className="flex items-baseline justify-between text-[13px]"><span>{l.label}</span><span className="tabular-nums text-fg-2">{l.used.toLocaleString()}{l.unit ? ` ${l.unit}` : ''} / {l.limit === UNLIMITED ? 'unlimited' : `${l.limit.toLocaleString()}${l.unit ? ` ${l.unit}` : ''}`}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2"><div className={cx('h-full rounded-full transition-[width]', l.pct !== null && l.pct >= 100 ? 'bg-danger' : l.pct !== null && l.pct >= 80 ? 'bg-warning' : 'bg-accent')} style={{ width: `${l.pct === null ? 8 : Math.max(2, l.pct)}%` }} /></div>
              </li>
            ))}
          </ul>
          {view.lines.find((l) => l.kind === 'aiCallsMonth' && l.pct !== null && l.pct >= 100) ? <p className="mt-3 flex items-center gap-1.5 text-[12.5px] text-warning"><Sparkles className="h-3.5 w-3.5" /> This month's AI actions are used up; notes are analyzed locally until the 1st. Upgrade for more.</p> : null}
        </div>
        <div className="space-y-2">
          {PLAN_ORDER.filter((id) => id !== 'free').map((id) => {
            const p = PLANS[id]
            const current = view.plan === id && !lapsed
            const available = view.billing.configured && (id === 'pro' ? view.billing.pro : view.billing.team)
            return (
              <div key={id} className={cx('rounded-xl border p-3', current ? 'border-accent bg-accent-soft/30' : 'border-border bg-surface')}>
                <div className="flex items-baseline justify-between"><span className="text-[14px] font-semibold">{p.name}</span><span className="text-[13px] tabular-nums text-fg-2">${p.priceMonthly}/mo</span></div>
                <p className="mt-0.5 text-[12px] text-fg-3">{p.tagline}</p>
                {current ? <p className="mt-2 text-[12.5px] font-medium text-accent">Your current plan</p> : canManage && available ? <Button size="sm" variant={id === 'pro' ? 'primary' : 'secondary'} className="mt-2" loading={busy === id} onClick={() => go(id, '/api/billing/checkout', { plan: id })}>Upgrade to {p.name}</Button> : null}
              </div>
            )
          })}
          {canManage && view.billing.portal ? <Button size="sm" variant="ghost" loading={busy === 'portal'} onClick={() => go('portal', '/api/billing/portal')}>Manage billing</Button> : null}
          {!view.billing.configured ? <p className="text-[12px] text-fg-3">{isAdmin ? 'Online billing is off. Set STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and the price ids to sell plans, or assign plans from Admin.' : 'Plans on this deployment are assigned by the administrator. Ask them to upgrade you.'}</p> : null}
          {!canManage ? <p className="text-[12px] text-fg-3">Only the notebook owner can change the plan.</p> : null}
          <button className="text-[12px] text-fg-3 underline-offset-2 hover:underline" onClick={() => router.push('/pricing')}>Compare plans</button>
        </div>
      </div>
    </section>
  )
}
