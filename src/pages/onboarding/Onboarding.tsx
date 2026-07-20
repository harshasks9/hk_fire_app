import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { Button, Badge, ProgressBar, Toggle } from '@/components/ui'
import { Icon, type IconName } from '@/components/icons'
import { cn } from '@/lib/cn'

const STEPS = [
  'welcome', 'household', 'currency', 'residency', 'goals', 'risk', 'principles',
  'mode', 'proSetup', 'accounts', 'upload', 'property', 'review',
] as const
type Step = (typeof STEPS)[number]

export default function Onboarding() {
  const app = useApp()
  const navigate = useNavigate()
  const [stepIdx, setStepIdx] = useState(0)
  const [household, setHousehold] = useState('Kandala Household')
  const [partner, setPartner] = useState('Meera')
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD')
  const [countries, setCountries] = useState<string[]>(['US', 'IN'])
  const [goals, setGoals] = useState<string[]>(['fi'])
  const [risk, setRisk] = useState('growth')
  const [principles, setPrinciples] = useState<string[]>(['reserve', 'concentration'])
  const [mode, setMode] = useState<'simple' | 'pro'>('simple')
  const [accounts, setAccounts] = useState<string[]>(['Fidelity'])
  const [uploaded, setUploaded] = useState(false)
  const [uploadPct, setUploadPct] = useState(0)
  const [property, setProperty] = useState(false)
  const [proSetup, setProSetup] = useState({ ownership: true, costBasis: 'SpecID', benchmark: 'S&P 500 TR', entities: false, precedence: true })

  const step = STEPS[stepIdx]
  const visibleSteps = useMemo(() => STEPS.filter((s) => s !== 'proSetup' || mode === 'pro'), [mode])
  const visibleIdx = visibleSteps.indexOf(step)
  const pct = (visibleIdx / (visibleSteps.length - 1)) * 100

  const go = (delta: number) => {
    let i = stepIdx + delta
    while (STEPS[i] === 'proSetup' && mode !== 'pro') i += delta
    setStepIdx(Math.max(0, Math.min(STEPS.length - 1, i)))
  }

  const finish = () => {
    app.setMode(mode)
    app.setCurrency(currency)
    app.setOnboarded(true)
    navigate('/')
  }

  const startUpload = () => {
    setUploaded(true)
    setUploadPct(0)
    const t = setInterval(() => {
      setUploadPct((p) => {
        if (p >= 100) { clearInterval(t); return 100 }
        return p + 12
      })
    }, 220)
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-invert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 19 L4 8 M4 8 L9 14 L14 8 M14 8 L14 19" transform="translate(1.5 -1.2) scale(0.92)" /><path d="M3 21.5h18" opacity="0.65" /></svg>
          </div>
          <span className="font-display text-[16px] font-semibold text-ink">Meridian</span>
        </div>
        {step !== 'welcome' && step !== 'review' && (
          <button onClick={() => go(1)} className="text-[12.5px] font-medium text-ink3 hover:text-ink">Skip for now</button>
        )}
      </div>
      <div className="px-5"><ProgressBar pct={pct} height="h-1" /></div>

      <div className="flex flex-1 items-start justify-center px-5 py-8 sm:items-center">
        <div className="fade-up w-full max-w-lg" key={step}>
          {step === 'welcome' && (
            <Screen title="Let's build your financial picture" sub="One place for everything you own, owe, earn and plan — across brokerages, property, insurance and two countries.">
              <div className="grid gap-2.5">
                {[
                  ['upload', 'Upload any statement — we read it and reconcile it'],
                  ['shield', 'Every value shows its source and confidence'],
                  ['sparkles', 'Explanations and suggestions, never black boxes'],
                ].map(([icon, text]) => (
                  <div key={text} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                    <Icon name={icon as IconName} size={17} className="shrink-0 text-brand" />
                    <span className="text-[13px] text-ink2">{text}</span>
                  </div>
                ))}
              </div>
              <Nav onNext={() => go(1)} nextLabel="Get started" first />
            </Screen>
          )}

          {step === 'household' && (
            <Screen title="Who is this workspace for?" sub="You can add a partner, children or legal entities — each account and asset gets an owner.">
              <label className="block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink2">Household name</span>
                <input value={household} onChange={(e) => setHousehold(e.target.value)} className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-[14px] outline-none focus:border-brand" />
              </label>
              <label className="mt-3.5 block">
                <span className="mb-1.5 block text-[12px] font-medium text-ink2">Partner (optional)</span>
                <input value={partner} onChange={(e) => setPartner(e.target.value)} placeholder="Name" className="h-11 w-full rounded-ctl border border-line bg-surface px-3.5 text-[14px] outline-none focus:border-brand" />
              </label>
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'currency' && (
            <Screen title="What's your base currency?" sub="Everything can be viewed in any currency; this one anchors your net worth.">
              <div className="grid grid-cols-2 gap-3">
                {(['USD', 'INR'] as const).map((c) => (
                  <ChoiceCard key={c} active={currency === c} onClick={() => setCurrency(c)} title={c === 'USD' ? '$ US Dollar' : '₹ Indian Rupee'} sub={c === 'USD' ? 'United States' : 'India'} />
                ))}
              </div>
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'residency' && (
            <Screen title="Where do you have financial ties?" sub="Countries determine tax rules, deadlines and document types.">
              <div className="grid grid-cols-2 gap-3">
                {[['US', '🇺🇸 United States'], ['IN', '🇮🇳 India'], ['GB', '🇬🇧 United Kingdom'], ['SG', '🇸🇬 Singapore']].map(([code, label]) => (
                  <ChoiceCard key={code} active={countries.includes(code)} onClick={() => setCountries((c) => (c.includes(code) ? c.filter((x) => x !== code) : [...c, code]))} title={label} multi />
                ))}
              </div>
              {countries.includes('IN') && countries.includes('US') && (
                <p className="mt-3 rounded-lg bg-info-soft p-3 text-[12px] leading-relaxed text-ink2">
                  We'll track NRI residency days, DTAA credits, TDS withholding and both tax calendars.
                </p>
              )}
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'goals' && (
            <Screen title="What are you working toward?" sub="Pick any — you can refine targets later.">
              <div className="grid grid-cols-2 gap-3">
                {[['fi', 'peak', 'Financial independence'], ['college', 'book', "Children's education"], ['home', 'home', 'Buy or upgrade a home'], ['travel', 'compass', 'Sabbatical / travel'], ['income', 'coins', 'Passive income floor'], ['legacy', 'shield', 'Estate & legacy']].map(([id, icon, label]) => (
                  <ChoiceCard key={id} active={goals.includes(id)} onClick={() => setGoals((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))} icon={icon as IconName} title={label} multi />
                ))}
              </div>
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'risk' && (
            <Screen title="How do you think about risk?" sub="This calibrates recommendations — it never trades for you.">
              {[
                ['preserve', 'Preserve', 'Protect what exists; income and stability first'],
                ['balanced', 'Balanced', 'Grow steadily, cushion the drawdowns'],
                ['growth', 'Growth', 'Long horizon; comfortable with volatility'],
                ['aggressive', 'Aggressive', 'Concentrated bets, options, private deals'],
              ].map(([id, title, sub]) => (
                <ChoiceCard key={id} active={risk === id} onClick={() => setRisk(id)} title={title} sub={sub} className="mb-2.5 w-full" />
              ))}
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'principles' && (
            <Screen title="Any personal rules?" sub="Meridian checks your finances against these and flags drift — like a policy statement.">
              {[
                ['reserve', 'Keep 6 months of expenses liquid'],
                ['concentration', 'No single stock above 5% of investable assets'],
                ['re40', 'Real estate below 40% of net worth'],
                ['nolev', 'No margin debt for investing'],
                ['esg', 'Avoid tobacco & weapons exposure'],
              ].map(([id, label]) => (
                <button key={id} onClick={() => setPrinciples((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))} className={cn('mb-2 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[13px] transition-colors', principles.includes(id) ? 'border-brand bg-brand-soft text-ink' : 'border-line bg-surface text-ink2')}>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', principles.includes(id) ? 'border-brand bg-brand text-invert' : 'border-line2')}>
                    {principles.includes(id) && <Icon name="check" size={12} />}
                  </span>
                  {label}
                </button>
              ))}
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'mode' && (
            <Screen title="Choose your experience" sub="Same data underneath — switch anytime with one click.">
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  active={mode === 'simple'} onClick={() => setMode('simple')}
                  title="Simple" sub="A calm daily briefing: net worth, what changed, what needs attention. Understandable in one minute."
                  badge="Most people start here"
                />
                <ChoiceCard
                  active={mode === 'pro'} onClick={() => setMode('pro')}
                  title="Pro" sub="A full wealth workstation: tax lots, options greeks, underwriting, attribution, scenarios and audit trails."
                />
              </div>
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'proSetup' && (
            <Screen title="Pro setup" sub="Optional precision controls. Sensible defaults are already applied — skip freely.">
              <div className="space-y-2.5">
                <ProRow title="Track ownership percentages" sub="Split assets across members and entities" right={<Toggle checked={proSetup.ownership} onChange={(v) => setProSetup({ ...proSetup, ownership: v })} label="Ownership" />} />
                <ProRow title="Cost-basis method" sub="Applied per account; can be overridden" right={
                  <select value={proSetup.costBasis} onChange={(e) => setProSetup({ ...proSetup, costBasis: e.target.value })} className="h-9 rounded-ctl border border-line bg-surface px-2 text-[12.5px] outline-none">
                    {['SpecID', 'FIFO', 'LIFO', 'Average'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                } />
                <ProRow title="Benchmark" sub="For performance comparison" right={
                  <select value={proSetup.benchmark} onChange={(e) => setProSetup({ ...proSetup, benchmark: e.target.value })} className="h-9 rounded-ctl border border-line bg-surface px-2 text-[12.5px] outline-none">
                    {['S&P 500 TR', 'Nifty 50 TR', '70/30 Global Blend'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                } />
                <ProRow title="Entities & trusts" sub="Add LLCs, trusts or HUFs as owners" right={<Toggle checked={proSetup.entities} onChange={(v) => setProSetup({ ...proSetup, entities: v })} label="Entities" />} />
                <ProRow title="Source precedence" sub="Monthly statements override activity exports" right={<Toggle checked={proSetup.precedence} onChange={(v) => setProSetup({ ...proSetup, precedence: v })} label="Precedence" />} />
              </div>
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'accounts' && (
            <Screen title="Where do you invest?" sub="Pick institutions — you'll feed them with statements, no credentials required.">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {['Fidelity', 'Schwab', 'IBKR', 'Vanguard', 'Zerodha', 'HDFC AMC', 'Chase', 'E*TRADE', 'Other'].map((b) => (
                  <ChoiceCard key={b} active={accounts.includes(b)} onClick={() => setAccounts((a) => (a.includes(b) ? a.filter((x) => x !== b) : [...a, b]))} title={b} multi compact />
                ))}
              </div>
              <p className="mt-3 text-[11.5px] text-ink3">Statements beat screen-scraping: they're authoritative, complete, and you stay in control.</p>
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'upload' && (
            <Screen title="Add your first statement" sub="This is the moment Meridian comes alive — one PDF builds your whole portfolio.">
              {!uploaded ? (
                <button onClick={startUpload} className="flex w-full flex-col items-center rounded-2xl border-2 border-dashed border-line2 bg-surface2/50 px-6 py-12 transition-colors hover:border-brand hover:bg-brand-soft">
                  <Icon name="upload" size={28} className="mb-3 text-ink3" />
                  <span className="text-[13.5px] font-medium text-ink">Drop a statement or tap to simulate</span>
                  <span className="mt-1 text-[11.5px] text-ink3">Fidelity_Statement_Jun2026.pdf · sample</span>
                </button>
              ) : (
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand"><Icon name="file" size={17} /></span>
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-ink">Fidelity_Statement_Jun2026.pdf</div>
                      <div className="text-[11px] text-ink3">
                        {uploadPct < 30 ? 'Classifying…' : uploadPct < 60 ? 'Extracting 14 positions…' : uploadPct < 95 ? 'Reconciling…' : '14 positions, 23 transactions, 1 cash balance ✓'}
                      </div>
                    </div>
                    {uploadPct >= 100 && <Badge tone="gain" icon="check">Done</Badge>}
                  </div>
                  <ProgressBar pct={uploadPct} className="mt-3" />
                </div>
              )}
              <Nav onBack={() => go(-1)} onNext={() => go(1)} nextDisabled={uploaded && uploadPct < 100} />
            </Screen>
          )}

          {step === 'property' && (
            <Screen title="Do you own property?" sub="Add homes, rentals and their mortgages — or skip and add later from Real Estate.">
              <div className="grid gap-3 sm:grid-cols-2">
                <ChoiceCard active={property} onClick={() => setProperty(true)} icon="building" title="Yes, add property" sub="We'll capture value, mortgage, rent and insurance from documents" />
                <ChoiceCard active={!property} onClick={() => setProperty(false)} icon="chevronRight" title="Not now" sub="Skip — everything can be added later" />
              </div>
              {property && (
                <div className="mt-3 space-y-2.5 rounded-xl border border-line bg-surface p-4">
                  <input placeholder="Property nickname (e.g. Queen Anne Residence)" className="h-10 w-full rounded-ctl border border-line bg-bg px-3 text-[13px] outline-none focus:border-brand" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <input placeholder="Estimated value" className="h-10 w-full rounded-ctl border border-line bg-bg px-3 text-[13px] tnum outline-none focus:border-brand" />
                    <input placeholder="Mortgage balance" className="h-10 w-full rounded-ctl border border-line bg-bg px-3 text-[13px] tnum outline-none focus:border-brand" />
                  </div>
                  <p className="text-[11px] text-ink3">Estimates are fine — a closing statement or appraisal upgrades them to verified later.</p>
                </div>
              )}
              <Nav onBack={() => go(-1)} onNext={() => go(1)} />
            </Screen>
          )}

          {step === 'review' && (
            <Screen title="Your workspace is ready" sub="Here's what we set up — everything is editable later.">
              <div className="space-y-2 rounded-2xl border border-line bg-surface p-4">
                <ReviewRow k="Household" v={`${household} — you${partner ? ` + ${partner}` : ''}`} />
                <ReviewRow k="Base currency" v={currency} />
                <ReviewRow k="Countries" v={countries.join(' · ')} />
                <ReviewRow k="Goals" v={`${goals.length} selected`} />
                <ReviewRow k="Risk stance" v={risk[0].toUpperCase() + risk.slice(1)} />
                <ReviewRow k="Principles" v={`${principles.length} rules active`} />
                <ReviewRow k="Mode" v={mode === 'simple' ? 'Simple — daily briefing' : 'Pro — full workstation'} />
                <ReviewRow k="First statement" v={uploaded ? '14 positions imported (demo data)' : 'Pending — sample data loaded'} />
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-ink2">
                This demo starts with a realistic sample household so every screen is alive. Your first real upload replaces it.
              </p>
              <Nav onBack={() => go(-1)} onNext={finish} nextLabel="Open my dashboard" />
            </Screen>
          )}
        </div>
      </div>
    </div>
  )
}

function Screen({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-[24px] font-semibold leading-tight tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink2">{sub}</p>
      <div className="mt-6">{children}</div>
    </div>
  )
}

function Nav({ onBack, onNext, nextLabel = 'Continue', nextDisabled, first }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean; first?: boolean }) {
  return (
    <div className={cn('mt-7 flex items-center gap-2.5', first && 'mt-8')}>
      {onBack && <Button variant="ghost" size="lg" onClick={onBack} icon="chevronLeft">Back</Button>}
      <Button variant="primary" size="lg" className="flex-1" onClick={onNext} disabled={nextDisabled}>{nextLabel}</Button>
    </div>
  )
}

function ChoiceCard({ active, onClick, title, sub, icon, badge, multi, compact, className }: {
  active: boolean; onClick: () => void; title: string; sub?: string; icon?: IconName; badge?: string; multi?: boolean; compact?: boolean; className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'relative rounded-xl border text-left transition-all',
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
        active ? 'border-brand bg-brand-soft shadow-card' : 'border-line bg-surface hover:border-line2',
        className,
      )}
    >
      {multi && (
        <span className={cn('absolute right-2.5 top-2.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border', active ? 'border-brand bg-brand text-invert' : 'border-line2')}>
          {active && <Icon name="check" size={10} />}
        </span>
      )}
      {icon && <Icon name={icon} size={18} className={cn('mb-1.5', active ? 'text-brand' : 'text-ink3')} />}
      <span className={cn('block font-semibold', compact ? 'text-[12.5px]' : 'text-[14px]', active ? 'text-brand' : 'text-ink')}>{title}</span>
      {sub && <span className="mt-0.5 block text-[11.5px] leading-relaxed text-ink2">{sub}</span>}
      {badge && <Badge tone="brass" className="mt-2">{badge}</Badge>}
    </button>
  )
}

function ProRow({ title, sub, right }: { title: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <span><span className="block text-[13px] font-medium text-ink">{title}</span><span className="text-[11px] text-ink3">{sub}</span></span>
      {right}
    </div>
  )
}

function ReviewRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 text-[13px] last:border-0">
      <span className="text-ink2">{k}</span>
      <span className="font-medium text-ink">{v}</span>
    </div>
  )
}
