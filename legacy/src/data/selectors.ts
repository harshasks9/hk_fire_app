import type {
  CurrencyCode,
  IncomeEvent,
  NetWorthPoint,
  OptionStrategy,
  Position,
} from './types'
import { ACCOUNTS, CASH_BALANCES, accountById } from './household'
import { INSTRUMENTS, dayChangePct, priceHistory } from './instruments'
import { POSITIONS } from './portfolio'
import { OPTION_STRATEGIES } from './options'
import { PROPERTIES, SYNDICATIONS } from './realestate'
import { LIABILITIES } from './liabilities'
import { INCOME_EVENTS } from './income'
import { INBOX_ITEMS } from './inbox'
import { convert } from './fx'
import { anyInstrument } from './watchlist'
import { walkTo } from './rng'
import { daysUntil } from '@/lib/format'

export interface Filters {
  memberId?: string // undefined = whole household
  accountId?: string
  country?: 'US' | 'IN'
  assetClass?: string
  currency?: CurrencyCode
}

function accountMatches(accountId: string, f: Filters): boolean {
  const acc = accountById(accountId)
  if (!acc) return false
  if (f.memberId && acc.ownerId !== f.memberId) return false
  if (f.accountId && acc.id !== f.accountId) return false
  if (f.country && acc.country !== f.country) return false
  return true
}

/* -- Position metrics -------------------------------------------------------- */

export interface PositionMetrics {
  position: Position
  symbol: string
  name: string
  assetClass: string
  sector: string
  geography: string
  nativeCurrency: CurrencyCode
  qty: number
  price: number
  value: number // display currency
  nativeValue: number
  cost: number // display currency
  unrealized: number
  unrealizedPct: number
  dayChange: number // display currency
  dayChangePct: number
  weightPct: number
  yieldPct?: number
  annualIncome: number // display currency
  accountId: string
  accountLabel: string
  ownerId: string
  provenance: string
  asOf: string
  stale: boolean
}

export function positionMetrics(display: CurrencyCode, f: Filters = {}): PositionMetrics[] {
  const rows: PositionMetrics[] = []
  for (const p of POSITIONS) {
    if (!accountMatches(p.accountId, f)) continue
    const inst = INSTRUMENTS[p.symbol]
    if (!inst) continue
    if (f.assetClass && inst.assetClass !== f.assetClass) continue
    if (f.currency && inst.currency !== f.currency) continue
    const acc = accountById(p.accountId)!
    const nativeValue = p.qty * inst.price
    const value = convert(nativeValue, inst.currency, display)
    const costNative = p.lots.reduce((s, l) => s + l.qty * l.costPerUnit, 0)
    const cost = convert(costNative, inst.currency, display)
    const dcPct = dayChangePct(p.symbol)
    const perPayment = inst.divPerShare ?? 0
    const perYear =
      perPayment *
      (inst.divFrequency === 'monthly' ? 12 : inst.divFrequency === 'quarterly' ? 4 : inst.divFrequency === 'semiannual' ? 2 : 1)
    rows.push({
      position: p,
      symbol: p.symbol,
      name: inst.name,
      assetClass: inst.assetClass,
      sector: inst.sector,
      geography: inst.geography,
      nativeCurrency: inst.currency,
      qty: p.qty,
      price: inst.price,
      value,
      nativeValue,
      cost,
      unrealized: value - cost,
      unrealizedPct: cost > 0 ? ((value - cost) / cost) * 100 : 0,
      dayChange: value * (dcPct / 100),
      dayChangePct: dcPct,
      weightPct: 0, // filled below
      yieldPct: inst.yieldPct,
      annualIncome: convert(p.qty * perYear, inst.currency, display),
      accountId: p.accountId,
      accountLabel: `${acc.institution} ${acc.name}`,
      ownerId: acc.ownerId,
      provenance: p.source.provenance,
      asOf: p.source.asOf,
      stale: !!p.source.stale,
    })
  }
  const total = rows.reduce((s, r) => s + r.value, 0)
  for (const r of rows) r.weightPct = total > 0 ? (r.value / total) * 100 : 0
  return rows.sort((a, b) => b.value - a.value)
}

