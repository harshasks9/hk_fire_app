'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, LogOut, ShieldAlert, Trash2, MailCheck } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'
import { Button, Input, useToast } from '@/components/ui'
import { api } from '@/lib/client'

export function AccountSection({ name: initialName, email: initialEmail, role, notebookName, authEnabled, hasPassword, verified = true, isOwner = false }: { name: string; email: string | null; role: string; notebookName: string; authEnabled: boolean; hasPassword: boolean; verified?: boolean; isOwner?: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [name, setName] = React.useState(initialName)
  const [email, setEmail] = React.useState(initialEmail ?? '')
  const [current, setCurrent] = React.useState('')
  const [next, setNext] = React.useState('')
  const [busy, setBusy] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)
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
        <div className="flex flex-wrap items-center gap-2"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="max-w-xs" /><Button loading={busy === 'email'} onClick={() => save('email', { email }, 'Email saved')}>Save</Button>{authEnabled && initialEmail ? (verified ? <span className="inline-flex items-center gap-1 text-[12.5px] text-success"><MailCheck className="h-3.5 w-3.5" /> confirmed</span> : <Button size="sm" variant="ghost" loading={busy === 'resend'} onClick={async () => { setBusy('resend'); try { const r = await api<{ sent: boolean; link: string | null }>('/api/auth/resend', { method: 'POST' }); toast.push({ text: r.sent ? 'Confirmation email sent' : r.link ? `Email is not configured here; open this link: ${r.link}` : 'Could not send right now', tone: r.sent ? 'success' : 'neutral' }) } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) } }}>Not confirmed · resend</Button>) : null}</div>
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
        <div className="flex flex-wrap gap-2">{authEnabled ? <><Button size="sm" variant="ghost" onClick={async () => { await api('/api/logout', { method: 'POST' }); router.push('/login') }}><LogOut className="h-3.5 w-3.5" /> Sign out</Button><Button size="sm" variant="ghost" loading={busy === 'all'} onClick={async () => { setBusy('all'); try { await api('/api/account/signout-all', { method: 'POST' }); toast.push({ text: 'Every other device has been signed out', tone: 'success' }) } catch (e) { toast.push({ text: String(e), tone: 'danger' }) } finally { setBusy(null) } }}><ShieldAlert className="h-3.5 w-3.5" /> Sign out everywhere else</Button></> : <span className="text-[13.5px] text-fg-3">No sign-in required in open mode.</span>}</div>
        {authEnabled && role !== 'admin' ? <>
          <label className="text-[13.5px] text-fg-2">Delete account</label>
          <div><Button size="sm" variant="ghost" className="text-danger" onClick={() => setDeleting(true)}><Trash2 className="h-3.5 w-3.5" /> Delete my account…</Button><p className="mt-1 text-[12px] text-fg-3">{isOwner ? 'Deletes this notebook and everything in it, for everyone in it.' : 'Removes you from the notebook. Notes stay with the notebook.'}</p></div>
        </> : null}
      </div>
      {deleting ? <DeleteAccountDialog isOwner={isOwner} onClose={() => setDeleting(false)} /> : null}
    </section>
  )
}

function DeleteAccountDialog({ isOwner, onClose }: { isOwner: boolean; onClose: () => void }) {
  const toast = useToast()
  const [password, setPassword] = React.useState('')
  const [confirm, setConfirm] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await api('/api/account/delete', { method: 'POST', json: { password, confirm } })
      window.location.href = '/welcome'
    } catch (err) { toast.push({ text: String((err as Error).message ?? err), tone: 'danger' }); setBusy(false) }
  }
  return (
    <Dialog onClose={onClose} title={isOwner ? 'Delete this notebook and my account' : 'Delete my account'}>
      <form onSubmit={submit} className="space-y-3 text-[13.5px]">
        <p className="text-fg-2">{isOwner ? 'Every note, meeting, recording, attachment, member, token and share link in this notebook will be deleted. There is no undo. Export first if you want a copy.' : 'Your login will be removed. Notes you wrote stay in the notebook for the other members.'}</p>
        <div><label className="mb-1 block text-[12.5px] text-fg-2">Your password</label><Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div><label className="mb-1 block text-[12.5px] text-fg-2">Type DELETE to confirm</label><Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" /></div>
        <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" variant="danger" loading={busy} disabled={busy || !password || confirm.trim().toUpperCase() !== 'DELETE'}>Delete forever</Button></div>
      </form>
    </Dialog>
  )
}
