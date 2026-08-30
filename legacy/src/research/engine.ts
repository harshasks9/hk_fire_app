import type { DcfInputs, FinYear, ResearchDossier, CategoryScore, ScenarioCase, TechnicalLevel } from './types'

/* ---------------------------------------------------------------------------
   Research engine — every function here is a real computation over inputs.
   Nothing in this file authors facts; provenance lives with the data.
--------------------------------------------------------------------------- */

/* -- Series helpers ----------------------------------------------------------- */

export function sma(series: number[], n: number): (number | null)[] {
  const out: (number | null)[] = []
  let sum = 0
  for (let i = 0; i < series.length; i++) {
    sum += series[i]
    if (i >= n) sum -= series[i - n]
    out.push(i >= n - 1 ? sum / n : null)
  }
  return out
}

function ema(series: number[], n: number): number[] {
  const k = 2 / (n + 1)
  const out: number[] = []
  let prev = series[0]
  for (const v of series) {
    prev = v * k + prev * (1 - k)
    out.push(prev)
  }
  return out
}

export function rsi(series: number[], n = 14): number {
  if (series.length < n + 1) return 50
  let gains = 0
  let losses = 0
  for (let i = series.length - n; i < series.length; i++) {
    const d = series[i] - series[i - 1]
    if (d > 0) gains += d
    else losses -= d
  }
  if (losses === 0) return 100
  const rs = gains / n / (losses / n)
  return 100 - 100 / (1 + rs)
}

export function macd(series: number[]): { macd: number; signal: number; hist: number } {
  const line = ema(series, 12).map((v, i) => v - ema(series, 26)[i])
  const signal = ema(line, 9)
  const m = line[line.length - 1]
  const s = signal[signal.length - 1]
  return { macd: m, signal: s, hist: m - s }
}

/** ATR approximation from closes (no OHLC in sample data — labeled as such). */
export function atrApprox(series: number[], n = 14): number {
  const trs: number[] = []
  for (let i = Math.max(1, series.length - n); i < series.length; i++) {
    trs.push(Math.abs(series[i] - series[i - 1]))
  }
  return trs.reduce((s, v) => s + v, 0) / Math.max(trs.length, 1)
}

export function bollinger(series: number[], n = 20, k = 2): { mid: number; upper: number; lower: number; pctB: number } {
  const win = series.slice(-n)
  const mid = win.reduce((s, v) => s + v, 0) / win.length
  const sd = Math.sqrt(win.reduce((s, v) => s + (v - mid) ** 2, 0) / win.length)
  const upper = mid + k * sd
  const lower = mid - k * sd
  const last = series[series.length - 1]
  return { mid, upper, lower, pctB: upper === lower ? 0.5 : (last - lower) / (upper - lower) }
}

export function annualizedVol(series: number[]): number {
  const rets: number[] = []
  for (let i = 1; i < series.length; i++) rets.push(Math.log(series[i] / series[i - 1]))
  const mean = rets.reduce((s, v) => s + v, 0) / rets.length
  const varr = rets.reduce((s, v) => s + (v - mean) ** 2, 0) / (rets.length - 1)
  return Math.sqrt(varr) * Math.sqrt(252) * 100
}

export function betaVs(series: number[], bench: number[]): number {
  const n = Math.min(series.length, bench.length)
  const a = series.slice(-n)
  const b = bench.slice(-n)
  const ra: number[] = []
  const rb: number[] = []
  for (let i = 1; i < n; i++) {
    ra.push(a[i] / a[i - 1] - 1)
    rb.push(b[i] / b[i - 1] - 1)
  }
  const ma = ra.reduce((s, v) => s + v, 0) / ra.length
  const mb = rb.reduce((s, v) => s + v, 0) / rb.length
  let cov = 0
  let varb = 0
  for (let i = 0; i < ra.length; i++) {
    cov += (ra[i] - ma) * (rb[i] - mb)
    varb += (rb[i] - mb) ** 2
  }
  return varb === 0 ? 1 : cov / varb
}

export interface DrawdownInfo {
  maxDrawdownPct: number
  currentDrawdownPct: number
  series: number[] // drawdown % at each point
}

export function drawdowns(series: number[]): DrawdownInfo {
  let peak = series[0]
  let maxDd = 0
  const out: number[] = []
  for (const v of series) {
    peak = Math.max(peak, v)
    const dd = (v / peak - 1) * 100
    out.push(dd)
    maxDd = Math.min(maxDd, dd)
  }
  return { maxDrawdownPct: maxDd, currentDrawdownPct: out[out.length - 1], series: out }
}

export type TrendRegime = 'strong uptrend' | 'uptrend' | 'range' | 'downtrend' | 'strong downtrend'

