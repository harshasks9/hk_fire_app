import React, { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/icons'
import { Badge, Segmented } from '@/components/ui'
import {
  MOBILE_NAV_PRO, MOBILE_NAV_SIMPLE, PAGE_TITLES, PRO_NAV, SIMPLE_NAV,
  PERSONAL_MOBILE_PRO, PERSONAL_MOBILE_SIMPLE, PERSONAL_PRO_NAV, PERSONAL_SIMPLE_NAV,
  type NavGroup,
} from './nav'
import { MEMBERS, HOUSEHOLD } from '@/data/household'
import { dataCompleteness } from '@/data/selectors'
import { buildNotifications } from './notifications'
import { buildPersonalNotifications } from './personalNotifications'
import { useStore } from '@/store/useStore'
import { setupStatus } from '@/store/selectors'
import { SearchOverlay } from './SearchOverlay'
import { NotificationCenter } from './NotificationCenter'
import { CopilotDrawer } from './CopilotDrawer'
import { UploadModal } from './UploadModal'

function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-brand text-invert">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 19 L4 8 M4 8 L9 14 L14 8 M14 8 L14 19" transform="translate(1.5 -1.2) scale(0.92)" />
          <path d="M3 21.5h18" opacity="0.65" />
        </svg>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-[17px] font-semibold tracking-tight text-ink">Meridian</div>
          <div className="mt-0.5 text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink3">Wealth OS</div>
        </div>
      )}
    </div>
  )
}

