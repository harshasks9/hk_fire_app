'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { field, primaryButton } from './PublicShell'
import { PLANS } from '@/lib/plans-spec'
import type { PlanId } from '@/lib/db/schema'

export function SignupForm({ productName, allowSampleData, defaultPlan }: { productName: string; allowSampleData: boolean; defaultPlan: PlanId }) {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [sample, setSample] = React.useState(false)
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [pending, setPending] = React.useState<{ link: string | null; sent: boolean } | null>(null)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password, sampleData: sample }) })
    const j = (await res.json().catch(() => ({}))) as { error?: string; verification?: { required: boolean; sent: boolean; link: string | null } }
    setBusy(false)
    if (!res.ok) { setError(j.error ?? 'Could not create the account'); return }
    if (j.verification?.required) { setPending({ link: j.verification.link, sent: j.verification.sent }); return }
    router.push('/?welcome=1'); router.refresh()
  }
  if (pending) {
    return (
      <div className="w-full max-w-[400px]">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Check your email</h1>
        <p className="mt-2 text-[14px] text-fg-2">{pending.sent ? `We sent a confirmation link to ${email}. Open it to finish creating your account.` : 'Email sending is not configured on this deployment, so here is your confirmation link:'}</p>
        {pending.link ? <a href={pending.link} className="mt-3 block break-all rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-accent">{pending.link}</a> : null}
      </div>
    )
  }
  const plan = PLANS[defaultPlan]
  return (
    <form onSubmit={submit} className="w-full max-w-[400px]">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Create your notebook</h1>
      <p className="mb-5 mt-1 text-[13.5px] text-fg-2">Your own private {productName} workspace on the {plan.name} plan{plan.priceMonthly ? '' : ', free'}. No card needed.</p>
      <label className="mb-1 block text-[12.5px] text-fg-2">Your name</label>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className={field} required autoComplete="name" />
      <label className="mb-1 mt-3 block text-[12.5px] text-fg-2">Email</label>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} required autoComplete="email" />
      <label className="mb-1 mt-3 block text-[12.5px] text-fg-2">Password (8+ characters)</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={field} minLength={8} required autoComplete="new-password" />
      {allowSampleData ? <label className="mt-3 flex items-start gap-2 text-[13px] text-fg-2"><input type="checkbox" className="mt-0.5" checked={sample} onChange={(e) => setSample(e.target.checked)} /><span>Load a sample dataset so I can explore with something in it (you can remove it later in one click)</span></label> : null}
      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
      <button disabled={busy || !name || !email || password.length < 8} className={`mt-4 ${primaryButton}`}>{busy ? 'Creating…' : 'Create my notebook'}</button>
      <p className="mt-3 text-[12px] text-fg-3">By continuing you agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</p>
      <p className="mt-4 text-[13px] text-fg-2">Already have an account? <Link href="/login" className="font-medium text-accent">Sign in</Link></p>
    </form>
  )
}
