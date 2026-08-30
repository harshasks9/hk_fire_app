import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { setProfileName, wipeStore } from '@/store/store'
import { Badge, Button, Card, Modal, SectionHead, Segmented } from '@/components/ui'
import { Icon } from '@/components/icons'

export default function SettingsPage() {
  const app = useApp()
  const store = useStore()
  const navigate = useNavigate()
  const personal = app.dataMode === 'personal'
  const [name, setName] = useState(store.profileName ?? '')
  const [nameSaved, setNameSaved] = useState(false)
  const [confirmWipe, setConfirmWipe] = useState(false)
  const [wipeText, setWipeText] = useState('')

  const recordCount =
    store.accounts.length + store.assets.length + store.liabilities.length +
    store.ledger.length + store.goals.length + store.watchlist.length

  return (
    <div className="fade-up mx-auto max-w-3xl space-y-5">
      <h1 className="px-1 font-display text-[20px] font-semibold tracking-tight text-ink md:hidden">Settings</h1>

      {/* Data mode */}
      <Card pad className={personal ? undefined : 'border-warn/50'}>
        <SectionHead
          title="Dataset"
          sub={personal
            ? 'You are on your own data. Every number is derived from records you added or imported.'
            : 'You are exploring the demo household — every number on screen is fictional.'}
        />
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={[{ value: 'personal', label: 'My data' }, { value: 'demo', label: 'Demo household' }]}
            value={app.dataMode}
            onChange={(m) => { app.setDataMode(m); navigate('/') }}
          />
          {!personal && <Badge tone="warn" icon="alert">Demo banner stays visible until you exit</Badge>}
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-ink3">
          The two datasets never mix: the demo household is read-only sample content for exploring the interface, and
          switching back never touches your records.
        </p>
      </Card>

      {/* Profile */}
      {personal && (
        <Card pad>
          <SectionHead title="Profile" sub="Only a display name — there is no account and nothing is sent anywhere" />
          <form
            onSubmit={(e) => { e.preventDefault(); setProfileName(name.trim()); setNameSaved(true); setTimeout(() => setNameSaved(false), 2000) }}
            className="flex gap-2"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-9 w-64 rounded-ctl border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-brand"
              maxLength={40}
            />
            <Button type="submit" variant="primary" disabled={!name.trim()}>{nameSaved ? 'Saved ✓' : 'Save'}</Button>
          </form>
        </Card>
      )}

      {/* Preferences — every control here actually changes behavior */}
      <Card pad>
        <SectionHead title="Preferences" sub="All three are applied immediately and remembered on this device" />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ink">Experience mode <span className="block text-[11px] text-ink3">Simple = calm summary · Pro = full detail</span></span>
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
            <span className="text-[13px] text-ink">Display currency <span className="block text-[11px] text-ink3">Converted at a static labeled rate, not a live feed</span></span>
            <Segmented options={[{ value: 'USD', label: 'USD $' }, { value: 'INR', label: 'INR ₹' }]} value={app.currency} onChange={(c) => app.setCurrency(c)} />
          </div>
        </div>
      </Card>

      {/* Data & privacy — the honest version */}
      <Card pad>
        <SectionHead title="Your data & privacy" sub="Plain facts about where things live" />
        <div className="space-y-2 text-[12.5px] leading-relaxed text-ink2">
          <p className="flex items-start gap-2"><Icon name="shield" size={14} className="mt-0.5 shrink-0 text-brand" />
            Everything is stored in this browser only ({recordCount.toLocaleString()} records right now). There is no server,
            no account and no sync — nothing you enter or import leaves this device.
          </p>
          <p className="flex items-start gap-2"><Icon name="alert" size={14} className="mt-0.5 shrink-0 text-warn" />
            That also means clearing browser data erases the store. <Link to="/reports" className="font-medium text-brand hover:underline">Export a backup</Link> and
            keep it somewhere safe — restoring it reproduces the app exactly.
          </p>
          <p className="flex items-start gap-2"><Icon name="lock" size={14} className="mt-0.5 shrink-0 text-ink3" />
            The lock screen is a convenience gate for this device, not account security. Real authentication, encryption
            at rest and sync arrive with the backend (docs/ARCHITECTURE-V1.md) — until then this page won't pretend otherwise.
          </p>
        </div>
        {personal && (
          <div className="mt-4 border-t border-line pt-3">
            <Button variant="danger" icon="x" onClick={() => setConfirmWipe(true)}>Erase all my data on this device</Button>
          </div>
        )}
      </Card>

      {/* Session */}
      <Card pad>
        <SectionHead title="Session" />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" icon="lock" onClick={() => { app.setAuthenticated(false); app.setOnboarded(true) }}>Lock app</Button>
          <Button variant="ghost" onClick={() => { app.setOnboarded(false) }}>Replay onboarding</Button>
        </div>
      </Card>

      <Modal open={confirmWipe} onClose={() => { setConfirmWipe(false); setWipeText('') }} title="Erase everything?">
        <p className="text-[13px] leading-relaxed text-ink2">
          All {recordCount.toLocaleString()} records — accounts, imports, goals, watchlist, activity — will be permanently
          deleted from this browser. A backup file is the only way back. Type <strong>ERASE</strong> to confirm.
        </p>
        <input
          value={wipeText}
          onChange={(e) => setWipeText(e.target.value)}
          className="mt-3 h-9 w-full rounded-ctl border border-line bg-surface px-3 text-[13px] outline-none focus:border-loss"
          placeholder="ERASE"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => { setConfirmWipe(false); setWipeText('') }}>Cancel</Button>
          <Button
            variant="danger"
            disabled={wipeText !== 'ERASE'}
            onClick={() => { wipeStore(); setConfirmWipe(false); setWipeText(''); navigate('/') }}
          >
            Erase everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}