/** Group positions across accounts by symbol (Simple Mode view). */
export interface GroupedPosition {
  symbol: string
  name: string
  assetClass: string
  nativeCurrency: CurrencyCode
  qty: number
  value: number
  cost: number
  unrealized: number
  unrealizedPct: number
  dayChange: number
  dayChangePct: number
  weightPct: number
  annualIncome: number
  accounts: string[]
  provenance: string
  asOf: string
}

export function groupedPositions(display: CurrencyCode, f: Filters = {}): GroupedPosition[] {
  const rows = positionMetrics(display, f)
  const map = new Map<string, GroupedPosition>()
  for (const r of rows) {
    const g = map.get(r.symbol)
    if (!g) {
      map.set(r.symbol, {
        symbol: r.symbol, name: r.name, assetClass: r.assetClass, nativeCurrency: r.nativeCurrency,
        qty: r.qty, value: r.value, cost: r.cost, unrealized: r.unrealized,
        unrealizedPct: 0, dayChange: r.dayChange, dayChangePct: r.dayChangePct,
        weightPct: r.weightPct, annualIncome: r.annualIncome, accounts: [r.accountLabel],
        provenance: r.provenance, asOf: r.asOf,
      })
    } else {
      g.qty += r.qty
      g.value += r.value
      g.cost += r.cost
      g.unrealized += r.unrealized
      g.dayChange += r.dayChange
      g.weightPct += r.weightPct
      g.annualIncome += r.annualIncome
      g.accounts.push(r.accountLabel)
      // keep the weakest provenance & oldest asOf for honesty
      if (r.asOf < g.asOf) g.asOf = r.asOf
      const rank: Record<string, number> = { verified: 0, confirmed: 1, market: 2, imported: 3, calculated: 4, estimated: 5, inferred: 6 }
      if ((rank[r.provenance] ?? 9) > (rank[g.provenance] ?? 9)) g.provenance = r.provenance
    }
  }
  const out = [...map.values()]
  for (const g of out) g.unrealizedPct = g.cost > 0 ? (g.unrealized / g.cost) * 100 : 0
  return out.sort((a, b) => b.value - a.value)
}

/* -- Cash -------------------------------------------------------------------- */

export function cashTotal(display: CurrencyCode, f: Filters = {}): number {
  let sum = 0
  for (const c of CASH_BALANCES) {
    if (!accountMatches(c.accountId, f)) continue
    const acc = accountById(c.accountId)!
    sum += convert(c.amount, acc.currency, display)
  }
  return sum
}

/* -- Net worth ---------------------------------------------------------------- */

export interface NetWorthSnapshot {
  total: number
  assets: number
  liabilities: number
  investable: number
  cash: number
  realEstateValue: number
  realEstateEquity: number
  privateValue: number
  liquid: number
  illiquid: number
  dayChange: number
  monthChangePct: number
  monthChange: number
}

export function netWorthSnapshot(display: CurrencyCode, f: Filters = {}): NetWorthSnapshot {
  const positions = positionMetrics(display, f)
  const investable = positions.reduce((s, r) => s + r.value, 0)
  const cash = cashTotal(display, f)
  let reValue = 0
  for (const p of PROPERTIES) {
    if (f.memberId && p.ownerId !== f.memberId) continue
    const latest = p.valuations[p.valuations.length - 1]
    reValue += convert(latest.value, p.currency, display)
  }
  let priv = 0
  for (const s of SYNDICATIONS) {
    if (f.memberId && s.ownerId !== f.memberId) continue
    priv += convert(s.navValue, s.currency, display)
  }
  let liab = 0
  for (const l of LIABILITIES) {
    if (f.memberId && l.ownerId !== f.memberId) continue
    liab += convert(l.balance, l.currency, display)
  }
  const assets = investable + cash + reValue + priv
  const total = assets - liab
  const dayChange = positions.reduce((s, r) => s + r.dayChange, 0)
  // Month change: 30-day delta of the SAME 380-point sample series the
  // net-worth chart renders (same walkTo seeds and length), so the headline
  // and the chart can never disagree.
  const invS = walkTo(investable + cash, 380, 501, 0.0062, 0.00075)
  const reS = walkTo(reValue, 380, 502, 0.0009, 0.00045)
  const pvS = walkTo(priv, 380, 503, 0.001, 0.0006)
  const liS = walkTo(liab, 380, 504, 0.0002, -0.00009)
  const at = (i: number) => invS[i] + reS[i] + pvS[i] - liS[i]
  const monthChange = at(379) - at(349)
  return {
    total,
    assets,
    liabilities: liab,
    investable,
    cash,
    realEstateValue: reValue,
    realEstateEquity: reValue - LIABILITIES.filter((l) => l.kind === 'mortgage' && (!f.memberId || l.ownerId === f.memberId)).reduce((s, l) => s + convert(l.balance, l.currency, display), 0),
    privateValue: priv,
    liquid: investable + cash - convert(positionValueByClass(display, f, 'employee_equity'), display, display),
    illiquid: reValue + priv,
    dayChange,
    monthChange,
    monthChangePct: total > 0 ? (monthChange / (total - monthChange)) * 100 : 0,
  }
}

