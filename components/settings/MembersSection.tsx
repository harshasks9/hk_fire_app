'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Users, Mail, Link2, Trash2, Copy, Check } from 'lucide-react'
import { Button, Badge, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'
import type { MemberView, PendingInviteView } from '@/lib/members'

/** Settings → People: who is in the notebook, pending invitations, and inviting more (owner only). */
export function MembersSection({ members, invites, limit, canManage, currentUserId, ownerUserId, emailConfigured }: { members: MemberView[]; invites: PendingInviteView[]; limit: number; canManage: boolean; currentUserId: string; ownerUserId: string | null; emailConfigured: boolean }) {
  const router = useRouter()
  const toast = useToast()
  const [email, setEmail] = React.useState('')
  const [role, setRole] = React.useState<'member' | 'owner'>('member')
  const [busy, setBusy] = React.useState<string | null>(null)
  const [link, setLink] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const seats = members.length + invites.length
  const full = limit !== -1 && seats >= limit
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn(); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) } finally { setBusy(null) }
  }
  const invite = () => run('invite', async () => {
    const r = await api<{ inviteUrl: string; emailed: boolean }>('/api/members', { method: 'POST', json: { email: email || undefined, role } })
    setEmail('')
    if (r.emailed) toast.push({ text: `Invitation sent to ${email}`, tone: 'success' })
    setLink(r.inviteUrl)
  })
  return (
    <section id="people">
      <h2 className="mb-3 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2"><Users className="h-3.5 w-3.5" /> People</h2>
      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-[13.5px]">
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{m.name} <span className="font-normal text-fg-3">· {m.id === ownerUserId ? 'owner' : m.role}</span>{m.id === currentUserId ? <Badge tone="accent" className="ml-1.5">you</Badge> : null}{m.status !== 'active' ? <Badge tone="danger" className="ml-1.5">disabled</Badge> : null}{!m.verified ? <Badge tone="warning" className="ml-1.5">email unconfirmed</Badge> : null}</div>
              <div className="truncate text-[12px] text-fg-3" suppressHydrationWarning>{m.email ?? 'no email'} · {m.lastLoginAt ? `signed in ${relativeTime(m.lastLoginAt)}` : 'never signed in'}</div>
            </div>
            {canManage && m.id !== currentUserId && m.id !== ownerUserId ? (
              <div className="flex items-center gap-1">
                <select value={m.role} onChange={(e) => run(`role:${m.id}`, () => api(`/api/members/${m.id}`, { method: 'PATCH', json: { role: e.target.value } }))} className="h-8 rounded-lg border border-border bg-surface px-2 text-[12.5px]"><option value="member">member</option><option value="owner">owner</option></select>
                <Button size="sm" variant="ghost" loading={busy === `rm:${m.id}`} onClick={() => { if (confirm(`Remove ${m.name} from this notebook? Their notes stay.`)) run(`rm:${m.id}`, () => api(`/api/members/${m.id}`, { method: 'DELETE' })) }}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
              </div>
            ) : null}
          </li>
        ))}
        {invites.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-[13.5px]">
            <div className="min-w-0 flex-1"><div className="truncate">{i.email ?? 'Open invitation link'} <span className="text-fg-3">· invited as {i.role}</span></div><div className="text-[12px] text-fg-3" suppressHydrationWarning>expires {relativeTime(i.expiresAt)}</div></div>
            {canManage ? <Button size="sm" variant="ghost" loading={busy === `inv:${i.id}`} onClick={() => run(`inv:${i.id}`, () => api(`/api/members/invites/${i.id}`, { method: 'DELETE' }))}>Revoke</Button> : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] text-fg-3">{seats} of {limit === -1 ? 'unlimited' : limit} {limit === 1 ? 'seat' : 'seats'} used{full && canManage ? ' · upgrade in Plan & usage to invite more' : ''}.</p>
      {canManage ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email (optional: leave blank for a link)" type="email" className="h-9 min-w-[220px] flex-1 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] outline-none focus:border-accent" />
          <select value={role} onChange={(e) => setRole(e.target.value as 'member' | 'owner')} className="h-9 rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px]"><option value="member">member</option><option value="owner">owner</option></select>
          <Button loading={busy === 'invite'} disabled={full} onClick={invite}>{email && emailConfigured ? <Mail className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />} {email && emailConfigured ? 'Send invitation' : 'Create invitation link'}</Button>
        </div>
      ) : null}
      {link ? (
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[12.5px]">{link}</code>
          <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ } }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}</Button>
        </div>
      ) : null}
      {canManage ? <p className="mt-2 text-[12px] text-fg-3">Invitations are single use and valid for 7 days. Members see everything in the notebook; owners can also invite, change AI settings and the plan.</p> : null}
    </section>
  )
}