export function classifyTrend(series: number[]): TrendRegime {
  const last = series[series.length - 1]
  const s50 = sma(series, 50)[series.length - 1]
  const s200 = sma(series, 200)[series.length - 1]
  if (s50 === null || s200 === null) return 'range'
  const slope50 = s50 / (sma(series.slice(0, -10), 50)[series.length - 11] ?? s50) - 1
  if (last > s50 && s50 > s200 && slope50 > 0.005) return 'strong uptrend'
  if (last > s200 && s50 > s200) return 'uptrend'
  if (last < s50 && s50 < s200 && slope50 < -0.005) return 'strong downtrend'
  if (last < s200) return 'downtrend'
  return 'range'
}

/** Support/resistance from local extrema clustering — heuristic, labeled as such. */
export function keyLevels(series: number[], current: number): TechnicalLevel[] {
  const win = series.slice(-250)
  const extrema: number[] = []
  for (let i = 5; i < win.length - 5; i++) {
    const seg = win.slice(i - 5, i + 6)
    const v = win[i]
    if (v === Math.max(...seg) || v === Math.min(...seg)) extrema.push(v)
  }
  // cluster within 1.5%
  const clusters: { price: number; hits: number }[] = []
  for (const e of extrema.sort((a, b) => a - b)) {
    const c = clusters.find((x) => Math.abs(x.price - e) / e < 0.015)
    if (c) {
      c.price = (c.price * c.hits + e) / (c.hits + 1)
      c.hits++
    } else clusters.push({ price: e, hits: 1 })
  }
  return clusters
    .filter((c) => c.hits >= 3)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 4)
    .map((c) => ({
      price: c.price,
      kind: (c.price < current ? 'support' : 'resistance') as TechnicalLevel['kind'],
      basis: `${c.hits} touches in the past year (clustered extrema)`,
    }))
    .sort((a, b) => a.price - b.price)
}

/* -- Fundamental derivations ---------------------------------------------------- */

export function cagr(first: number, last: number, years: number): number {
  if (first <= 0 || last <= 0 || years <= 0) return 0
  return (Math.pow(last / first, 1 / years) - 1) * 100
}

export interface FundamentalSummary {
  revCagr5: number
  epsCagr5: number
  fcfMarginLatest: number
  grossMarginTrend: 'expanding' | 'stable' | 'contracting'
  fcfConversion: number // FCF / net income, latest
  buybackPct5: number // share count change over 5y, negative = shrinking
  netDebtToFcf: number | null
  roicLatest: number | null
}

export function summarizeFundamentals(fin: FinYear[]): FundamentalSummary {
  const n = fin.length
  const last = fin[n - 1]
  const y5 = fin[Math.max(0, n - 6)]
  const gmFirst = fin.find((f) => f.grossMarginPct !== undefined)?.grossMarginPct
  const gmLast = last.grossMarginPct
  let gmTrend: FundamentalSummary['grossMarginTrend'] = 'stable'
  if (gmFirst !== undefined && gmLast !== undefined) {
    if (gmLast - gmFirst > 1.5) gmTrend = 'expanding'
    else if (gmFirst - gmLast > 1.5) gmTrend = 'contracting'
  }
  return {
    revCagr5: cagr(y5.revenue, last.revenue, Math.min(5, n - 1)),
    epsCagr5: cagr(y5.eps, last.eps, Math.min(5, n - 1)),
    fcfMarginLatest: (last.fcf / last.revenue) * 100,
    grossMarginTrend: gmTrend,
    fcfConversion: last.netIncome > 0 ? last.fcf / last.netIncome : 0,
    buybackPct5: (last.shares / y5.shares - 1) * 100,
    netDebtToFcf: last.netDebt !== undefined && last.fcf > 0 ? last.netDebt / last.fcf : null,
    roicLatest: last.roicPct ?? null,
  }
}

/* -- Valuation ------------------------------------------------------------------- */

/** Two-stage FCF DCF → per-share value in reporting currency. */
export function dcfValue(inp: DcfInputs): number {
  let pv = 0
  let fcf = inp.fcf0
  const r = inp.discountRate / 100
  for (let y = 1; y <= 10; y++) {
    const g = (y <= 5 ? inp.growthY1_5 : inp.growthY6_10) / 100
    fcf = fcf * (1 + g)
    pv += fcf / Math.pow(1 + r, y)
  }
  const tv = (fcf * (1 + inp.terminalGrowth / 100)) / (r - inp.terminalGrowth / 100)
  pv += tv / Math.pow(1 + r, 10)
  return (pv + inp.netCash) / inp.shares
}