function positionValueByClass(display: CurrencyCode, f: Filters, cls: string): number {
  return positionMetrics(display, f)
    .filter((r) => r.assetClass === cls)
    .reduce((s, r) => s + r.value, 0)
}

let nwCache: { key: string; points: NetWorthPoint[] } | null = null

/** Synthesized daily net-worth history ending at today's snapshot. */
export function netWorthHistory(display: CurrencyCode, days = 380): NetWorthPoint[] {
  const key = `${display}:${days}`
  if (nwCache?.key === key) return nwCache.points
  const snap = netWorthSnapshot(display)
  const inv = walkTo(snap.investable + snap.cash, days, 501, 0.0062, 0.00075)
  const re = walkTo(snap.realEstateValue, days, 502, 0.0009, 0.00045)
  const pv = walkTo(snap.privateValue, days, 503, 0.001, 0.0006)
  const li = walkTo(snap.liabilities, days, 504, 0.0002, -0.00009)
  const points: NetWorthPoint[] = []
  const end = new Date('2026-07-20T12:00:00')
  for (let i = 0; i < days; i++) {
    const d = new Date(end)
    d.setDate(d.getDate() - (days - 1 - i))
    points.push({
      date: d.toISOString().slice(0, 10),
      total: inv[i] + re[i] + pv[i] - li[i],
      investable: inv[i],
      realEstateEquity: re[i] - li[i] * 0.88,
      privateValue: pv[i],
      cash: 0,
      liabilities: li[i],
    })
  }
  nwCache = { key, points }
  return points
}

/* -- Allocation ---------------------------------------------------------------- */

export const ASSET_CLASS_LABELS: Record<string, string> = {
  us_equity: 'US Stocks',
  etf: 'ETFs',
  reit: 'REITs',
  in_equity: 'India Stocks',
  in_mf: 'India Mutual Funds',
  bond: 'Bonds',
  commodity: 'Commodities',
  cash: 'Cash',
  employee_equity: 'Employee Equity',
  private: 'Private Investments',
  real_estate: 'Real Estate',
}

export interface AllocationSlice {
  key: string
  label: string
  value: number
  pct: number
}

export function allocationBy(
  dim: 'assetClass' | 'sector' | 'geography' | 'currency',
  display: CurrencyCode,
  f: Filters = {},
  opts: { includeNonPortfolio?: boolean } = {},
): AllocationSlice[] {
  const rows = positionMetrics(display, f)
  const map = new Map<string, number>()
  for (const r of rows) {
    const key =
      dim === 'assetClass' ? r.assetClass : dim === 'sector' ? r.sector : dim === 'geography' ? r.geography : r.nativeCurrency
    map.set(key, (map.get(key) ?? 0) + r.value)
  }
  if (opts.includeNonPortfolio) {
    const cash = cashTotal(display, f)
    if (dim === 'assetClass') {
      map.set('cash', (map.get('cash') ?? 0) + cash)
      let re = 0
      for (const p of PROPERTIES) {
        if (f.memberId && p.ownerId !== f.memberId) continue
        re += convert(p.valuations[p.valuations.length - 1].value, p.currency, display)
      }
      map.set('real_estate', re)
      let pv = 0
      for (const s of SYNDICATIONS) {
        if (f.memberId && s.ownerId !== f.memberId) continue
        pv += convert(s.navValue, s.currency, display)
      }
      map.set('private', pv)
    }
    if (dim === 'currency') {
      for (const c of CASH_BALANCES) {
        if (!accountMatches(c.accountId, f)) continue
        const acc = accountById(c.accountId)!
        map.set(acc.currency, (map.get(acc.currency) ?? 0) + convert(c.amount, acc.currency, display))
      }
      for (const p of PROPERTIES) {
        if (f.memberId && p.ownerId !== f.memberId) continue
        map.set(p.currency, (map.get(p.currency) ?? 0) + convert(p.valuations[p.valuations.length - 1].value, p.currency, display))
      }
    }
  }
  const total = [...map.values()].reduce((s, v) => s + v, 0)
  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      label: dim === 'assetClass' ? (ASSET_CLASS_LABELS[key] ?? key) : key,
      value,
      pct: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)
}

