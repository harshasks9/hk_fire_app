import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { ledgerTotals, monthlyFlows, netWorthBreakdown, setupStatus } from '@/store/selectors'
import { LIVE_OPTION_BOOK, TRADING_WINDOW } from '@/data/fidelityTrading'
import { convert } from '@/data/fx'
import { fmtDate, fmtMoney } from '@/lib/format'
import { Badge, Button, Card, ProgressBar, SectionHead } from '@/components/ui'
import { StatCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function PersonalHome() {
  const app = useApp()
  const store = useStore()
  const c = app.currency
  const pro = app.mode === 'pro'

  const nw = useMemo(() => netWorthBreakdown(store, c), [store, c])
  const setup = useMemo(() => setupStatus(store), [store])
  const totals = useMemo(() => ledgerTotals(store), [store])
  const flows = useMemo(() => monthlyFlows(store), [store])
  const lastFlow = flows[flows.length - 1]

  const now = new Date()
  const upcoming = LIVE_OPTION_BOOK
    .map((p) => ({ ...p, days: Math.round((new Date(p.expiry + 'T12:00:00').getTime() - now.getTime()) / 86400000) }))
    .filter((p) => p.days >= 0 && p.days <= 30)
    .sort((a, b) => a.days - b.days)

  const hasAnything = store.accounts.length + store.assets.length + store.liabilities.length + store.ledger.length > 0

  return (
    <div className="fade-up space-y-5">
      {/* First-run welcome */}
      {!hasAnything && (
        <Card pad className="border-brand/30 bg-brand-soft/20">
          <div className="max-w-[62ch]">
            <h2 className="font-display text-[19px] font-semibold tracking-tight text-ink">
              {store.profileName ? `Welcome, ${store.profileName}.` : 'Welcome.'} This space is empty on purpose.
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink2">
              Meridian only shows numbers it can derive from records you add — it never invents a balance. Two ways to
              start: enter your accounts by hand, or import a Fidelity CSV and let the ledger build itself. (If you want
              to see what the app looks like fully populated, the labeled demo household is in Settings.)
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/balances"><Button variant="primary" icon="plus">Add accounts</Button></Link>
              <Link to="/documents"><Button icon="upload">Import a CSV</Button></Link>
            </div>
          </div>
        </Card>
      )}

      {/* Position */}
      {hasAnything && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link to="/balances" className="contents">
            <StatCard
              label="Net worth"
              value={nw.counts.accounts + nw.counts.assets + nw.counts.liabilities === 0 ? '—' : fmtMoney(nw.netWorth, c)}
              sub={
                nw.counts.accounts + nw.counts.assets + nw.counts.liabilities === 0
                  ? 'Add accounts to compute'
                  : nw.unknowns.length
                    ? `${nw.unknowns.length} record${nw.unknowns.length > 1 ? 's' : ''} missing a balance`
                    : `${nw.counts.accounts + nw.counts.assets} asset records − ${nw.counts.liabilities} liabilities`
              }
              icon="pie"
              tone={nw.unknowns.length ? 'warn' : 'neutral'}
            />
          </Link>
          <StatCard
            label="Dividends (imported)"
            value={totals.txns ? fmtMoney(convert(totals.dividends, 'USD', c), c) : '—'}
            sub={totals.txns ? `Across your ledger to ${fmtDate(totals.dateTo!, 'short')}` : 'Import a CSV to compute'}
            icon="coins"
            tone={totals.txns ? 'gain' : 'neutral'}
          />
          <StatCard
            label={lastFlow ? `Income in ${lastFlow.month}` : 'Monthly income'}
            value={lastFlow ? fmtMoney(convert(lastFlow.dividends + lastFlow.interest, 'USD', c), c) : '—'}
            sub={lastFlow ? 'Dividends + interest, transfers excluded' : 'Needs ledger data'}
            icon="wallet"
          />
          <StatCard
            label="Open option contracts"
            value={String(LIVE_OPTION_BOOK.reduce((s, p) => s + Math.abs(p.netQty), 0))}
            sub={`As of last import (${fmtDate(TRADING_WINDOW.to, 'short')})`}
            icon="layers"
          />
        </div>
      )}

      {/* Setup checklist */}
      {setup.nextSteps.length > 0 && hasAnything && (
        <Card pad>
          <SectionHead title="Make the numbers complete" sub="What the app still needs from you — nothing here is guessed in the meantime" />
          <div className="space-y-1.5">
            {setup.nextSteps.map((s, i) => (
              <p key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink2">
                <Icon name="chevronRight" size={13} className="mt-0.5 shrink-0 text-brand" />{s}
              </p>
            ))}
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming option expiries — real, from the imported book */}
        <Card pad>
          <SectionHead
            title="Coming due"
            sub={`Option contracts open at your last import — ${fmtDate(TRADING_WINDOW.to, 'medium')}`}
          />
          {upcoming.length === 0 ? (
            <p className="py-2 text-[12.5px] text-ink3">No imported option contracts expire in the next 30 days.</p>
          ) : (
            <div className="space-y-1.5">
              {upcoming.map((p, i) => (
                <Link key={i} to="/trading-review" className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface2">
                  <Badge tone={p.days <= 7 ? 'warn' : 'neutral'}>
                    {p.days === 0 ? 'Today' : p.days === 1 ? 'Tomorrow' : `${p.days}d`}
                  </Badge>
                  <span className="tnum text-[12.5px] font-medium text-ink">
                    {p.netQty > 0 ? '+' : ''}{p.netQty}× {p.under} ${p.strike} {p.type === 'call' ? 'C' : 'P'}
                  </span>
                  <span className="ml-auto text-[11px] text-ink3">{fmtDate(p.expiry, 'medium')}</span>
                </Link>
              ))}
              <p className="pt-1 text-[10.5px] leading-relaxed text-ink3">
                Positions may have changed since the last export — re-import a fresh CSV to update.
              </p>
            </div>
          )}
        </Card>

        {/* Goals or activity */}
        <Card pad>
          {store.goals.length > 0 ? (
            <>
              <SectionHead title="Goals" sub="Progress measured against current net worth" />
              <div className="space-y-3">
                {store.goals.slice(0, 3).map((g) => {
                  const cur = convert(nw.netWorth, c, g.currency)
                  const pct = g.target > 0 ? Math.max(0, Math.min(100, (cur / g.target) * 100)) : 0
                  return (
                    <Link key={g.id} to="/plan" className="block">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[12.5px] font-medium text-ink">{g.name}</span>
                        <span className="tnum text-[11.5px] text-ink2">{fmtMoney(cur, g.currency, { compact: true })} / {fmtMoney(g.target, g.currency, { compact: true })}</span>
                      </div>
                      <ProgressBar pct={pct} className="mt-1.5" />
                    </Link>
                  )
                })}
              </div>
            </>
          ) : (
            <>
              <SectionHead title="Recent activity" sub="Every change to your data, newest first" />
              {store.activity.length === 0 ? (
                <p className="py-2 text-[12.5px] text-ink3">Nothing yet — imports and edits will appear here.</p>
              ) : (
                <div className="space-y-1">
                  {store.activity.slice(0, 5).map((a) => (
                    <p key={a.id} className="flex items-start gap-2 text-[12px] leading-relaxed text-ink2">
                      <span className="tnum shrink-0 text-[10.5px] text-ink3">{fmtDate(a.at.slice(0, 10), 'short')}</span>
                      {a.text}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Trading review teaser — always real */}
      <Card pad className={cn(!pro && 'hidden sm:block')}>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-invert"><Icon name="trendUp" size={18} /></span>
          <div className="min-w-0 flex-1">
            <span className="text-[13.5px] font-semibold text-ink">Your trading review is ready</span>
            <p className="mt-0.5 text-[12px] leading-relaxed text-ink2">
              14 months of Fidelity history analyzed — strengths, weaknesses, the live LEAPS book and where the cash
              actually came from. Every figure reconciles to the broker's rows.
            </p>
          </div>
          <Link to="/trading-review"><Button variant="primary">Open</Button></Link>
        </div>
      </Card>
    </div>
  )
}