/** Solve for the stage-1 growth the current price implies (stage-2 = half of it). */
export function reverseDcfImpliedGrowth(price: number, inp: DcfInputs): number {
  let lo = -20
  let hi = 60
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const v = dcfValue({ ...inp, growthY1_5: mid, growthY6_10: mid / 2 })
    if (v < price) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export interface ScenarioResult extends ScenarioCase {
  target5y: number
  irrPct: number
  totalReturnPct: number
}

export function runScenarios(price: number, scenarios: ScenarioCase[]): { cases: ScenarioResult[]; expectedIrr: number; expectedReturn: number } {
  const cases = scenarios.map((s) => {
    const target = s.eps5 * s.exitMultiple
    const total = (target / price - 1) * 100
    const irr = (Math.pow(target / price, 1 / 5) - 1) * 100
    return { ...s, target5y: target, irrPct: irr, totalReturnPct: total }
  })
  const totalP = cases.reduce((s, c) => s + c.probabilityPct, 0) || 100
  return {
    cases,
    expectedIrr: cases.reduce((s, c) => s + (c.irrPct * c.probabilityPct) / totalP, 0),
    expectedReturn: cases.reduce((s, c) => s + (c.totalReturnPct * c.probabilityPct) / totalP, 0),
  }
}

export function sensitivityTable(inp: DcfInputs, growths: number[], discounts: number[]): number[][] {
  return discounts.map((d) => growths.map((g) => dcfValue({ ...inp, growthY1_5: g, growthY6_10: g / 2, discountRate: d })))
}

/* -- Scoring ---------------------------------------------------------------------- */

export const DEFAULT_WEIGHTS: Record<string, number> = {
  quality: 20,
  growth: 15,
  financialStrength: 15,
  managementCapital: 10,
  moat: 15,
  valuation: 15,
  technicals: 5,
  risk: 5,
}

const clamp10 = (v: number) => Math.max(0, Math.min(10, v))

/** Category scores: quantitative ones computed here; qualitative ones come from the dossier (authored, labeled). */
export function categoryScores(d: ResearchDossier, price: number, priceSeries: number[], benchSeries: number[]): CategoryScore[] {
  const f = summarizeFundamentals(d.financials)
  const dcf = dcfValue(d.valuation.dcf)
  const upside = ((dcf - price) / price) * 100
  const trend = classifyTrend(priceSeries)
  const vol = annualizedVol(priceSeries.slice(-252))
  const dd = drawdowns(priceSeries)
  const authored = (key: string) => d.qualityScores.find((q) => q.key === key)

  const scores: CategoryScore[] = [
    {
      key: 'quality',
      label: 'Business quality',
      computed: true,
      formula: 'avg( ROIC/3 capped 10, FCF-conversion × 6, margin-trend 4/6/8 )',
      score: clamp10(((f.roicLatest ? clamp10(f.roicLatest / 3) : 5) + clamp10(f.fcfConversion * 6) + (f.grossMarginTrend === 'expanding' ? 8 : f.grossMarginTrend === 'stable' ? 6 : 4)) / 3),
      inputs: [
        { label: 'ROIC (latest)', value: f.roicLatest !== null ? `${f.roicLatest.toFixed(0)}%` : 'n/a', contribution: f.roicLatest ? clamp10(f.roicLatest / 3) : 5 },
        { label: 'FCF conversion', value: `${(f.fcfConversion * 100).toFixed(0)}% of net income`, contribution: clamp10(f.fcfConversion * 6) },
        { label: 'Gross-margin trend', value: f.grossMarginTrend, contribution: f.grossMarginTrend === 'expanding' ? 8 : f.grossMarginTrend === 'stable' ? 6 : 4 },
      ],
    },
    {
      key: 'growth',
      label: 'Growth quality',
      computed: true,
      formula: 'avg( revCAGR5 / 2.5, epsCAGR5 / 3 ) capped 0–10',
      score: clamp10((clamp10(f.revCagr5 / 2.5) + clamp10(f.epsCagr5 / 3)) / 2),
      inputs: [
        { label: 'Revenue CAGR (5y)', value: `${f.revCagr5.toFixed(1)}%`, contribution: clamp10(f.revCagr5 / 2.5) },
        { label: 'EPS CAGR (5y)', value: `${f.epsCagr5.toFixed(1)}%`, contribution: clamp10(f.epsCagr5 / 3) },
      ],
    },
    {
      key: 'financialStrength',
      label: 'Financial strength',
      computed: true,
      formula: 'net cash → 9; net debt/FCF < 1 → 8; < 2.5 → 6; < 4 → 4; else 2. Dilution adj ±1',
      score: clamp10(
        (f.netDebtToFcf === null ? 6 : f.netDebtToFcf <= 0 ? 9 : f.netDebtToFcf < 1 ? 8 : f.netDebtToFcf < 2.5 ? 6 : f.netDebtToFcf < 4 ? 4 : 2) +
          (f.buybackPct5 < 0 ? 1 : f.buybackPct5 > 8 ? -1 : 0),
      ),
      inputs: [
        { label: 'Net debt / FCF', value: f.netDebtToFcf === null ? 'n/a' : f.netDebtToFcf <= 0 ? 'net cash' : f.netDebtToFcf.toFixed(1), contribution: f.netDebtToFcf === null ? 6 : f.netDebtToFcf <= 0 ? 9 : clamp10(8 - f.netDebtToFcf * 1.5) },
        { label: 'Share count (5y)', value: `${f.buybackPct5 > 0 ? '+' : ''}${f.buybackPct5.toFixed(1)}%`, contribution: f.buybackPct5 < 0 ? 8 : 5 },
      ],
    },
    {
      key: 'managementCapital',
      label: 'Management & capital allocation',
      computed: false,
      formula: 'Analyst-authored (labeled) — see dossier evidence',
      score: authored('managementCapital')?.score ?? 5,
      inputs: [{ label: 'Basis', value: authored('managementCapital')?.basis ?? '—', contribution: authored('managementCapital')?.score ?? 5 }],
    },
    {
      key: 'moat',
      label: 'Competitive advantage',
      computed: false,
      formula: 'Analyst-authored (labeled): wide=8–10, narrow=5–7, none=0–4; direction ±1',
      score: authored('moat')?.score ?? 5,
      inputs: [{ label: 'Moat', value: `${d.profile.moat.rating} · ${d.profile.moat.direction}`, contribution: authored('moat')?.score ?? 5 }],
    },
    {
      key: 'valuation',
      label: 'Valuation attractiveness',
      computed: true,
      formula: '5 + (DCF upside % / 8), capped 0–10',
      score: clamp10(5 + upside / 8),
      inputs: [
        { label: 'DCF value / price', value: `${dcf.toFixed(0)} vs ${price.toFixed(0)} (${upside >= 0 ? '+' : ''}${upside.toFixed(0)}%)`, contribution: clamp10(5 + upside / 8) },
      ],
    },
    {
      key: 'technicals',
      label: 'Technical strength',
      computed: true,
      formula: 'trend regime: strong up=9, up=7, range=5, down=3, strong down=1',
      score: trend === 'strong uptrend' ? 9 : trend === 'uptrend' ? 7 : trend === 'range' ? 5 : trend === 'downtrend' ? 3 : 1,
      inputs: [{ label: 'Trend regime', value: trend, contribution: trend === 'strong uptrend' ? 9 : trend === 'uptrend' ? 7 : trend === 'range' ? 5 : trend === 'downtrend' ? 3 : 1 }],
    },
    {
      key: 'risk',
      label: 'Risk (higher = safer)',
      computed: true,
      formula: '10 − vol/8 − |maxDD|/12, capped 0–10',
      score: clamp10(10 - vol / 8 - Math.abs(dd.maxDrawdownPct) / 12),
      inputs: [
        { label: 'Volatility (1y)', value: `${vol.toFixed(0)}%`, contribution: clamp10(10 - vol / 8) },
        { label: 'Max drawdown (1y)', value: `${dd.maxDrawdownPct.toFixed(0)}%`, contribution: clamp10(10 - Math.abs(dd.maxDrawdownPct) / 12) },
      ],
    },
  ]
  return scores
}

export function overallScore(scores: CategoryScore[], weights: Record<string, number> = DEFAULT_WEIGHTS): number {
  const totalW = scores.reduce((s, c) => s + (weights[c.key] ?? 0), 0) || 1
  return scores.reduce((s, c) => s + c.score * (weights[c.key] ?? 0), 0) / totalW
}

/** Data confidence: how much of the dossier is populated + freshness. */
export function dataConfidence(d: ResearchDossier): { pct: number; gaps: string[] } {
  const gaps: string[] = []
  if (d.dataProfile.provider === 'bundled-sample') gaps.push('Bundled sample dataset — connect a licensed provider for verified figures')
  if (d.financials.length < 8) gaps.push(`Only ${d.financials.length} years of financials`)
  if (!d.insiders?.length) gaps.push('No insider-activity data')
  if (!d.estimateRevisions?.length) gaps.push('No consensus estimate data')
  const pct = Math.max(20, 100 - gaps.length * 15 - (d.tier === 'standard' ? 10 : d.tier === 'technical' ? 40 : 0))
  return { pct, gaps }
}
