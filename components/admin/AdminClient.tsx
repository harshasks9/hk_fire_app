'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Check, KeyRound, Link2, Power, Trash2, LogIn, ChevronDown, ChevronRight, ShieldCheck, Users, BookOpen, Sparkles, AlertTriangle, UserPlus, Activity } from 'lucide-react'
import { PeopleTab } from './PeopleTab'
import { PlatformSettingsTab } from './PlatformSettingsTab'
import type { PlatformSettings } from '@/lib/platform'
import { Button, Badge, useToast, Spinner } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { api } from '@/lib/client'
import { cx, relativeTime } from '@/lib/util'

type Member = { id: string; name: string; email: string | null; role: string; status: string; lastLoginAt: string | null }
export interface NotebookRowVM {
  notebook: { id: string; slug: string; name: string; status: string; ownerUserId: string | null; createdAt: string; updatedAt: string; lastActiveAt: string | null; settings: { aiMode?: string; sampleData?: boolean } }
  owner: { id: string; name: string; email: string | null } | null
  members: Member[]
  pendingInvites: number
  notes: number
  aiCalls7d: number
  aiFailed7d: number
}
interface Totals { notebooks: number; users: number; notes: number; aiCallsToday: number; aiCalls7d: number; aiFailed7d: number; signups7d: number; active7d: number }
type Tab = 'overview' | 'notebooks' | 'people' | 'settings'
interface EventVM { id: string; actorName: string | null; action: string; targetType: string | null; targetName: string | null; meta: Record<string, unknown>; createdAt: string }

