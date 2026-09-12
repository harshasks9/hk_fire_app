'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LogOut } from 'lucide-react'
import { Button, Input, useToast } from '@/components/ui'
import { api } from '@/lib/client'

export function AccountSection({ name: initialName, email: initialEmail, role, notebookName, authEnabled, hasPassword }: { name: string; email: string | null; role: string; notebookName: string; authEnabled: boolean; hasPassword: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [name, setName] = React.useState(initialName)
  const [email, setEmail] = React.useState(initialEmail ?? '')
  const [current, setCurrent] = React.useState('')
  const [next, setNext] = React.useState('')
  const [busy, setBusy] = React.useState<string | null>(null)
  const save = async (key: string, json: Record<string, unknown>, msg: string) => {
    setBusy(key)
    try { await api('/api/account', { method: 'PATCH', json }); toast.push({ text: msg, tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) }
  }
  return (
    <section id="account">
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Account</h2>
      <div className="grid gap-3 sm:grid-cols-[160px_1fr] sm:items-center">
        <label className="text-[13.5px] text-fg-2">Notebook</label>
        <div className="text-[13.5px]">{notebookName} <span className="text-fg-3">· you are the {role === 'admin' ? 'administrator' : role}</span></div>
        <label className="text-[13.5px] text-fg-2">Your name</label>
        <div className="flex gap-2"><Input value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" /><Button loading={busy === 'name'} onClick={() => save('name', { name }, 'Name saved')}>Save</Button></div>
        <label className="text-[13.5px] text-fg-2">Email (sign-in)</label>
        <div className="flex gap-2"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="max-w-xs" /><Button loading={busy === 'email'} onClick={() => save('email', { email }, 'Email saved')}>Save</Button></div>
        <label className="text-[13.5px] text-fg-2">Password</label>
        <div>
          {authEnabled ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder={hasPassword ? 'Current password' : 'Current (or APP_PASSWORD)'} className="max-w-[190px]" />
              <Input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (8+)" className="max-w-[190px]" />
              <Button loading={busy === 'pw'} disabled={next.length < 8} onClick={() => save('pw', { currentPassword: current, newPassword: next }, 'Password changed').then(() => { setCurrent(''); setNext('') })}><KeyRound className="h-3.5 w-3.5" /> Change</Button>
            </div>
          ) : <span className="text-[13.5px] text-fg-2">Open access. Set <code className="rounded bg-surface-2 px-1">APP_PASSWORD</code> on the server to require sign-in; then every notebook gets its own accounts.</span>}
        </div>
        <label className="text-[13.5px] text-fg-2">Session</label>
        <div>{authEnabled ? <Button size="sm" variant="ghost" onClick={async () => { await api('/api/logout', { method: 'POST' }); router.push('/login') }}><LogOut className="h-3.5 w-3.5" /> Sign out</Button> : <span className="text-[13.5px] text-fg-3">No sign-in required in open mode.</span>}</div>
      </div>
    </section>
  )
}
