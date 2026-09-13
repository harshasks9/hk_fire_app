'use client'
import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState(params.get('verify') === 'invalid' ? 'That confirmation link is no longer valid. Sign in and request a new one from the banner.' : params.get('reset') === '1' ? 'Password changed. Sign in with the new one.' : '')
  const [unverified, setUnverified] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(''); setUnverified(null)
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    setBusy(false)
    if (res.ok) { router.push(params.get('next') || '/'); router.refresh(); return }
    const j = (await res.json().catch(() => ({}))) as { error?: string; code?: string; email?: string }
    setError(j.error ?? 'Sign-in failed')
    if (j.code === 'unverified') setUnverified(j.email ?? email)
  }
  const resend = async () => {
    await fetch('/api/auth/resend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: unverified }) })
    setNotice('If that address is registered, a new confirmation link is on its way.'); setError(''); setUnverified(null)
  }
  const field = 'h-11 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
  return (
    <form onSubmit={submit} className="w-full max-w-[360px]">
      <Link href="/welcome" className="mb-6 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg text-[14px] font-bold">N</span><span className="text-[15px] font-semibold">Notes</span></Link>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Welcome back</h1>
      <p className="mb-5 mt-1 text-[13.5px] text-fg-2">Sign in to your notebook.</p>
      {notice ? <p className="mb-3 rounded-lg border border-accent/30 bg-accent-soft/40 px-3 py-2 text-[13px]">{notice}</p> : null}
      <input autoFocus type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={`mb-2 ${field}`} />
      <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className={field} />
      {error ? <p className="mt-2 text-[13px] text-danger">{error} {unverified ? <button type="button" onClick={resend} className="font-medium underline">Send a new link</button> : null}</p> : null}
      <button disabled={busy || !password} className="mt-3 h-11 w-full rounded-[9px] bg-accent text-[15px] font-medium text-accent-fg disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
      <div className="mt-4 flex items-center justify-between text-[13px] text-fg-2">
        <Link href="/forgot" className="hover:text-fg">Forgot password?</Link>
        <span>New here? <Link href="/signup" className="font-medium text-accent">Create a notebook</Link></span>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <Suspense><LoginForm /></Suspense>
    </main>
  )
}