export function AdminClient({ currentNotebookId, currentUserId, totals, notebooks, events, platform, integrations }: { currentNotebookId: string; currentUserId: string; totals: Totals; notebooks: NotebookRowVM[]; events: EventVM[]; platform: PlatformSettings; integrations: { email: boolean } }) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = React.useState<Tab>('overview')
  const [creating, setCreating] = React.useState(false)
  const [reveal, setReveal] = React.useState<{ title: string; lines: { label: string; value: string }[] } | null>(null)
  const [open, setOpen] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn(); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) } finally { setBusy(null) }
  }

  const TABS: { id: Tab; label: string }[] = [{ id: 'overview', label: 'Overview' }, { id: 'notebooks', label: 'Notebooks' }, { id: 'people', label: 'People' }, { id: 'settings', label: 'Settings' }]
  return (
    <div className="space-y-8">
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={cx('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13.5px]', tab === t.id ? 'border-accent font-medium text-fg' : 'border-transparent text-fg-2 hover:text-fg')}>{t.label}</button>)}
      </div>

      {tab === 'overview' ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Stat icon={<BookOpen className="h-4 w-4" />} label="Notebooks" value={totals.notebooks} />
            <Stat icon={<Users className="h-4 w-4" />} label="People" value={totals.users} />
            <Stat icon={<UserPlus className="h-4 w-4" />} label="Sign-ups · 7d" value={totals.signups7d} />
            <Stat icon={<Activity className="h-4 w-4" />} label="Active notebooks · 7d" value={totals.active7d} />
            <Stat icon={<BookOpen className="h-4 w-4" />} label="Notes" value={totals.notes} />
            <Stat icon={<Sparkles className="h-4 w-4" />} label="AI calls today" value={totals.aiCallsToday} />
            <Stat icon={<Sparkles className="h-4 w-4" />} label="AI calls · 7d" value={totals.aiCalls7d} />
            <Stat icon={<AlertTriangle className="h-4 w-4" />} label="AI failures · 7d" value={totals.aiFailed7d} tone={totals.aiFailed7d ? 'warning' : undefined} />
          </div>
          <div className="flex flex-wrap gap-2 text-[12.5px]">
            <Badge tone={platform.signupMode === 'open' ? 'success' : platform.signupMode === 'invite' ? 'warning' : 'danger'}>sign-ups: {platform.signupMode}</Badge>
            <Badge tone={integrations.email ? 'success' : 'outline'}>email {integrations.email ? 'configured' : 'not configured (links shown in UI)'}</Badge>
            <Badge tone={platform.requireEmailVerification ? 'accent' : 'outline'}>verification {platform.requireEmailVerification ? 'required' : 'optional'}</Badge>
          </div>
          <AuditLog events={events} />
        </>
      ) : null}

      {tab === 'people' ? <PeopleTab currentUserId={currentUserId} /> : null}
      {tab === 'settings' ? <PlatformSettingsTab initial={platform} integrations={integrations} /> : null}

      {tab === 'notebooks' ? <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Notebooks</h2>
          <Button variant="primary" onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New notebook</Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead className="text-left text-[11.5px] uppercase tracking-[0.06em] text-fg-3">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-semibold">Notebook</th>
                <th className="px-3 py-2 font-semibold">Owner</th>
                <th className="px-3 py-2 font-semibold">People</th>
                <th className="px-3 py-2 text-right font-semibold">Notes</th>
                <th className="px-3 py-2 text-right font-semibold">AI · 7d</th>
                <th className="px-3 py-2 font-semibold">Last active</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {notebooks.map((r) => {
                const nb = r.notebook
                const isCurrent = nb.id === currentNotebookId
                const expanded = open === nb.id
                return (
                  <React.Fragment key={nb.id}>
                    <tr className={cx('border-b border-border last:border-0', expanded && 'bg-surface-2/40')}>
                      <td className="px-3 py-2.5">
                        <button className="flex items-center gap-1.5 font-medium" onClick={() => setOpen(expanded ? null : nb.id)}>
                          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-fg-3" /> : <ChevronRight className="h-3.5 w-3.5 text-fg-3" />}
                          {nb.name}
                          {isCurrent ? <Badge tone="accent">you are here</Badge> : null}
                          {nb.id === 'nb_default' ? <Badge tone="outline">primary</Badge> : null}
                        </button>
                        <div className="pl-5 text-[12px] text-fg-3" suppressHydrationWarning>{nb.slug} · created {relativeTime(nb.createdAt)}{nb.settings.sampleData ? ' · sample data' : ''}</div>
                      </td>
                      <td className="px-3 py-2.5">{r.owner ? <><div>{r.owner.name}</div><div className="text-[12px] text-fg-3">{r.owner.email}</div></> : <span className="text-fg-3">invite pending</span>}</td>
                      <td className="px-3 py-2.5">{r.members.length}{r.pendingInvites ? <span className="text-fg-3"> · {r.pendingInvites} invited</span> : null}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{r.notes}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{r.aiCalls7d}{r.aiFailed7d ? <span className="text-warning"> · {r.aiFailed7d} failed</span> : null}</td>
                      <td className="px-3 py-2.5 text-fg-2" suppressHydrationWarning>{nb.lastActiveAt ? relativeTime(nb.lastActiveAt) : '—'}</td>
                      <td className="px-3 py-2.5">{nb.status === 'active' ? <Badge tone="success">active</Badge> : <Badge tone="danger">disabled</Badge>}</td>
                      <td className="px-3 py-2.5 text-right">
                        {!isCurrent ? <Button size="sm" variant="ghost" loading={busy === `enter:${nb.id}`} onClick={() => run(`enter:${nb.id}`, async () => { await api(`/api/admin/notebooks/${nb.id}/enter`, { method: 'POST' }); router.push('/') })} title="View this notebook as admin"><LogIn className="h-3.5 w-3.5" /> Enter</Button> : null}
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="border-b border-border bg-surface-2/40">
                        <td colSpan={8} className="px-3 pb-4 pt-1">
                          <NotebookDetail row={r} currentUserId={currentUserId} busy={busy} run={run} onReveal={setReveal} />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </section> : null}

      {creating ? <CreateNotebookDialog onClose={() => setCreating(false)} onCreated={(r) => { setCreating(false); setReveal(r); router.refresh() }} /> : null}
      {reveal ? <RevealDialog data={reveal} onClose={() => setReveal(null)} /> : null}
    </div>
  )
}

function AuditLog({ events }: { events: EventVM[] }) {
  return (
    <section>
      <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Audit log</h2>
      {events.length === 0 ? <p className="text-[13.5px] text-fg-3">No administrative actions yet.</p> : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-3 py-2 text-[13px]">
              <span className="w-24 shrink-0 text-[12px] text-fg-3" suppressHydrationWarning>{relativeTime(e.createdAt)}</span>
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-accent" />
              <span><strong>{e.actorName ?? 'system'}</strong> · {describe(e)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function describe(e: EventVM) {
  const t = e.targetName ? `“${e.targetName}”` : ''
  const m = e.meta as { email?: string; role?: string; onboarding?: string; sampleData?: boolean }
  switch (e.action) {
    case 'notebook.create': return `created notebook ${t} for ${m.email ?? 'someone'} (${m.onboarding === 'invite' ? 'invite link' : 'temporary password'}${m.sampleData ? ', sample data' : ''})`
    case 'notebook.delete': return `deleted notebook ${t}`
    case 'notebook.disable': return `disabled notebook ${t}`
    case 'notebook.enable': return `enabled notebook ${t}`
    case 'notebook.rename': return `renamed a notebook to ${t}`
    case 'notebook.enter': return `entered notebook ${t}`
    case 'notebook.leave': return `left notebook ${t}`
    case 'invite.create': return `invited ${m.email ?? 'someone'} to ${t} as ${m.role ?? 'member'}`
    case 'invite.accept': return `joined ${t} as ${m.role ?? 'member'}`
    case 'user.reset-password': return `reset the password of ${t}`
    case 'user.disable': return `disabled account ${t}`
    case 'user.enable': return `enabled account ${t}`
    case 'user.remove': return `removed account ${t}`
    case 'user.role': return `changed role of ${t} to ${m.role}`
    case 'user.signup': return `signed up and created notebook ${t}`
    case 'user.verify': return `marked ${t} as verified`
    case 'user.unverify': return `marked ${t} as unverified`
    case 'user.signout-all': return `signed ${t} out everywhere`
    case 'user.delete-self': return `deleted their own account`
    case 'invite.revoke': return `revoked an invitation${m.email ? ` for ${m.email}` : ''}`
    case 'platform.settings': return `changed platform settings (${((m as { keys?: string[] }).keys ?? []).join(', ')})`
    default: return `${e.action} ${t}`
  }
}

function Stat({ icon, label, value, tone, prefix = '' }: { icon: React.ReactNode; label: string; value: number; tone?: 'warning'; prefix?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.06em] text-fg-3">{icon} {label}</div>
      <div className={cx('mt-0.5 text-[20px] font-semibold tabular-nums', tone === 'warning' && 'text-warning')}>{prefix}{value.toLocaleString()}</div>
    </div>
  )
}

function NotebookDetail({ row, currentUserId, busy, run, onReveal }: { row: NotebookRowVM; currentUserId: string; busy: string | null; run: (k: string, fn: () => Promise<void>) => Promise<void>; onReveal: (r: { title: string; lines: { label: string; value: string }[] }) => void }) {
  const nb = row.notebook
  const [inviteEmail, setInviteEmail] = React.useState('')
  const [inviteRole, setInviteRole] = React.useState<'member' | 'owner'>(row.owner ? 'member' : 'owner')
  const [confirmName, setConfirmName] = React.useState('')
  const primary = nb.id === 'nb_default'
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <h4 className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">People</h4>
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {row.members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 px-3 py-2 text-[13px]">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{m.name} <span className="font-normal text-fg-3">· {m.role}</span>{m.status !== 'active' ? <Badge tone="danger" className="ml-1">disabled</Badge> : null}</div>
                <div className="truncate text-[12px] text-fg-3" suppressHydrationWarning>{m.email ?? 'no email'} · {m.lastLoginAt ? `signed in ${relativeTime(m.lastLoginAt)}` : 'never signed in'}</div>
              </div>
              {m.id !== currentUserId && m.role !== 'admin' ? (
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" loading={busy === `reset:${m.id}`} onClick={() => run(`reset:${m.id}`, async () => { const r = await api<{ temporaryPassword: string }>(`/api/admin/users/${m.id}/reset`, { method: 'POST' }); onReveal({ title: `New temporary password for ${m.name}`, lines: [{ label: 'Email', value: m.email ?? '' }, { label: 'Temporary password', value: r.temporaryPassword }] }) })}><KeyRound className="h-3.5 w-3.5" /> Reset password</Button>
                  <Button size="sm" variant="ghost" loading={busy === `status:${m.id}`} onClick={() => run(`status:${m.id}`, () => api(`/api/admin/users/${m.id}`, { method: 'PATCH', json: { status: m.status === 'active' ? 'disabled' : 'active' } }))}><Power className="h-3.5 w-3.5" /> {m.status === 'active' ? 'Disable' : 'Enable'}</Button>
                </div>
              ) : null}
            </li>
          ))}
          {row.members.length === 0 ? <li className="px-3 py-2 text-[13px] text-fg-3">Nobody has joined yet.</li> : null}
        </ul>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="email to invite (optional)" className="h-9 min-w-[200px] flex-1 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] outline-none focus:border-accent" />
          <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'member' | 'owner')} className="h-9 rounded-[9px] border border-border-2 bg-surface px-2 text-[13.5px]">
            <option value="member">member</option>
            <option value="owner">owner</option>
          </select>
          <Button size="md" loading={busy === `invite:${nb.id}`} onClick={() => run(`invite:${nb.id}`, async () => { const r = await api<{ inviteUrl: string; expiresAt: string }>(`/api/admin/notebooks/${nb.id}/invite`, { method: 'POST', json: { email: inviteEmail || undefined, role: inviteRole } }); setInviteEmail(''); onReveal({ title: `Invite link for “${nb.name}”`, lines: [{ label: 'Link (valid 7 days, single use)', value: r.inviteUrl }] }) })}><Link2 className="h-3.5 w-3.5" /> Create invite link</Button>
        </div>
      </div>
      <div>
        <h4 className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-fg-3">Notebook</h4>
        <div className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px]">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" disabled={primary} loading={busy === `nbstatus:${nb.id}`} onClick={() => run(`nbstatus:${nb.id}`, () => api(`/api/admin/notebooks/${nb.id}`, { method: 'PATCH', json: { status: nb.status === 'active' ? 'disabled' : 'active' } }))}><Power className="h-3.5 w-3.5" /> {nb.status === 'active' ? 'Disable notebook' : 'Enable notebook'}</Button>
            <span className="text-[12px] text-fg-3">Disabled notebooks keep their data but nobody can sign in or capture into them.</span>
          </div>
          {!primary ? (
            <div className="mt-3 border-t border-border pt-3">
              <div className="mb-1 flex items-center gap-1.5 text-[12px] text-danger"><Trash2 className="h-3.5 w-3.5" /> Delete this notebook and everything in it. Type its name to confirm.</div>
              <div className="flex flex-wrap items-center gap-2">
                <input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={nb.name} className="h-9 min-w-[180px] flex-1 rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] outline-none focus:border-danger" />
                <Button size="md" variant="danger" disabled={confirmName.trim() !== nb.name} loading={busy === `delete:${nb.id}`} onClick={() => run(`delete:${nb.id}`, () => api(`/api/admin/notebooks/${nb.id}`, { method: 'DELETE' }))}>Delete forever</Button>
              </div>
            </div>
          ) : <p className="mt-3 border-t border-border pt-3 text-[12px] text-fg-3">The Primary notebook is yours and cannot be disabled or deleted.</p>}
        </div>
      </div>
    </div>
  )
}

function CreateNotebookDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (r: { title: string; lines: { label: string; value: string }[] }) => void }) {
  const [name, setName] = React.useState('')
  const [ownerName, setOwnerName] = React.useState('')
  const [ownerEmail, setOwnerEmail] = React.useState('')
  const [onboarding, setOnboarding] = React.useState<'password' | 'invite'>('invite')
  const [sample, setSample] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const r = await api<{ notebook: { name: string }; owner: { email: string } | null; temporaryPassword?: string; inviteUrl?: string }>('/api/admin/notebooks', { method: 'POST', json: { name, ownerName, ownerEmail, onboarding, sampleData: sample } })
      const lines = r.temporaryPassword ? [{ label: 'Sign-in email', value: ownerEmail.trim().toLowerCase() }, { label: 'Temporary password', value: r.temporaryPassword }] : [{ label: 'Invite link (valid 7 days, single use)', value: r.inviteUrl ?? '' }]
      onCreated({ title: `“${r.notebook.name}” is ready`, lines })
    } catch (err) {
      setError(String((err as Error).message ?? err))
    } finally {
      setBusy(false)
    }
  }
  const field = 'h-10 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[14px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20'
  return (
    <Dialog onClose={onClose} title="New notebook">
      <form onSubmit={submit} className="space-y-3">
        <div><label className="mb-1 block text-[12.5px] text-fg-2">Notebook name</label><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya's notebook" className={field} required /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-[12.5px] text-fg-2">Owner name</label><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Priya Nair" className={field} required /></div>
          <div><label className="mb-1 block text-[12.5px] text-fg-2">Owner email</label><input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="priya@example.com" className={field} required /></div>
        </div>
        <div>
          <label className="mb-1 block text-[12.5px] text-fg-2">How they get in</label>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className={cx('flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-[13px]', onboarding === 'invite' ? 'border-accent bg-accent-soft/40' : 'border-border')}><input type="radio" className="mt-0.5" checked={onboarding === 'invite'} onChange={() => setOnboarding('invite')} /><span><strong>Invite link</strong><br /><span className="text-fg-2">They choose their own password. Link valid 7 days.</span></span></label>
            <label className={cx('flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-[13px]', onboarding === 'password' ? 'border-accent bg-accent-soft/40' : 'border-border')}><input type="radio" className="mt-0.5" checked={onboarding === 'password'} onChange={() => setOnboarding('password')} /><span><strong>Temporary password</strong><br /><span className="text-fg-2">Shown once; they can change it in Settings.</span></span></label>
          </div>
        </div>
        <label className="flex items-center gap-2 text-[13.5px]"><input type="checkbox" checked={sample} onChange={(e) => setSample(e.target.checked)} /> Load the sample dataset so the notebook is not empty (takes about a minute)</label>
        {error ? <p className="text-[13px] text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" loading={busy} disabled={busy}>Create notebook</Button>
        </div>
      </form>
    </Dialog>
  )
}

function RevealDialog({ data, onClose }: { data: { title: string; lines: { label: string; value: string }[] }; onClose: () => void }) {
  return (
    <Dialog onClose={onClose} title={data.title}>
      <p className="mb-3 text-[13px] text-fg-2">Copy these now. For safety they are not shown again.</p>
      <div className="space-y-2">
        {data.lines.map((l) => <CopyRow key={l.label} label={l.label} value={l.value} />)}
      </div>
      <div className="mt-4 flex justify-end"><Button variant="primary" onClick={onClose}>Done</Button></div>
    </Dialog>
  )
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <div>
      <div className="mb-1 text-[12px] text-fg-3">{label}</div>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-surface-2 px-2.5 py-2 text-[13px]">{value}</code>
        <Button size="sm" onClick={async () => { try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch { /* ignore */ } }}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}</Button>
      </div>
    </div>
  )
}

export { Spinner }
