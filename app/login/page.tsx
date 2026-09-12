'use client'
import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    setBusy(false)
    if (res.ok) { router.push(params.get('next') || '/'); router.refresh() }
    else setError(((await res.json()) as { error?: string }).error ?? 'Sign-in failed')
  }
  return (
    <form onSubmit={submit} className="w-full max-w-[340px]">
      <div className="mb-6 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-fg text-[14px] font-bold">N</span><span className="text-[15px] font-semibold">Notes</span></div>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Welcome back</h1>
      <p className="mb-5 mt-1 text-[13.5px] text-fg-2">This is a private system. Enter your password to continue.</p>
      <input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="h-10 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20" />
      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
      <button disabled={busy || !password} className="mt-3 h-10 w-full rounded-[9px] bg-accent text-[14px] font-medium text-accent-fg disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
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
