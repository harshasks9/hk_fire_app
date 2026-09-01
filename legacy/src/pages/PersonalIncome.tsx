import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { useStore } from '@/store/useStore'
import { incomeBySymbol, ledgerTotals, monthlyFlows } from '@/store/selectors'
import { convert } from '@/data/fx'
import { fmtDate, fmtMoney } from '@/lib/format'
import { Button, Card, EmptyState, KV, SectionHead } from '@/components/ui'
import { StatCard } from '@/components/finance'
import { cn } from '@/lib/cn'

export default function PersonalIncome() {
  const app = useApp()
  const store = useStore()
  const c = app.currency
  const pro = app.mode === 'pro'

  const totals = useMemo(() => ledgerTotals(store), [store])
  const flows = useMemo(() => monthlyFlows(store), [store])
  const bySym = useMemo(() => incomeBySymbol(store), [store])
  const cv = (n: number) => convert(n, 'USD', c)

  if (store.ledger.length === 0) {
    return (
      <Card pad={false} className="fade-up">
        <EmptyState
          icon="coins"
          title="Income needs your transaction history"
          body="Dividends, interest and option premium are computed from imported broker rows — never estimated. Import your Fidelity CSV and this page fills itself."
          action={<Link to="/documents"><Button variant="primary" icon="upload">Import a CSV</Button></Link>}
        />
      </Card>
    )
  }

  const monthsWithIncome = flows.filter((f) => f.dividends + f.interest !== 0)
  const avgMonthly = monthsWithIncome.length
    ? monthsWithIncome.reduce((s, f) => s + f.dividends + f.interest, 0) / monthsWithIncome.length
    : 0
  const maxBar = Math.max(...flows.map((f) => Math.max(f.dividends + f.interest, Math.abs(f.optionPremium))), 1)

  return (
    <div className="fade-up space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Dividends collected" value={fmtMoney(cv(totals.dividends), c)} sub={`${fmtDate(totals.dateFrom!, 'short')} → ${fmtDate(totals.dateTo!, 'medium')}`} icon="coins" tone="gain" />
        <StatCard label="Interest (net)" value={fmtMoney(cv(totals.interest), c)} sub="Money-market and margin interest rows" icon="wallet" tone={totals.interest >= 0 ? 'gain' : 'loss'} />
        <StatCard label="Average income month" value={fmtMoney(cv(avgMonthly), c)} sub={`Across ${monthsWithIncome.length} months with income`} icon="calendar" />
        <StatCard label="Withholding" value={fmtMoney(cv(totals.taxes), c)} sub="Tax rows in the ledger — see Trading Review for the analysis" icon="scale" tone="loss" />
      </div>

      <Card pad>
        <SectionHead title="Income by month" sub="Dividends + interest per calendar month. Transfers between your accounts are never counted as income." />
        <div className="space-y-1.5">
          {flows.map((f) => {
            const inc = f.dividends + f.interest
            return (
              <div key={f.month} className="flex items-center gap-2">
                <span className="tnum w-16 shrink-0 text-[11.5px] font-medium text-ink">{f.month}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-gain/75" style={{ width: `${(Math.max(inc, 0) / maxBar) * 100}%` }} />
                </div>
                <span className="tnum w-24 shrink-0 text-right text-[11.5px] font-medium text-ink">{fmtMoney(cv(inc), c)}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Who pays you" sub="Dividend totals per symbol, from your ledger rows" />
          <div className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {bySym.slice(0, 16).map((s) => (
              <KV key={s.symbol} k={`${s.symbol} · ${s.count}×`} v={fmtMoney(cv(s.dividends), c, { decimals: 2 })} />
            ))}
          </div>
          {bySym.length > 16 && <p className="mt-2 text-[11px] text-ink3">{bySym.length - 16} more in the <Link className="text-brand hover:underline" to="/ledger">ledger</Link>.</p>}
        </Card>
        <Card pad>
          <SectionHead title="Option premium cash by month" sub="Net cash across option trades — open contracts are not marked to market" />
          <div className="space-y-1.5">
            {flows.filter((f) => f.optionPremium !== 0).map((f) => (
              <div key={f.month} className="flex items-center gap-2">
                <span className="tnum w-16 shrink-0 text-[11.5px] font-medium text-ink">{f.month}</span>
                <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-surface2">
                  <div
                    className={cn('absolute top-0 h-full', f.optionPremium >= 0 ? 'left-1/2 rounded-r-full bg-gain/75' : 'right-1/2 rounded-l-full bg-loss/60')}
                    style={{ width: `${(Math.abs(f.optionPremium) / maxBar) * 50}%` }}
                  />
                  <div className="absolute left-1/2 top-0 h-full w-px bg-line" />
                </div>
                <span className={cn('tnum w-24 shrink-0 text-right text-[11.5px] font-medium', f.optionPremium >= 0 ? 'text-gain' : 'text-loss')}>{fmtMoney(cv(f.optionPremium), c)}</span>
              </div>
            ))}
          </div>
          {pro && (
            <p className="mt-3 border-t border-line pt-2.5 text-[11px] leading-relaxed text-ink3">
              Negative months are usually LEAPS purchases, not losses — cash out now, value carried in open contracts.
              The settled-vs-live split lives in the <Link className="text-brand hover:underline" to="/trading-review">Trading Review</Link>.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}