/* -- Income --------------------------------------------------------------------- */

export interface IncomeAgg {
  monthReceived: number
  monthExpected: number
  ytdReceived: number
  forwardAnnual: number
  next: IncomeEvent | null
  byMonth: { month: number; received: number; expected: number }[]
  byType: { type: string; label: string; total: number }[]
}

export function incomeAgg(display: CurrencyCode, f: Filters = {}): IncomeAgg {
  const evts = INCOME_EVENTS.filter((e) => !e.accountId || accountMatches(e.accountId, f))
  const conv = (e: IncomeEvent) => convert(e.amount, e.currency, display)
  const ref = '2026-07-20'
  const curMonth = '2026-07'
  let monthReceived = 0
  let monthExpected = 0
  let ytdReceived = 0
  const byMonth = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, received: 0, expected: 0 }))
  const byTypeMap = new Map<string, number>()
  let next: IncomeEvent | null = null
  for (const e of evts) {
    const v = conv(e)
    const m = Number(e.date.slice(5, 7)) - 1
    if (e.status === 'received') {
      byMonth[m].received += v
      ytdReceived += v
      if (e.date.startsWith(curMonth)) monthReceived += v
    } else {
      byMonth[m].expected += v
      if (e.date.startsWith(curMonth)) monthExpected += v
      if (!next && e.date > ref) next = e
    }
    byTypeMap.set(e.type, (byTypeMap.get(e.type) ?? 0) + v)
  }
  const yearTotal = byMonth.reduce((s, m) => s + m.received + m.expected, 0)
  return {
    monthReceived,
    monthExpected,
    ytdReceived,
    forwardAnnual: yearTotal, // full-year run rate from the same records
    next,
    byMonth,
    byType: [...byTypeMap.entries()]
      .map(([type, total]) => ({ type, label: type, total }))
      .sort((a, b) => b.total - a.total),
  }
}

/* -- Options ---------------------------------------------------------------------- */

export interface StrategyMetrics {
  strategy: OptionStrategy
  label: string
  netPremium: number // total $ received (+) or paid (−) at open
  currentValue: number // cost to close now (per strategy, $)
  pnl: number
  pnlPct: number
  expiry: string
  daysToExpiry: number
  assignmentRisk: 'high' | 'elevated' | 'low'
  maxProfit: number | null
  maxLoss: number | null
  breakeven: number
  underlyingPrice: number
  actionNeeded?: string
}

