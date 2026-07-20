import React, { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '@/state/AppContext'
import { POSITIONS } from '@/data/portfolio'
import { INSTRUMENTS, priceHistory, dayChangePct } from '@/data/instruments'
import { accountById } from '@/data/household'
import { INCOME_EVENTS } from '@/data/income'
import { SUGGESTIONS } from '@/data/suggestions'
import { DOCUMENTS } from '@/data/documents'
import { OPTION_STRATEGIES, STRATEGY_LABELS } from '@/data/options'
import { convert } from '@/data/fx'
import { fmtMoney, fmtNum, fmtPct, fmtDate, daysAgo } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, Button, ProvenanceChip, EmptyState, KV } from '@/components/ui'
import { AreaChart, RangeBar } from '@/components/charts'
import { SuggestionCard } from '@/components/finance'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'

export default function PositionDetail() {
  const { symbol } = useParams<{ symbol: string }>()
  const app = useApp()
  const navigate = useNavigate()
  const c = app.currency
  const inst = symbol ? INSTRUMENTS[symbol] : undefined
  const positions = useMemo(() => POSITIONS.filter((p) => p.symbol === symbol), [symbol])

  if (!inst || positions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon="search"
          title="Position not found"
          body="This instrument isn't in your portfolio. It may be on your watchlist instead."
          action={<Button variant="primary" onClick={() => navigate('/portfolio')}>Back to portfolio</Button>}
        />
      </Card>
    )
  }

  const pro = app.mode === 'pro'
  const totalQty = positions.reduce((s, p) => s + p.qty, 0)
  const nativeValue = totalQty * inst.price
  const value = convert(nativeValue, inst.currency, c)
  const costNative = positions.reduce((s, p) => s + p.lots.reduce((x, l) => x + l.qty * l.costPerUnit, 0), 0)
  const cost = convert(costNative, inst.currency, c)
  const unrealized = value - cost
  const dc = dayChangePct(inst.symbol)
  const hist = priceHistory(inst.symbol, 380)
  const incomeEvents = INCOME_EVENTS.filter((e) => e.symbol === symbol)
  const receivedIncome = incomeEvents.filter((e) => e.status === 'received').reduce((s, e) => s + convert(e.amount, e.currency, c), 0)
  const related = SUGGESTIONS.filter((s) => s.supportingRecords.some((r) => r.ref.includes(symbol!.toLowerCase()) || r.label.includes(symbol!)))
  const linkedOptions = OPTION_STRATEGIES.filter((o) => o.underlying === symbol)
  const docs = DOCUMENTS.filter((d) => positions.some((p) => p.source.sourceId === d.id))
  const allLots = positions.flatMap((p) => p.lots.map((l) => ({ ...l, accountId: p.accountId })))
  const sym = inst.currency === 'INR' ? '₹' : '$'

  return (
    <div className="fade-up space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button onClick={() => navigate(-1)} className="rounded-lg border border-line p-2 text-ink2 hover:bg-surface2" aria-label="Back">
            <Icon name="chevronLeft" size={16} />
          </button>
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-[13px] font-bold text-brand">{inst.symbol.slice(0, 4)}</span>
          <div>
            <h1 className="font-display text-[20px] font-semibold tracking-tight text-ink">{inst.name}</h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink2">
              <span className="font-semibold text-ink">{inst.symbol}</span>
              <Badge tone="neutral">{inst.sector}</Badge>
              <Badge tone="neutral">{inst.geography}</Badge>
              {positions.map((p) => (
                <span key={p.id} className="text-ink3">{accountById(p.accountId)?.institution}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="tnum font-display text-[26px] font-semibold text-ink">{fmtMoney(value, c)}</div>
          <div className="flex items-center justify-end gap-2 text-[12.5px]">
            <Delta pct={dc} /> <span className="text-ink3">today</span>
            <Delta value={unrealized} currency={c} pct={cost > 0 ? (unrealized / cost) * 100 : 0} arrow={false} /> <span className="text-ink3">total</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2" pad>
          <SectionHead
            title="Price"
            sub={`${sym}${fmtNum(inst.price)} · prev close ${sym}${fmtNum(inst.prevClose)} · market data, 15-min delayed`}
          />
          <AreaChart data={hist} height={220} currency={inst.currency} summary={`${inst.symbol} price over the past year`} />
          {inst.fiftyTwoWeek && (
            <div className="mt-4 max-w-xs">
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">52-week range</div>
              <RangeBar low={inst.fiftyTwoWeek.low} high={inst.fiftyTwoWeek.high} current={inst.price} />
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card pad>
            <SectionHead title="Your position" />
            <KV k="Units held" v={fmtNum(totalQty, 0)} />
            <KV k="Average cost" v={`${sym}${fmtNum(costNative / totalQty)}`} />
            <KV k="Cost basis" v={fmtMoney(cost, c, { compact: true })} />
            <KV k="Unrealized gain" v={<Delta value={unrealized} currency={c} arrow={false} />} />
            {pro && <KV k="Realized YTD" v={fmtMoney(positions.reduce((s, p) => s + p.realizedYtd, 0), 'USD', { compact: true })} />}
            {pro && <KV k="Fees YTD" v={fmtMoney(positions.reduce((s, p) => s + p.feesYtd, 0), 'USD')} />}
            {pro && positions.some((p) => p.withholdingYtd) && (
              <KV k="Withholding YTD" v={fmtMoney(convert(positions.reduce((s, p) => s + (p.withholdingYtd ?? 0), 0), inst.currency, c), c)} />
            )}
            <KV k="Income received (2026)" v={receivedIncome > 0 ? fmtMoney(receivedIncome, c, { compact: true }) : '—'} />
            {inst.yieldPct !== undefined && <KV k="Yield" v={fmtPct(inst.yieldPct)} />}
            {pro && inst.peRatio && <KV k="P/E" v={fmtNum(inst.peRatio, 1)} />}
            {pro && inst.beta && <KV k="Beta" v={fmtNum(inst.beta, 2)} />}
            {inst.nextEarnings && <KV k="Next earnings" v={fmtDate(inst.nextEarnings, 'short')} />}
            {inst.exDivDate && <KV k="Next ex-div" v={fmtDate(inst.exDivDate, 'short')} />}
            <div className="mt-2 border-t border-line pt-2.5">
              {positions.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1">
                  <span className="text-[11.5px] text-ink2">{accountById(p.accountId)?.institution} {accountById(p.accountId)?.name}</span>
                  <ProvenanceChip provenance={p.source.provenance} asOf={p.source.asOf} />
                </div>
              ))}
            </div>
          </Card>

          {linkedOptions.length > 0 && (
            <Card pad>
              <SectionHead title="Linked option strategies" />
              {linkedOptions.map((o) => (
                <Link key={o.id} to="/options" className="mb-1.5 flex items-center justify-between rounded-lg border border-line px-3 py-2 text-[12px] hover:border-brand">
                  <span className="font-medium text-ink">{STRATEGY_LABELS[o.kind]}</span>
                  <span className="text-ink3">{o.legs[0].contracts}× {sym}{o.legs[0].strike} {fmtDate(o.legs[0].expiry, 'short')}</span>
                </Link>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Thesis, risks, notes */}
      {(positions[0].thesis || positions[0].risks || positions[0].notes) && (
        <div className="grid gap-5 lg:grid-cols-2">
          {positions[0].thesis && (
            <Card pad>
              <SectionHead title="Investment thesis" sub="Written by you" />
              <p className="text-[13px] leading-relaxed text-ink2">{positions[0].thesis}</p>
              {positions[0].notes && <p className="mt-2 rounded-lg bg-surface2 p-2.5 text-[12px] text-ink2">{positions[0].notes}</p>}
            </Card>
          )}
          {positions[0].risks && (
            <Card pad>
              <SectionHead title="Risks you noted" />
              <ul className="space-y-1.5">
                {positions[0].risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink2">
                    <Icon name="alert" size={13} className="mt-1 shrink-0 text-warn" />{r}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {/* Tax lots (pro) + transactions */}
      {pro && (
        <Card pad={false} className="overflow-hidden">
          <div className="px-5 pt-4"><SectionHead title="Tax lots" sub={`Cost-basis method: ${accountById(positions[0].accountId)?.costBasisMethod ?? 'FIFO'} · long-term after 12 months`} /></div>
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[640px] text-[12.5px]">
              <thead className="border-b border-line bg-surface2/60 text-[10.5px] uppercase tracking-wide text-ink3">
                <tr>
                  <th className="px-5 py-2 text-left font-semibold">Acquired</th>
                  <th className="px-3 py-2 text-left font-semibold">Account</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Cost / unit</th>
                  <th className="px-3 py-2 text-right font-semibold">Market</th>
                  <th className="px-3 py-2 text-right font-semibold">Gain</th>
                  <th className="px-3 py-2 text-left font-semibold">Term</th>
                  <th className="px-3 py-2 text-left font-semibold">Source</th>
                </tr>
              </thead>
              <tbody>
                {allLots.map((l) => {
                  const gain = (inst.price - l.costPerUnit) * l.qty
                  const lt = daysAgo(l.date) > 365
                  return (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="tnum px-5 py-2.5">{fmtDate(l.date)}</td>
                      <td className="px-3 py-2.5 text-ink2">{accountById(l.accountId)?.institution}</td>
                      <td className="tnum px-3 py-2.5 text-right">{fmtNum(l.qty, 0)}</td>
                      <td className="tnum px-3 py-2.5 text-right">{sym}{fmtNum(l.costPerUnit)}</td>
                      <td className="tnum px-3 py-2.5 text-right">{fmtMoney(convert(l.qty * inst.price, inst.currency, c), c, { compact: true })}</td>
                      <td className="px-3 py-2.5 text-right"><Delta value={convert(gain, inst.currency, c)} currency={c} arrow={false} className="justify-end" /></td>
                      <td className="px-3 py-2.5"><Badge tone={lt ? 'gain' : 'warn'}>{lt ? 'Long-term' : 'Short-term'}</Badge></td>
                      <td className="px-3 py-2.5"><ProvenanceChip provenance={l.source.provenance} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Income + documents */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card pad>
          <SectionHead title="Income from this position" sub="2026 payments, received and expected" />
          {incomeEvents.length === 0 ? (
            <EmptyState icon="coins" title="No income recorded" body="This instrument hasn't paid dividends or distributions this year." className="py-6" />
          ) : (
            <div className="max-h-[260px] overflow-y-auto scroll-thin">
              {incomeEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between border-b border-line py-2 last:border-0">
                  <span className="flex items-center gap-2 text-[12.5px]">
                    <span className={cn('h-1.5 w-1.5 rounded-full', e.status === 'received' ? 'bg-gain' : 'bg-line2')} />
                    <span className="tnum text-ink2">{fmtDate(e.date)}</span>
                    {e.withholding ? <span className="text-[10.5px] text-warn">−{fmtMoney(convert(e.withholding, e.currency, c), c)} withheld</span> : null}
                  </span>
                  <span className={cn('tnum text-[12.5px] font-medium', e.status === 'received' ? 'text-ink' : 'text-ink3')}>
                    {fmtMoney(convert(e.amount, e.currency, c), c)}{e.status === 'expected' && ' est.'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card pad>
          <SectionHead title="Sources & update history" sub="Every value on this page traces to one of these" />
          {docs.map((d) => (
            <Link key={d.id} to="/documents" className="mb-1.5 flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 hover:border-brand">
              <Icon name="file" size={15} className="shrink-0 text-ink3" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-medium text-ink">{d.name}</span>
                <span className="text-[10.5px] text-ink3">{d.institution} · uploaded {fmtDate(d.uploadedAt.slice(0, 10))}</span>
              </span>
              <Badge tone="gain">Applied</Badge>
            </Link>
          ))}
          <div className="mt-3 space-y-2 border-t border-line pt-3">
            {[
              { d: '2026-07-19', t: 'Price updated from market feed' },
              { d: '2026-06-30', t: 'Position reconciled against June statement' },
              { d: '2026-06-14', t: 'Lots verified during statement approval' },
            ].map((u, i) => (
              <div key={i} className="flex gap-2.5 text-[12px]">
                <span className="tnum shrink-0 text-ink3">{fmtDate(u.d, 'short')}</span>
                <span className="text-ink2">{u.t}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Related recommendations */}
      {related.length > 0 && (
        <div>
          <SectionHead title="Related suggestions" className="px-1" />
          <div className="grid gap-4 lg:grid-cols-2">
            {related.map((s) => <SuggestionCard key={s.id} s={s} compact />)}
          </div>
        </div>
      )}
    </div>
  )
}
