'use client'
import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button, useToast } from '@/components/ui'
import { api } from '@/lib/client'
import type { PlatformSettings } from '@/lib/platform'
import { cx } from '@/lib/util'

/** Admin → Settings: who may register, what they start with, and what the platform says about itself. */
export function PlatformSettingsTab({ initial, integrations }: { initial: PlatformSettings; integrations: { email: boolean } }) {
  const router = useRouter()
  const toast = useToast()
  const [s, setS] = React.useState(initial)
  const [busy, setBusy] = React.useState(false)
  const save = async () => {
    setBusy(true)
    try { await api('/api/admin/platform', { method: 'PATCH', json: s }); toast.push({ text: 'Platform settings saved', tone: 'success' }); router.refresh() } catch (e) { toast.push({ text: String((e as Error).message ?? e), tone: 'danger' }) } finally { setBusy(false) }
  }
  const field = 'h-9 w-full rounded-[9px] border border-border-2 bg-surface px-3 text-[13.5px] outline-none focus:border-accent'
  const modes: { id: PlatformSettings['signupMode']; title: string; text: string }[] = [
    { id: 'open', title: 'Open', text: 'Anyone can create a notebook from /signup.' },
    { id: 'invite', title: 'Invite only', text: 'New accounts come from invitation links you or notebook owners send.' },
    { id: 'closed', title: 'Closed', text: 'No new accounts at all; existing ones keep working.' },
  ]
  return (
    <section className="max-w-[760px] space-y-6">
      <div>
        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Registration</h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {modes.map((m) => <label key={m.id} className={cx('flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-[13px]', s.signupMode === m.id ? 'border-accent bg-accent-soft/40' : 'border-border')}><input type="radio" className="mt-0.5" checked={s.signupMode === m.id} onChange={() => setS({ ...s, signupMode: m.id })} /><span><strong>{m.title}</strong><br /><span className="text-fg-2">{m.text}</span></span></label>)}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 text-[13.5px]">
            <label className="flex items-center gap-2"><input type="checkbox" checked={s.requireEmailVerification} onChange={(e) => setS({ ...s, requireEmailVerification: e.target.checked })} /> Require a confirmed email before signing in</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={s.allowSampleData} onChange={(e) => setS({ ...s, allowSampleData: e.target.checked })} /> Offer the sample dataset at sign-up</label>
          </div>
        </div>
        {s.requireEmailVerification && !integrations.email ? <p className="mt-2 text-[12.5px] text-warning">Email sending is not configured (RESEND_API_KEY), so people would only see their confirmation link on screen after signing up. Consider leaving this off until email works.</p> : null}
      </div>
      <div>
        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Presentation</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="mb-1 block text-[12.5px] text-fg-2">Product name</label><input value={s.productName} onChange={(e) => setS({ ...s, productName: e.target.value })} className={field} /></div>
          <div><label className="mb-1 block text-[12.5px] text-fg-2">Support email (shown on public pages)</label><input type="email" value={s.supportEmail} onChange={(e) => setS({ ...s, supportEmail: e.target.value })} className={field} placeholder="support@example.com" /></div>
        </div>
        <div className="mt-3"><label className="mb-1 block text-[12.5px] text-fg-2">Announcement shown to everyone (blank = none)</label><input value={s.announcement} onChange={(e) => setS({ ...s, announcement: e.target.value })} className={field} placeholder="Maintenance Sunday 02:00–03:00 UTC" maxLength={300} /></div>
      </div>
      <div>
        <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-fg-2">Integrations</h3>
        <ul className="space-y-1 text-[13.5px]">
          <li>Email: <strong>{integrations.email ? 'Resend configured' : 'not configured'}</strong> <span className="text-fg-3">· RESEND_API_KEY and EMAIL_FROM</span></li>
        </ul>
      </div>
      <Button variant="primary" loading={busy} onClick={save}>Save settings</Button>
    </section>
  )
}
