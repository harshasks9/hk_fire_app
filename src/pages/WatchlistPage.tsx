import React, { useMemo, useState } from 'react'
import { useApp } from '@/state/AppContext'
import { WATCHLIST, anyInstrument } from '@/data/watchlist'
import { priceHistory } from '@/data/instruments'
import { groupedPositions } from '@/data/selectors'
import { fmtMoney, fmtNum, fmtPct, fmtDate, relDate } from '@/lib/format'
import { Card, SectionHead, Badge, Delta, Button, Modal, EmptyState, KV, Toggle } from '@/components/ui'
import { RangeBar, Sparkline } from '@/components/charts'
import { Icon } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { WatchlistItem } from '@/data/types'

export default function WatchlistPage() {
  const app = useApp()
  const pro = app.mode === 'pro'
  const [expanded, setExpanded] = useState<string | null>(null)
  const [convertItem, setConvertItem] = useState<WatchlistItem | null>(null)
  const [alerts, setAlerts] = useState<Record<string, boolean>>(Object.fromEntries(WATCHLIST.map((w) => [w.id, w.alertOn])))

  const items = WATCHLIST.filter((w) => !app.removedWatch.includes(w.id))
  const holdings = useMemo(() => groupedPositions(app.currency), [app.currency])

  return (
    <div className="fade-up space-y-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-[12.5px] text-ink2">
          {items.length} candidates tracked · {items.filter((w) => { const i = anyInstrument(w.symbol); return i && i.price <= w.targetPrice * 1.03 }).length} near target
        </p>
        <Button size="sm" variant="primary" icon="plus" onClick={() => {}}>Add symbol</Button>
      </div>

      {items.length === 0 && (
        <Card>
          <EmptyState icon="eye" title="Your watchlist is empty" body="Track investments you're considering. Set a target price, write entry criteria, and convert to a real position when you buy." action={<Button variant="primary" icon="plus">Add your first symbol</Button>} />
        </Card>
      )}

      {items.map((w) => {
        const inst = anyInstrument(w.symbol)
        if (!inst) return null
        const chg = ((inst.price - inst.prevClose) / inst.prevClose) * 100
        const dist = ((inst.price - w.targetPrice) / w.targetPrice) * 100
        const nearTarget = inst.price <= w.targetPrice * 1.03
        const sym = inst.currency === 'INR' ? '₹' : '$'
        const converted = app.addedToPortfolio.includes(w.id)
        const isOpen = expanded === w.id
        const overlapNote = w.symbol === 'AMD' || w.symbol === 'TSM' ? 'Overlaps NVDA + QQQ semiconductor exposure' : w.symbol === 'JEPI' ? 'Would replace manual covered-call program' : null
        return (
          <Card key={w.id} pad className={cn(converted && 'opacity-70')}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="flex min-w-[150px] items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface2 text-[10.5px] font-bold text-ink2">{w.symbol.slice(0, 5)}</span>
                <div>
                  <div className="text-[13.5px] font-semibold text-ink">{w.symbol}</div>
                  <div className="max-w-[140px] truncate text-[11px] text-ink3">{inst.name}</div>
                </div>
              </div>
              <div className="min-w-[90px]">
                <div className="tnum text-[15px] font-semibold text-ink">{sym}{fmtNum(inst.price)}</div>
                <Delta pct={chg} className="text-[11.5px]" />
              </div>
              <div className="min-w-[120px]">
                <div className="text-[10.5px] text-ink3">Target {sym}{w.targetPrice.toLocaleString()}</div>
                <div className={cn('tnum text-[12.5px] font-medium', nearTarget ? 'text-brass' : 'text-ink2')}>
                  {nearTarget ? '● In buy zone' : `${fmtPct(Math.abs(dist))} above`}
                </div>
              </div>
              <Sparkline data={priceHistory(w.symbol, 90)} width={110} height={30} className="hidden sm:block" />
              <div className="hidden min-w-[110px] text-[11px] text-ink2 md:block">
                {inst.nextEarnings && <div>Earnings {fmtDate(inst.nextEarnings, 'short')}</div>}
                {inst.exDivDate && <div>Ex-div {fmtDate(inst.exDivDate, 'short')}</div>}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-ink3">
                  <Icon name="bell" size={12} />
                  <Toggle checked={!!alerts[w.id]} onChange={(v) => setAlerts({ ...alerts, [w.id]: v })} label={`Price alert for ${w.symbol}`} />
                </span>
                {!converted ? (
                  <Button size="sm" variant="secondary" onClick={() => setConvertItem(w)}>I bought it</Button>
                ) : (
                  <Badge tone="gain" icon="check">In portfolio</Badge>
                )}
                <button onClick={() => setExpanded(isOpen ? null : w.id)} className="rounded-md p-1.5 text-ink3 hover:bg-surface2 hover:text-ink" aria-label="Details">
                  <Icon name="chevronDown" size={15} className={cn('transition-transform', isOpen && 'rotate-180')} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-[12px] text-ink2">{w.note}</p>

            {isOpen && (
              <div className="fade-up mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-3">
                <div>
                  <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">52-week range</div>
                  {inst.fiftyTwoWeek && <RangeBar low={inst.fiftyTwoWeek.low} high={inst.fiftyTwoWeek.high} current={inst.price} target={w.targetPrice} />}
                  {pro && (
                    <div className="mt-3 space-y-0.5">
                      {inst.peRatio && <KV k="P/E" v={fmtNum(inst.peRatio, 1)} />}
                      {inst.yieldPct !== undefined && <KV k="Yield" v={fmtPct(inst.yieldPct)} />}
                      {inst.volatility && <KV k="Volatility (1y)" v={fmtPct(inst.volatility * 100, { decimals: 0 })} />}
                      {inst.divGrowth5y && <KV k="Dividend growth (5y)" v={fmtPct(inst.divGrowth5y)} />}
                      {w.proposedSize && <KV k="Proposed size" v={`${fmtMoney(w.proposedSize, 'USD', { compact: true })} (${((w.proposedSize / holdings.reduce((s, h) => s + h.value, 0)) * 100).toFixed(1)}% of portfolio)`} />}
                    </div>
                  )}
                  {overlapNote && (
                    <div className="mt-3 rounded-lg bg-warn-soft p-2.5 text-[11.5px] text-ink2">
                      <span className="font-semibold text-warn">Overlap: </span>{overlapNote}
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2">
                  {w.thesis && (
                    <>
                      <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink3">Thesis</div>
                      <p className="text-[12.5px] leading-relaxed text-ink2">{w.thesis}</p>
                    </>
                  )}
                  {pro && (
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {w.entryCriteria && (
                        <div>
                          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-gain">Entry criteria</div>
                          {w.entryCriteria.map((e, i) => <p key={i} className="text-[12px] leading-relaxed text-ink2">· {e}</p>)}
                        </div>
                      )}
                      {w.exitCriteria && (
                        <div>
                          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-loss">Exit criteria</div>
                          {w.exitCriteria.map((e, i) => <p key={i} className="text-[12px] leading-relaxed text-ink2">· {e}</p>)}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-[10.5px] text-ink3">Watching since {fmtDate(w.addedAt)} · prices delayed 15 min</div>
                </div>
              </div>
            )}
          </Card>
        )
      })}

      {/* Convert to position flow */}
      <Modal open={!!convertItem} onClose={() => setConvertItem(null)} title={`Add ${convertItem?.symbol} to your portfolio`}>
        {convertItem && <ConvertFlow w={convertItem} onDone={() => { app.convertWatchToPosition(convertItem.id); setConvertItem(null) }} onCancel={() => setConvertItem(null)} />}
      </Modal>
    </div>
  )
}

function ConvertFlow({ w, onDone, onCancel }: { w: WatchlistItem; onDone: () => void; onCancel: () => void }) {
  const inst = anyInstrument(w.symbol)!
  const [qty, setQty] = useState(w.proposedSize ? Math.round(w.proposedSize / inst.price) : 10)
  const [price, setPrice] = useState(inst.price)
  const [account, setAccount] = useState('acc-fid')
  const sym = inst.currency === 'INR' ? '₹' : '$'
  return (
    <div className="space-y-4">
      <p className="text-[12.5px] leading-relaxed text-ink2">
        Your thesis, entry criteria and notes transfer automatically — no re-entry. We'll flag it as user-entered until the next statement confirms it.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink2">Quantity</span>
          <input type="number" value={qty} onChange={(e) => setQty(Number(e.target.value))} className="h-10 w-full rounded-ctl border border-line bg-bg px-3 text-[13px] tnum outline-none focus:border-brand" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-ink2">Fill price ({sym})</span>
          <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="h-10 w-full rounded-ctl border border-line bg-bg px-3 text-[13px] tnum outline-none focus:border-brand" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-[11px] font-medium text-ink2">Account</span>
        <select value={account} onChange={(e) => setAccount(e.target.value)} className="h-10 w-full rounded-ctl border border-line bg-bg px-3 text-[13px] outline-none focus:border-brand">
          <option value="acc-fid">Fidelity — Individual Brokerage</option>
          <option value="acc-schwab">Schwab — Joint Brokerage</option>
          <option value="acc-zerodha">Zerodha — Demat</option>
        </select>
      </label>
      <div className="rounded-lg bg-surface2 p-3 text-[12px] text-ink2">
        Cost: <b className="tnum text-ink">{sym}{(qty * price).toLocaleString(undefined, { maximumFractionDigits: 0 })}</b> · carried over: thesis, entry/exit criteria, target, notes.
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" icon="check" onClick={onDone}>Add position</Button>
      </div>
    </div>
  )
}
