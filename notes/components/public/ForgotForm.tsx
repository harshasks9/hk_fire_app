'use client'
import * as React from 'react'
import Link from 'next/link'
import { field, primaryButton } from './PublicShell'

export function ForgotForm() {
  const [email, setEmail] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [done, setDone] = React.useState<{ link: string | null } | null>(null)
  const [error, setError] = React.useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    const j = (await res.json().catch(() => ({}))) as { error?: string; link?: string | null }
    setBusy(false)
    if (!res.ok) { setError(j.error ?? 'Something went wrong'); return }
    setDone({ link: j.link ?? null })
  }
  if (done) {
    return (
      <div className="w-full max-w-[400px]">
        <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Check your email</h1>
        <p className="mt-2 text-[14px] text-fg-2">If an account exists for {email}, a reset link is on its way. It is valid for one hour.</p>
        {done.link ? <><p className="mt-3 text-[13px] text-fg-3">Email sending is not configured on this deployment, so here is the link:</p><a href={done.link} className="mt-1 block break-all rounded-lg border border-border bg-surface-2 px-3 py-2 text-[13px] text-accent">{done.link}</a></> : null}
        <Link href="/login" className="mt-6 inline-block text-[14px] font-medium text-accent">Back to sign in →</Link>
      </div>
    )
  }
  return (
    <form onSubmit={submit} className="w-full max-w-[400px]">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Reset your password</h1>
      <p className="mb-5 mt-1 text-[13.5px] text-fg-2">Enter the email you sign in with and we will send a link to choose a new password.</p>
      <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} required autoComplete="email" />
      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
      <button disabled={busy || !email} className={`mt-3 ${primaryButton}`}>{busy ? 'Sending…' : 'Send reset link'}</button>
      <p className="mt-4 text-[13px] text-fg-2"><Link href="/login" className="font-medium text-accent">Back to sign in</Link></p>
    </form>
  )
}
