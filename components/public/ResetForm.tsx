'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { field, primaryButton } from './PublicShell'

export function ResetForm({ token, email }: { token: string; email: string }) {
  const router = useRouter()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('The two passwords do not match'); return }
    setBusy(true); setError('')
    const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
    const j = (await res.json().catch(() => ({}))) as { error?: string }
    setBusy(false)
    if (!res.ok) { setError(j.error ?? 'Could not reset the password'); return }
    router.push('/'); router.refresh()
  }
  return (
    <form onSubmit={submit} className="w-full max-w-[400px]">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Choose a new password</h1>
      <p className="mb-5 mt-1 text-[13.5px] text-fg-2">For {email}. Every other device will be signed out.</p>
      <input autoFocus type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (8+ characters)" className={field} minLength={8} required autoComplete="new-password" />
      <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat it" className={`mt-2 ${field}`} minLength={8} required autoComplete="new-password" />
      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
      <button disabled={busy || password.length < 8} className={`mt-3 ${primaryButton}`}>{busy ? 'Saving…' : 'Set password and sign in'}</button>
    </form>
  )
}
