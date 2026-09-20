'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'

export function InviteForm({ token, notebook, email, role }: { token: string; notebook: string; email: string | null; role: string }) {
  const router = useRouter()
  const [name, setName] = React.useState('')
  const [mail, setMail] = React.useState(email ?? '')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const res = await fetch(`/api/invite/${token}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email: mail, password }) })
    setBusy(false)
    if (res.ok) { router.push('/'); router.refresh() }
    else setError(((await res.json()) as { error?: string }).error ?? 'Could not accept the invitation')
  }
  const field = 'h-11 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[15px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
  return (
    <form onSubmit={submit} className="w-full max-w-[380px]">
      <div className="mb-6 flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[14px] font-bold text-accent-fg">N</span><span className="text-[15px] font-semibold">Notes</span></div>
      <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Join “{notebook}”</h1>
      <p className="mb-5 mt-1 text-[13.5px] text-fg-2">You have been invited as {role === 'owner' ? 'the owner' : 'a member'} of this notebook. Choose a name and password to get started.</p>
      <label className="mb-1 block text-[12.5px] text-fg-2">Your name</label>
      <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className={field} required />
      <label className="mb-1 mt-3 block text-[12.5px] text-fg-2">Email</label>
      <input type="email" value={mail} onChange={(e) => setMail(e.target.value)} placeholder="you@example.com" className={field} required readOnly={Boolean(email)} />
      <label className="mb-1 mt-3 block text-[12.5px] text-fg-2">Password (8+ characters)</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={field} minLength={8} required />
      {error ? <p className="mt-2 text-[13px] text-danger">{error}</p> : null}
      <button disabled={busy || !name || !mail || password.length < 8} className="mt-4 h-11 w-full rounded-[9px] bg-accent text-[15px] font-medium text-accent-fg disabled:opacity-50">{busy ? 'Setting up…' : 'Create my account'}</button>
      <p className="mt-4 text-[12px] text-fg-3">Your notebook is private. Nobody else, including the administrator, sees it in day-to-day use.</p>
    </form>
  )
}