export function strategyMetrics(s: OptionStrategy): StrategyMetrics {
  const inst = anyInstrument(s.underlying)
  const px = inst?.price ?? 0
  const netPremium = s.legs.reduce((sum, l) => sum + l.premium * l.contracts * 100, 0)
  const currentValue = s.legs.reduce((sum, l) => sum + l.currentPrice * l.contracts * 100, 0)
  const pnl = netPremium - currentValue
  const nearest = s.legs.reduce((min, l) => (l.expiry < min ? l.expiry : min), s.legs[0].expiry)
  const dte = daysUntil(nearest)
  const shortLeg = s.legs.find((l) => l.side === 'short')
  let assignmentRisk: StrategyMetrics['assignmentRisk'] = 'low'
  let actionNeeded: string | undefined
  if (shortLeg) {
    const itm = shortLeg.type === 'call' ? px > shortLeg.strike : px < shortLeg.strike
    const nearMoney = Math.abs(px - shortLeg.strike) / shortLeg.strike < 0.03
    if (itm && dte <= 7) {
      assignmentRisk = 'high'
      actionNeeded = `Short ${shortLeg.type} is in the money with ${dte}d left — decide: assign, roll, or close`
    } else if (itm || (nearMoney && dte <= 14)) {
      assignmentRisk = 'elevated'
    }
  }
  let maxProfit: number | null = netPremium
  let maxLoss: number | null = null
  let breakeven = 0
  if (s.kind === 'covered_call' && shortLeg) {
    breakeven = px - netPremium / (shortLeg.contracts * 100)
    maxProfit = netPremium + Math.max(0, (shortLeg.strike - px) * shortLeg.contracts * 100)
  } else if (s.kind === 'cash_secured_put' && shortLeg) {
    breakeven = shortLeg.strike - netPremium / (shortLeg.contracts * 100)
    maxLoss = shortLeg.strike * shortLeg.contracts * 100 - netPremium
  } else if (s.kind === 'vertical_spread') {
    const short = s.legs.find((l) => l.side === 'short')!
    const long = s.legs.find((l) => l.side === 'long')!
    const width = Math.abs(short.strike - long.strike) * short.contracts * 100
    maxLoss = width - netPremium
    breakeven = short.strike - netPremium / (short.contracts * 100)
  } else if (shortLeg) {
    breakeven = shortLeg.strike
    maxLoss = null
  }
  return {
    strategy: s,
    label: s.underlying,
    netPremium,
    currentValue,
    pnl,
    pnlPct: netPremium !== 0 ? (pnl / Math.abs(netPremium)) * 100 : 0,
    expiry: nearest,
    daysToExpiry: dte,
    assignmentRisk,
    maxProfit,
    maxLoss,
    breakeven,
    underlyingPrice: px,
    actionNeeded,
  }
}

export function allStrategyMetrics(): StrategyMetrics[] {
  return OPTION_STRATEGIES.map(strategyMetrics).sort((a, b) => a.daysToExpiry - b.daysToExpiry)
}

export function optionsPremiumYtd(display: CurrencyCode): number {
  return INCOME_EVENTS.filter((e) => e.type === 'option_premium' && e.status === 'received').reduce(
    (s, e) => s + convert(e.amount, e.currency, display),
    0,
  )
}

/* -- Real estate -------------------------------------------------------------------- */

export interface PropertyMetrics {
  id: string
  currentValue: number // native currency
  mortgageBalance: number
  equity: number
  monthlyRent: number
  monthlyCosts: number
  monthlyDebtService: number
  monthlyCashFlow: number
  noiAnnual: number
  capRatePct: number
  cashOnCashPct: number | null
  dscr: number | null
  ltvPct: number | null
  totalCostBasis: number
  appreciationPct: number
}

export function propertyMetrics(propertyId: string): PropertyMetrics | null {
  const p = PROPERTIES.find((x) => x.id === propertyId)
  if (!p) return null
  const currentValue = p.valuations[p.valuations.length - 1].value
  const mortgage = LIABILITIES.find((l) => l.id === p.mortgageId)
  const mortgageBalance = mortgage?.balance ?? 0
  const monthlyRent = (p.monthlyRent ?? 0) * ((p.occupancyPct ?? 100) / 100)
  const monthlyCosts = p.monthlyCosts.reduce((s, c) => s + c.amount, 0)
  const monthlyDebtService = mortgage?.monthlyPayment ?? 0
  const noiAnnual = (monthlyRent - monthlyCosts) * 12
  const totalCostBasis = p.purchasePrice + p.improvements.reduce((s, i) => s + i.amount, 0)
  const equityInvested = totalCostBasis - (mortgage?.originalPrincipal ?? 0)
  const annualCashFlow = (monthlyRent - monthlyCosts - monthlyDebtService) * 12
  return {
    id: p.id,
    currentValue,
    mortgageBalance,
    equity: currentValue - mortgageBalance,
    monthlyRent,
    monthlyCosts,
    monthlyDebtService,
    monthlyCashFlow: monthlyRent - monthlyCosts - monthlyDebtService,
    noiAnnual,
    capRatePct: currentValue > 0 && p.monthlyRent ? (noiAnnual / currentValue) * 100 : 0,
    cashOnCashPct: p.monthlyRent && equityInvested > 0 ? (annualCashFlow / equityInvested) * 100 : null,
    dscr: monthlyDebtService > 0 && p.monthlyRent ? (monthlyRent - monthlyCosts) / monthlyDebtService : null,
    ltvPct: mortgage ? (mortgageBalance / currentValue) * 100 : null,
    totalCostBasis,
    appreciationPct: ((currentValue - p.purchasePrice) / p.purchasePrice) * 100,
  }
}