function SideNav({ groups, compact }: { groups: NavGroup[]; compact?: boolean }) {
  return (
    <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-2" aria-label="Primary">
      {groups.map((g, gi) => (
        <div key={gi} className="mb-1.5">
          {g.label && !compact && (
            <div className="px-2.5 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink3">{g.label}</div>
          )}
          {g.label && compact && <div className="mx-2 my-2 border-t border-line" />}
          {g.items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.to === '/'}
              title={compact ? it.label : undefined}
              className={({ isActive }) =>
                cn(
                  'group mb-0.5 flex items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13px] font-medium transition-colors',
                  compact && 'justify-center px-0',
                  isActive ? 'bg-brand-soft text-brand' : 'text-ink2 hover:bg-surface2 hover:text-ink',
                )
              }
            >
              <Icon name={it.icon} size={17} />
              {!compact && <span className="truncate">{it.label}</span>}
              {!compact && it.badge ? (
                <span className="tnum ml-auto rounded-full bg-loss-soft px-1.5 text-[10.5px] font-semibold text-loss">{it.badge}</span>
              ) : null}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

function PersonalSetupFooter({ compact }: { compact?: boolean }) {
  const store = useStore()
  const navigate = useNavigate()
  const setup = setupStatus(store)
  const done = 5 - Math.min(setup.nextSteps.length, 5)
  const pct = Math.round((done / 5) * 100)
  if (compact)
    return (
      <button onClick={() => navigate('/balances')} className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-ink2 hover:text-ink" title={`Setup ${pct}% complete`}>
        <Icon name="pie" size={16} />
      </button>
    )
  if (setup.nextSteps.length === 0)
    return (
      <div className="mx-3 mb-3 rounded-xl border border-line bg-surface2/60 p-3">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink2"><Icon name="check" size={12} className="text-gain" /> Data set up</div>
        <div className="mt-1 text-[10.5px] text-ink3">All records have values. Keep balances fresh.</div>
      </div>
    )
  return (
    <button onClick={() => navigate('/balances')} className="mx-3 mb-3 rounded-xl border border-line bg-surface2/60 p-3 text-left transition-colors hover:bg-surface2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ink2">Setup</span>
        <span className="tnum text-[11px] font-semibold text-ink">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 text-[10.5px] leading-snug text-ink3">{setup.nextSteps[0]} →</div>
    </button>
  )
}

function DataHealthFooter({ compact }: { compact?: boolean }) {
  const dq = dataCompleteness()
  const navigate = useNavigate()
  if (compact)
    return (
      <button onClick={() => navigate('/inbox')} className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface2 text-ink2 hover:text-ink" title={`Data completeness ${dq.pct}%`}>
        <Icon name="inbox" size={16} />
      </button>
    )
  return (
    <button onClick={() => navigate('/inbox')} className="mx-3 mb-3 rounded-xl border border-line bg-surface2/60 p-3 text-left transition-colors hover:bg-surface2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-ink2">Data completeness</span>
        <span className="tnum text-[11px] font-semibold text-ink">{dq.pct}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-brand" style={{ width: `${dq.pct}%` }} />
      </div>
      <div className="mt-1.5 text-[10.5px] text-ink3">{dq.issues} items need review →</div>
    </button>
  )
}

export default function AppShell() {
  const app = useApp()
  const store = useStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [curOpen, setCurOpen] = useState(false)

  const personal = app.dataMode === 'personal'
  const groups = personal
    ? (app.mode === 'simple' ? PERSONAL_SIMPLE_NAV : PERSONAL_PRO_NAV)
    : (app.mode === 'simple' ? SIMPLE_NAV : PRO_NAV)
  const basePath = '/' + (location.pathname.split('/')[1] ?? '')
  const title = PAGE_TITLES[basePath]?.[app.mode] ?? ''
  const notifs = useMemo(
    () => (personal ? buildPersonalNotifications(store) : buildNotifications()),
    [personal, store],
  )
  const unread = notifs.filter((n) => !app.readNotifs.includes(n.id)).length
  const member = MEMBERS.find((m) => m.id === app.memberId)
  const profileInitial = personal ? (store.profileName?.trim()[0]?.toUpperCase() ?? '•') : 'D'

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Demo banner — unmistakable whenever the demo dataset is active */}
      {!personal && (
        <div className="sticky top-0 z-40 flex items-center justify-center gap-3 bg-warn px-4 py-1.5 text-center">
          <span className="text-[12px] font-semibold text-[#3b2f0a]">
            Demo data — every number on screen belongs to a fictional household, not you.
          </span>
          <button
            onClick={() => { app.setDataMode('personal'); navigate('/') }}
            className="rounded-full border border-[#3b2f0a]/30 px-2.5 py-0.5 text-[11px] font-semibold text-[#3b2f0a] hover:bg-[#3b2f0a]/10"
          >
            Exit demo
          </button>
        </div>
      )}
      <div className="flex min-h-0 flex-1">
      {/* Desktop sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-surface lg:flex', !personal && 'top-[34px]')}>
        <div className="px-5 pb-3 pt-5"><BrandMark /></div>
        <div className="px-4 pb-2">
          <Segmented
            size="sm"
            className="w-full [&>button]:flex-1"
            options={[{ value: 'simple', label: 'Simple' }, { value: 'pro', label: 'Pro' }]}
            value={app.mode}
            onChange={(m) => app.setMode(m)}
          />
        </div>
        <SideNav groups={groups} />
        {personal ? <PersonalSetupFooter /> : <DataHealthFooter />}
      </aside>

      {/* Tablet rail */}
      <aside className={cn('fixed inset-y-0 left-0 z-30 hidden w-[64px] flex-col border-r border-line bg-surface md:flex lg:hidden', !personal && 'top-[34px]')}>
        <div className="flex justify-center px-2 pb-2 pt-4"><BrandMark compact /></div>
        <button
          onClick={() => app.setMode(app.mode === 'simple' ? 'pro' : 'simple')}
          className="mx-auto mb-1 mt-1 rounded-full border border-line px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-ink2 hover:text-ink"
          title="Switch mode"
        >
          {app.mode === 'simple' ? 'S' : 'Pro'}
        </button>
        <SideNav groups={groups} compact />
        {personal ? <PersonalSetupFooter compact /> : <DataHealthFooter compact />}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-[64px] lg:pl-[232px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6">
            <div className="flex items-center gap-2.5 md:hidden">
              <BrandMark compact />
            </div>
            <h1 className="hidden truncate font-display text-[17px] font-semibold tracking-tight text-ink md:block">{title}</h1>

            <div className="ml-auto flex items-center gap-1">
              {/* Search */}
              <button
                onClick={() => app.setSearchOpen(true)}
                className="hidden h-9 items-center gap-2 rounded-ctl border border-line bg-surface px-3 text-[12.5px] text-ink3 transition-colors hover:text-ink sm:flex"
              >
                <Icon name="search" size={15} />
                <span className="hidden md:inline">Search anything…</span>
                <kbd className="hidden rounded border border-line bg-surface2 px-1 text-[10px] text-ink3 md:inline">⌘K</kbd>
              </button>
              <button onClick={() => app.setSearchOpen(true)} className="rounded-ctl p-2 text-ink2 hover:bg-surface2 hover:text-ink sm:hidden" aria-label="Search">
                <Icon name="search" size={18} />
              </button>

              {/* Upload — personal mode goes to the real importer, demo opens the labeled simulation */}
              <button
                onClick={() => (personal ? navigate('/documents') : app.setUploadOpen(true))}
                className="hidden h-9 items-center gap-1.5 rounded-ctl bg-brand px-3 text-[12.5px] font-medium text-invert transition-colors hover:bg-brand2 sm:flex"
              >
                <Icon name="upload" size={15} />
                <span className="hidden lg:inline">{personal ? 'Import' : 'Upload'}</span>
              </button>

              <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

              {/* Household / member switcher — the household is demo fiction */}
              {!personal && (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => { setMemberOpen((v) => !v); setCurOpen(false) }}
                  className="flex h-9 items-center gap-1.5 rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink2 hover:text-ink"
                  aria-haspopup="menu"
                  aria-expanded={memberOpen}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-invert" style={{ background: member?.color ?? 'var(--m-brand)' }}>
                    {member?.short ?? 'A'}
                  </span>
                  <span className="hidden md:inline">{member?.name ?? 'All'}</span>
                  <Icon name="chevronDown" size={13} />
                </button>
                {memberOpen && (
                  <div className="absolute right-0 top-11 z-40 w-56 rounded-xl border border-line bg-surface p-1.5 shadow-pop" role="menu">
                    <div className="px-2.5 py-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">{HOUSEHOLD.name}</div>
                    {[undefined, ...MEMBERS.map((m) => m.id)].map((id) => {
                      const m = MEMBERS.find((x) => x.id === id)
                      return (
                        <button
                          key={id ?? 'all'}
                          onClick={() => { app.setMemberId(id); setMemberOpen(false) }}
                          className={cn('flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-surface2', app.memberId === id && 'bg-brand-soft text-brand')}
                          role="menuitem"
                        >
                          <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full text-[10px] font-bold text-invert" style={{ background: m?.color ?? 'var(--m-brand)' }}>
                            {m?.short ?? 'A'}
                          </span>
                          {m ? m.name : 'Whole household'}
                          {m?.role === 'joint' && <Badge tone="neutral" className="ml-auto">Shared</Badge>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              )}

              {/* Currency */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => { setCurOpen((v) => !v); setMemberOpen(false) }}
                  className="tnum flex h-9 items-center gap-1 rounded-ctl border border-line bg-surface px-2.5 text-[12.5px] font-medium text-ink2 hover:text-ink"
                  aria-haspopup="menu"
                  aria-expanded={curOpen}
                >
                  {app.currency}
                  <Icon name="chevronDown" size={13} />
                </button>
                {curOpen && (
                  <div className="absolute right-0 top-11 z-40 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-pop" role="menu">
                    {(['USD', 'INR'] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => { app.setCurrency(c); setCurOpen(false) }}
                        className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-surface2', app.currency === c && 'bg-brand-soft text-brand')}
                        role="menuitem"
                      >
                        <span>{c === 'USD' ? 'US Dollar' : 'Indian Rupee'}</span>
                        <span className="tnum text-ink3">{c === 'USD' ? '$' : '₹'}</span>
                      </button>
                    ))}
                    <div className="mt-1 border-t border-line px-2.5 py-1.5 text-[10.5px] text-ink3">1 USD = ₹86.80 · Jul 20</div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <button onClick={() => app.setNotifOpen(true)} className="relative rounded-ctl p-2 text-ink2 hover:bg-surface2 hover:text-ink" aria-label={`Notifications (${unread} unread)`}>
                <Icon name="bell" size={18} />
                {unread > 0 && (
                  <span className="tnum absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-loss px-1 text-[9.5px] font-bold text-invert">{unread}</span>
                )}
              </button>

              {/* Copilot */}
              <button onClick={() => app.setCopilotOpen(true)} className="rounded-ctl p-2 text-brass hover:bg-brass-soft" aria-label="Financial copilot">
                <Icon name="sparkles" size={18} />
              </button>

              {/* Theme */}
              <button onClick={app.toggleTheme} className="hidden rounded-ctl p-2 text-ink2 hover:bg-surface2 hover:text-ink sm:block" aria-label="Toggle theme">
                <Icon name={app.theme === 'light' ? 'moon' : 'sun'} size={17} />
              </button>

              {/* Profile */}
              <button onClick={() => navigate('/settings')} className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[12px] font-bold text-invert" aria-label="Account & security">
                {profileInitial}
              </button>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-24 pt-5 sm:px-6 md:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md md:hidden" aria-label="Mobile">
        <div className="grid grid-cols-5 items-center">
          {(personal ? (app.mode === 'simple' ? PERSONAL_MOBILE_SIMPLE : PERSONAL_MOBILE_PRO) : app.mode === 'simple' ? MOBILE_NAV_SIMPLE : MOBILE_NAV_PRO).slice(0, 2).map((it) => (
            <MobileTab key={it.to} to={it.to} icon={it.icon} label={it.label} />
          ))}
          <div className="flex justify-center py-1.5">
            <button
              onClick={() => (personal ? navigate('/documents') : app.setUploadOpen(true))}
              className="flex h-11 w-11 -translate-y-3 items-center justify-center rounded-full bg-brand text-invert shadow-pop"
              aria-label={personal ? 'Import data' : 'Upload a document'}
            >
              <Icon name="upload" size={19} />
            </button>
          </div>
          {(personal ? (app.mode === 'simple' ? PERSONAL_MOBILE_SIMPLE : PERSONAL_MOBILE_PRO) : app.mode === 'simple' ? MOBILE_NAV_SIMPLE : MOBILE_NAV_PRO).slice(2, 3).map((it) => (
            <MobileTab key={it.to} to={it.to} icon={it.icon} label={it.label} />
          ))}
          <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-ink2">
            <Icon name="menu" size={19} />
            <span className="text-[9.5px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal>
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="pb-safe fade-up absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface p-4 shadow-pop">
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line2" />
            <div className="mb-3 flex items-center justify-between">
              <span className="font-display text-[15px] font-semibold">Menu</span>
              <Segmented
                size="sm"
                options={[{ value: 'simple', label: 'Simple' }, { value: 'pro', label: 'Pro' }]}
                value={app.mode}
                onChange={(m) => { app.setMode(m) }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {groups.flatMap((g) => g.items).map((it) => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end={it.to === '/'}
                  onClick={() => setMoreOpen(false)}
                  className={({ isActive }) =>
                    cn('flex flex-col items-center gap-1.5 rounded-xl border border-line px-2 py-3 text-center text-[11px] font-medium', isActive ? 'border-brand bg-brand-soft text-brand' : 'text-ink2')
                  }
                >
                  <Icon name={it.icon} size={19} />
                  {it.label}
                </NavLink>
              ))}
              <button
                onClick={() => { setMoreOpen(false); navigate('/settings') }}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-line px-2 py-3 text-center text-[11px] font-medium text-ink2"
              >
                <Icon name="settings" size={19} />
                Settings
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-xl border border-line p-3">
              <span className="text-[12px] text-ink2">Display currency</span>
              <Segmented size="sm" options={[{ value: 'USD', label: 'USD' }, { value: 'INR', label: 'INR' }]} value={app.currency} onChange={(c) => app.setCurrency(c)} />
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Global overlays */}
      <SearchOverlay />
      <NotificationCenter notifications={notifs} />
      <CopilotDrawer />
      <UploadModal />
    </div>
  )
}

function MobileTab({ to, icon, label }: { to: string; icon: any; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) => cn('flex flex-col items-center gap-0.5 py-2', isActive ? 'text-brand' : 'text-ink2')}
    >
      <Icon name={icon} size={19} />
      <span className="text-[9.5px] font-medium">{label}</span>
    </NavLink>
  )
}
