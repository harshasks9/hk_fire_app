import React, { useState } from 'react'
import { useApp } from '@/state/AppContext'
import { MEMBERS, ACCOUNTS, HOUSEHOLD } from '@/data/household'
import { Card, SectionHead, Badge, Button, Toggle, Segmented, KV } from '@/components/ui'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import { fmtDate } from '@/lib/format'

export default function SettingsPage() {
  const app = useApp()
  const [mfa, setMfa] = useState(true)
  const [passkey, setPasskey] = useState(true)
  const [alerts, setAlerts] = useState({ price: true, assignment: true, documents: true, obligations: true, weekly: false })

  return (
    <div className="fade-up mx-auto max-w-3xl space-y-5">
      <h1 className="px-1 font-display text-[20px] font-semibold tracking-tight text-ink md:hidden">Settings</h1>

      {/* Profile & household */}
      <Card pad>
        <SectionHead title="Household" sub={HOUSEHOLD.name} />
        <div className="space-y-2">
          {MEMBERS.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-invert" style={{ background: m.color }}>{m.short}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium text-ink">{m.name}</span>
                <span className="text-[11px] capitalize text-ink3">{m.role}</span>
              </span>
              {m.role === 'primary' && <Badge tone="brand">You</Badge>}
            </div>
          ))}
          <Button variant="ghost" size="sm" icon="plus">Add member or entity</Button>
        </div>
        <div className="mt-3 space-y-0.5 border-t border-line pt-3">
          <KV k="Base currency" v="USD" />
          <KV k="Countries" v="United States · India" />
          <KV k="Tax residency" v={HOUSEHOLD.taxResidency} />
        </div>
      </Card>

      {/* Security */}
      <Card pad>
        <SectionHead title="Security" sub="Financial data warrants bank-grade protection" />
        <div className="space-y-2.5">
          <SecRow icon="lock" title="Two-factor authentication" sub="TOTP app · configured Mar 2025" right={<Toggle checked={mfa} onChange={setMfa} label="MFA" />} />
          <SecRow icon="key" title="Passkey" sub="MacBook Pro Touch ID · added Jun 2026" right={<Toggle checked={passkey} onChange={setPasskey} label="Passkey" />} />
          <SecRow icon="clock" title="Active sessions" sub="This device · iPhone (Seattle, 2h ago)" right={<Button size="sm" variant="ghost">Manage</Button>} />
          <SecRow icon="shield" title="Data encryption" sub="Documents encrypted at rest; values never leave your workspace" right={<Badge tone="gain" icon="check">On</Badge>} />
        </div>
      </Card>

      {/* Preferences */}
      <Card pad>
        <SectionHead title="Preferences" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink">Experience mode <span className="block text-[11px] text-ink3">Remembered per device</span></span>
            <Segmented options={[{ value: 'simple', label: 'Simple' }, { value: 'pro', label: 'Pro' }]} value={app.mode} onChange={(m) => app.setMode(m)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink">Theme</span>
            <Segmented
              options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
              value={app.theme}
              onChange={(t) => { if (t !== app.theme) app.toggleTheme() }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink">Display currency</span>
            <Segmented options={[{ value: 'USD', label: 'USD $' }, { value: 'INR', label: 'INR ₹' }]} value={app.currency} onChange={(c) => app.setCurrency(c)} />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card pad>
        <SectionHead title="Notifications" />
        <div className="space-y-2.5">
          {(
            [
              ['price', 'Watchlist price alerts', 'When a symbol crosses your target'],
              ['assignment', 'Options risk', 'Assignment risk and expiries within 7 days'],
              ['documents', 'Document processing', 'When uploads are ready for review'],
              ['obligations', 'Payment reminders', 'Bills, calls and renewals 7 days ahead'],
              ['weekly', 'Weekly digest', 'A Sunday summary of the week'],
            ] as const
          ).map(([key, title, sub]) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-[13px] text-ink">{title}<span className="block text-[11px] text-ink3">{sub}</span></span>
              <Toggle checked={alerts[key]} onChange={(v) => setAlerts({ ...alerts, [key]: v })} label={title} />
            </div>
          ))}
        </div>
      </Card>

      {/* Connected accounts */}
      <Card pad>
        <SectionHead title="Connected data" sub="Where your records come from" />
        <div className="space-y-1.5">
          {ACCOUNTS.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12.5px]">
              <span className="text-ink">{a.institution} <span className="text-ink3">{a.number}</span></span>
              <span className="text-[11px] text-ink3">via {a.syncSource.split(' — ')[0]} · {fmtDate(a.lastSynced, 'short')}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" size="sm" icon="plus" className="mt-2">Add account</Button>
      </Card>

      <Card pad className="border-loss/25">
        <SectionHead title="Session" />
        <Button variant="danger" icon="lock" onClick={() => { app.setAuthenticated(false); app.setOnboarded(true) }}>Sign out</Button>
        <Button variant="ghost" size="sm" className="ml-2" onClick={() => { app.setOnboarded(false) }}>Replay onboarding</Button>
      </Card>
    </div>
  )
}

function SecRow({ icon, title, sub, right }: { icon: any; title: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface2 text-ink2"><Icon name={icon} size={16} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink">{title}</span>
        <span className="text-[11px] text-ink3">{sub}</span>
      </span>
      {right}
    </div>
  )
}