/* -- Liabilities ---------------------------------------------------------------------- */

export function liabilityTotals(display: CurrencyCode, f: Filters = {}) {
  let balance = 0
  let monthlyPayment = 0
  for (const l of LIABILITIES) {
    if (f.memberId && l.ownerId !== f.memberId) continue
    balance += convert(l.balance, l.currency, display)
    monthlyPayment += convert(l.monthlyPayment, l.currency, display)
  }
  const weightedRate =
    LIABILITIES.reduce((s, l) => s + l.ratePct * convert(l.balance, l.currency, display), 0) / Math.max(balance, 1)
  return { balance, monthlyPayment, weightedRate }
}

/* -- Upcoming obligations --------------------------------------------------------------- */

export interface Obligation {
  date: string
  label: string
  amount: number
  currency: CurrencyCode
  kind: 'debt' | 'tax' | 'insurance' | 'capital_call' | 'property'
}

export function upcomingObligations(): Obligation[] {
  const list: Obligation[] = []
  for (const l of LIABILITIES) {
    list.push({ date: l.nextPaymentDate, label: `${l.name} — ${l.lender}`, amount: l.monthlyPayment, currency: l.currency, kind: 'debt' })
  }
  list.push({ date: '2026-08-05', label: 'LIC endowment premium (lapse risk)', amount: 48_000, currency: 'INR', kind: 'insurance' })
  list.push({ date: '2026-08-30', label: 'Home insurance renewal — Safeco', amount: 2_350, currency: 'USD', kind: 'insurance' })
  list.push({ date: '2026-09-15', label: 'Cedar Bend capital call #4', amount: 7_500, currency: 'USD', kind: 'capital_call' })
  list.push({ date: '2026-09-15', label: 'Q3 federal estimated tax', amount: 4_100, currency: 'USD', kind: 'tax' })
  list.push({ date: '2026-07-31', label: 'India ITR filing (AY 2026-27)', amount: 0, currency: 'INR', kind: 'tax' })
  list.push({ date: '2026-10-31', label: 'Seattle property tax (2nd half)', amount: 4_872, currency: 'USD', kind: 'property' })
  return list.filter((o) => o.date >= '2026-07-20').sort((a, b) => a.date.localeCompare(b.date))
}

/* -- Data quality ------------------------------------------------------------------------ */

export function dataCompleteness(): { pct: number; issues: number; verifiedPct: number } {
  // Weighted: positions verified, valuations fresh, docs matched
  const total = POSITIONS.length + PROPERTIES.length + SYNDICATIONS.length + LIABILITIES.length
  let good = 0
  let verified = 0
  for (const p of POSITIONS) {
    if (['verified', 'confirmed'].includes(p.source.provenance)) verified++
    if (!p.source.stale) good++
  }
  for (const p of PROPERTIES) {
    const latest = p.valuations[p.valuations.length - 1]
    if (!latest.source.stale) good++
    if (latest.source.provenance === 'verified') verified++
  }
  for (const s of SYNDICATIONS) {
    good++
  }
  for (const l of LIABILITIES) {
    good++
    if (l.source.provenance === 'verified') verified++
  }
  const issues = INBOX_ITEMS.filter((i) => i.status === 'open').length
  return { pct: Math.round((good / total) * 100), issues, verifiedPct: Math.round((verified / total) * 100) }
}

/* -- Portfolio history (investable only) -------------------------------------------------- */

export function portfolioHistory(display: CurrencyCode, days = 380): number[] {
  const snap = netWorthSnapshot(display)
  return walkTo(snap.investable, days, 601, 0.0068, 0.0008)
}

export { priceHistory }
