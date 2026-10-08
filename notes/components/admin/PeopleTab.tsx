'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Power, MailCheck, ShieldAlert, Trash2, Search } from 'lucide-react'
import { Button, Badge, useToast, Spinner } from '@/components/ui'
import { Dialog } from '@/components/ui/Dialog'
import { api } from '@/lib/client'
import { relativeTime } from '@/lib/util'

interface UserVM { id: string; name: string; email: string | null; role: string; status: string; verified: boolean; createdAt: string; lastLoginAt: string | null; notebookId: string | null; notebookName: string | null; notebookStatus: string | null }

/** Admin → People: every account on the platform with search and the per-account actions. */
export function PeopleTab({ currentUserId }: { currentUserId: string }) {
  const router = useRouter()
  const toast = useToast()
  const [q, setQ] = React.useState('')
  const [users, setUsers] = React.useState<UserVM[] | null>(null)
  const [busy, setBusy] = React.useState<string | null>(null)
  const [reveal, setReveal] = React.useState<{ name: string; email: string; password: string } | null>(null)
  const load = React.useCallback(async () => { setUsers((await api<{ users: UserVM[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`)).users) }, [q])
  React.useEffect(() => { const t = setTimeout(() => { load().catch((e) => toast.push({ text: String(e), tone: 'danger' })) }, 200); return () => clearTimeout(t) }, [load, toast])
  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key)
    try { await fn(); await load(); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) } finally { setBusy(null) }
  }
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-fg-3" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email or notebook" className="h-9 w-72 rounded-[9px] border border-border-2 bg-surface pl-8 pr-3 text-[13.5px] outline-none focus:border-accent" /></div>
        <span className="text-[12.5px] text-fg-3">{users ? `${users.length} accounts` : ''}</span>
      </div>
      {!users ? <div className="flex items-center gap-2 text-[13px] text-fg-3"><Spinner /> Loading…</div> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[820px] text-[13.5px]">
            <thead className="text-left text-[11.5px] uppercase tracking-[0.06em] text-fg-3"><tr className="border-b border-border"><th className="px-3 py-2 font-semibold">Person</th><th className="px-3 py-2 font-semibold">Notebook</th><th className="px-3 py-2 font-semibold">Role</th><th className="px-3 py-2 font-semibold">Email</th><th className="px-3 py-2 font-semibold">Last sign-in</th><th className="px-3 py-2 font-semibold">Joined</th><th className="px-3 py-2" /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2"><div className="font-medium">{u.name}{u.id === currentUserId ? <Badge tone="accent" className="ml-1.5">you</Badge> : null}{u.status !== 'active' ? <Badge tone="danger" className="ml-1.5">disabled</Badge> : null}</div><div className="text-[12px] text-fg-3">{u.email ?? 'no email'}</div></td>
                  <td className="px-3 py-2">{u.notebookName ?? <span className="text-fg-3">—</span>}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.verified ? <span className="inline-flex items-center gap-1 text-success"><MailCheck className="h-3.5 w-3.5" /> confirmed</span> : <span className="text-warning">unconfirmed</span>}</td>
                  <td className="px-3 py-2 text-fg-2" suppressHydrationWarning>{u.lastLoginAt ? relativeTime(u.lastLoginAt) : 'never'}</td>
                  <td className="px-3 py-2 text-fg-2" suppressHydrationWarning>{relativeTime(u.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    {u.id !== currentUserId && u.role !== 'admin' ? (
                      <div className="flex flex-wrap justify-end gap-1">
                        {!u.verified ? <Button size="sm" variant="ghost" loading={busy === `v:${u.id}`} onClick={() => run(`v:${u.id}`, () => api(`/api/admin/users/${u.id}`, { method: 'PATCH', json: { verified: true } }))} title="Mark the email as confirmed"><MailCheck className="h-3.5 w-3.5" /></Button> : null}
                        <Button size="sm" variant="ghost" loading={busy === `r:${u.id}`} onClick={() => run(`r:${u.id}`, async () => { const r = await api<{ temporaryPassword: string }>(`/api/admin/users/${u.id}/reset`, { method: 'POST' }); setReveal({ name: u.name, email: u.email ?? '', password: r.temporaryPassword }) })} title="Reset password"><KeyRound className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" loading={busy === `o:${u.id}`} onClick={() => run(`o:${u.id}`, () => api(`/api/admin/users/${u.id}`, { method: 'PATCH', json: { signOutEverywhere: true } }))} title="Sign out everywhere"><ShieldAlert className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" loading={busy === `s:${u.id}`} onClick={() => run(`s:${u.id}`, () => api(`/api/admin/users/${u.id}`, { method: 'PATCH', json: { status: u.status === 'active' ? 'disabled' : 'active' } }))} title={u.status === 'active' ? 'Disable' : 'Enable'}><Power className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" loading={busy === `d:${u.id}`} onClick={() => { if (confirm(`Remove the account of ${u.name}? Their notebook and notes stay; delete the notebook from the Notebooks tab if needed.`)) run(`d:${u.id}`, () => api(`/api/admin/users/${u.id}`, { method: 'DELETE' })) }} title="Remove account"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? <tr><td colSpan={7} className="px-3 py-6 text-center text-fg-3">No accounts match.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
      {reveal ? (
        <Dialog onClose={() => setReveal(null)} title={`Temporary password for ${reveal.name}`}>
          <p className="mb-2 text-[13px] text-fg-2">Send it to {reveal.email || 'them'} over a channel you trust. It is not shown again.</p>
          <code className="block rounded-lg border border-border bg-surface-2 px-3 py-2 text-[14px]">{reveal.password}</code>
          <div className="mt-4 flex justify-end"><Button variant="primary" onClick={() => setReveal(null)}>Done</Button></div>
        </Dialog>
      ) : null}
    </section>
  )
}
