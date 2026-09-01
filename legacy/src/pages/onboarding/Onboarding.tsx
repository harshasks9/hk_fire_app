import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp, type DataMode, type Mode } from '@/state/AppContext'
import type { CurrencyCode } from '@/data/types'
import { Button } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons'
import { cn } from '@/lib/cn'

/* Three questions, all real: dataset, experience mode, display currency.
   Every choice on this screen changes actual behavior and is persisted —
   the old multi-step tour collected preferences it silently discarded,
   so it was removed. */

export default function Onboarding() {
  const app = useApp()
  const navigate = useNavigate()
  const [dataMode, setDataMode] = useState<DataMode>(app.dataMode)
  const [mode, setMode] = useState<Mode>(app.mode)
  const [currency, setCurrency] = useState<CurrencyCode>(app.currency)

  const finish = () => {
    app.setDataMode(dataMode)
    app.setMode(mode)
    app.setCurrency(currency)
    app.setOnboarded(true)
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-invert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19 L4 8 M4 8 L9 14 L14 8 M14 8 L14 19" transform="translate(1.5 -1.2) scale(0.92)" />
              <path d="M3 21.5h18" opacity="0.65" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-tight text-ink">Welcome to Meridian</h1>
            <p className="text-[12px] text-ink2">Three choices — each one takes effect immediately and can be changed in Settings.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Section title="Which dataset?" sub="They never mix.">
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice
                icon="pie"
                title="My data"
                body="Starts empty. Add accounts by hand or import broker CSVs — nothing is ever invented for you."
                active={dataMode === 'personal'}
                onClick={() => setDataMode('personal')}
              />
              <Choice
                icon="eye"
                title="Demo household"
                body="A fictional family with everything filled in, behind a permanent demo banner. For exploring the interface."
                active={dataMode === 'demo'}
                onClick={() => setDataMode('demo')}
              />
            </div>
          </Section>

          <Section title="How much detail?" sub="Switchable any time from the sidebar.">
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice icon="home" title="Simple" body="A calm summary: position, income, what needs attention." active={mode === 'simple'} onClick={() => setMode('simple')} />
              <Choice icon="grid" title="Pro" body="Full detail: ledgers, analytics, research, projections." active={mode === 'pro'} onClick={() => setMode('pro')} />
            </div>
          </Section>

          <Section title="Display currency" sub="Mixed-currency records convert at a static, labeled rate.">
            <div className="grid gap-2 sm:grid-cols-2">
              <Choice icon="coins" title="US Dollar $" body="Show totals in USD." active={currency === 'USD'} onClick={() => setCurrency('USD')} />
              <Choice icon="coins" title="Indian Rupee ₹" body="Show totals in INR." active={currency === 'INR'} onClick={() => setCurrency('INR')} />
            </div>
          </Section>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="max-w-[36ch] text-[11px] leading-relaxed text-ink3">
            No account is created and nothing leaves this browser.
          </p>
          <Button variant="primary" size="lg" onClick={finish}>
            {dataMode === 'personal' ? 'Start with my data' : 'Explore the demo'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="mb-2.5">
        <span className="text-[13.5px] font-semibold text-ink">{title}</span>
        <span className="ml-2 text-[11.5px] text-ink3">{sub}</span>
      </div>
      {children}
    </div>
  )
}

function Choice({ icon, title, body, active, onClick }: { icon: IconName; title: string; body: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-xl border p-3 text-left transition-colors',
        active ? 'border-brand bg-brand-soft/40' : 'border-line hover:bg-surface2',
      )}
    >
      <span className="flex items-center gap-2">
        <Icon name={icon} size={15} className={active ? 'text-brand' : 'text-ink3'} />
        <span className="text-[13px] font-semibold text-ink">{title}</span>
        {active && <Icon name="check" size={14} className="ml-auto text-brand" />}
      </span>
      <span className="mt-1 block text-[11.5px] leading-relaxed text-ink2">{body}</span>
    </button>
  )
}
