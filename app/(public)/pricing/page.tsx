import Link from 'next/link'
import { PLANS, PLAN_ORDER, UNLIMITED } from '@/lib/plans'
import { getPlatformSettings } from '@/lib/platform'
import { getSession } from '@/lib/session'
import { billingConfigured } from '@/lib/billing'
export const metadata = { title: 'Pricing' }

const fmt = (n: number, unit = '') => (n === UNLIMITED ? 'Unlimited' : `${n.toLocaleString()}${unit ? ` ${unit}` : ''}`)

export default async function PricingPage() {
  const [settings, session] = await Promise.all([getPlatformSettings(), getSession().catch(() => null)])
  const rows: { label: string; get: (p: (typeof PLANS)['free']) => string }[] = [
    { label: 'Notes', get: (p) => fmt(p.notes) },
    { label: 'AI actions per month', get: (p) => fmt(p.aiCallsMonth) },
    { label: 'Meeting recordings per month', get: (p) => fmt(p.recordingsMonth) },
    { label: 'Attachments', get: (p) => (p.storageMB >= 1024 ? `${p.storageMB / 1024} GB` : `${p.storageMB} MB`) },
    { label: 'People in the notebook', get: (p) => fmt(p.members) },
    { label: 'Bring your own AI keys', get: (p) => (p.id === 'free' ? 'Shared keys' : 'Yes') },
    { label: 'Offline mobile app, share links, import/export', get: () => 'Yes' },
  ]
  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 py-14 sm:px-8">
      <h1 className="text-center text-[34px] font-semibold tracking-[-0.03em]">Pricing</h1>
      <p className="mx-auto mt-3 max-w-[560px] text-center text-[15px] text-fg-2">Every plan is the full product. Plans differ only in how much room and how many people you get.{!billingConfigured() ? ' Paid plans on this deployment are enabled by the administrator.' : ''}</p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const p = PLANS[id]
          return (
            <div key={id} className={`rounded-2xl border p-5 ${id === 'pro' ? 'border-accent bg-accent-soft/30' : 'border-border bg-surface'}`}>
              <h2 className="text-[18px] font-semibold">{p.name}</h2>
              <div className="mt-1 text-[28px] font-semibold tabular-nums">{p.priceMonthly ? `$${p.priceMonthly}` : '$0'}<span className="text-[13px] font-normal text-fg-3"> / month</span></div>
              <p className="mt-1 text-[13px] text-fg-2">{p.tagline}</p>
              <Link href={session ? '/settings#plan' : settings.signupMode === 'open' ? '/signup' : '/login'} className={`mt-4 block rounded-lg px-3 py-2 text-center text-[14px] font-medium ${id === 'pro' ? 'bg-accent text-accent-fg' : 'border border-border-2 hover:bg-surface-2'}`}>{session ? (id === 'free' ? 'Current options' : `Choose ${p.name}`) : id === 'free' ? 'Start free' : `Start with ${p.name}`}</Link>
            </div>
          )
        })}
      </div>
      <div className="mt-10 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full min-w-[560px] text-[13.5px]">
          <thead><tr className="border-b border-border text-left text-[11.5px] uppercase tracking-[0.06em] text-fg-3"><th className="px-4 py-2.5 font-semibold">What you get</th>{PLAN_ORDER.map((id) => <th key={id} className="px-4 py-2.5 font-semibold">{PLANS[id].name}</th>)}</tr></thead>
          <tbody>{rows.map((r) => <tr key={r.label} className="border-b border-border last:border-0"><td className="px-4 py-2.5 text-fg-2">{r.label}</td>{PLAN_ORDER.map((id) => <td key={id} className="px-4 py-2.5 tabular-nums">{r.get(PLANS[id])}</td>)}</tr>)}</tbody>
        </table>
      </div>
      <div className="mx-auto mt-10 max-w-[640px] space-y-4 text-[14px] text-fg-2">
        <h3 className="text-[16px] font-semibold text-fg">Questions</h3>
        <p><strong className="text-fg">What is an AI action?</strong> One model call: analyzing a note, answering a question, writing a brief, structuring a recording. When the month's actions are used up, the app keeps working with local analysis until the next month.</p>
        <p><strong className="text-fg">Can I bring my own keys?</strong> Yes on Pro and Team: Settings → AI for this notebook takes your Anthropic or Gemini key, encrypted at rest. Calls made with your own keys still count toward the plan's actions.</p>
        <p><strong className="text-fg">Can I leave?</strong> Any time. Export everything as JSON from Settings, then delete the account; the notebook and all derived data go with it.</p>
      </div>
    </div>
  )
}
