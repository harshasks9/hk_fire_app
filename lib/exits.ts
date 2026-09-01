/*
  Exits are deterministic. No judgement, no roll.

  E1  mid ≤ 20% of credit received            → buy to close, free the strike
  E2  short CALL mid ≥ 3× credit              → close THIS SESSION, no roll
  E3  short PUT mid ≥ 3× credit               → hold, prepare to take delivery
                                                (never styled as a problem — all
                                                fourteen historical assignments
                                                were profitable)
  E4  expiry, out of the money                → do nothing
  E5  delta drifted above 15 on a ~5-delta    → hypothesis deteriorating, review
  E6  Gemini hypothesis check returns broken  → review immediately

  The mid is MODELLED (Black-Scholes over the stored close and blended vol) —
  every rendered figure carries the modelled marking. Verify on the chain.
*/
import { bsDelta, bsPrice } from './options'

export type ExitRuleId = 'E1' | 'E2' | 'E3' | 'E4' | 'E5' | 'E6'

export interface OpenPositionForExit {
  id: number
  symbol: string
  type: 'call' | 'put'
  strike: number
  expiry: string // ISO date
  lots: number
  creditPerContract: number // dollars per contract at entry
  entryDelta: number | null
  hypothesisVerdict?: 'intact' | 'watch' | 'broken' | null
}

export interface ExitSignal {
  rule: ExitRuleId
  positionId: number
  urgent: boolean
  instruction: string
  detail: string
  /** For chips on the HOLD screen. */
  chip: 'healthy' | 'watch' | 'close_now'
  midPerContract: number | null
  multipleOfCredit: number | null
}

export interface PositionStatus {
  position: OpenPositionForExit
  signal: ExitSignal | null
  chip: 'healthy' | 'watch' | 'close_now'
  midPerContract: number | null
  currentDelta: number | null
  stale: boolean
}

function fmtMoney(x: number): string {
  return '$' + Math.round(x).toLocaleString()
}

export function evaluatePosition(
  p: OpenPositionForExit,
  spot: number | null,
  vol: number,
  todayIso: string,
  priceStale: boolean,
): PositionStatus {
  if (spot == null || spot <= 0) {
    return { position: p, signal: null, chip: 'watch', midPerContract: null, currentDelta: null, stale: true }
  }
  const days = Math.round(
    (Date.parse(p.expiry + 'T00:00:00Z') - Date.parse(todayIso + 'T00:00:00Z')) / 86_400_000,
  )
  const T = Math.max(0, days) / 365
  const mid = bsPrice(spot, p.strike, T, vol, p.type) * 100
  const delta = bsDelta(spot, p.strike, T, vol, p.type)
  const multiple = p.creditPerContract > 0 ? mid / p.creditPerContract : null

  const mk = (rule: ExitRuleId, urgent: boolean, instruction: string, detail: string, chip: ExitSignal['chip']): PositionStatus => ({
    position: p,
    signal: { rule, positionId: p.id, urgent, instruction, detail, chip, midPerContract: mid, multipleOfCredit: multiple },
    chip,
    midPerContract: mid,
    currentDelta: delta,
    stale: priceStale,
  })

  const name = `${p.symbol} ${formatExpiry(p.expiry)} ${p.strike}${p.type === 'call' ? 'C' : 'P'} ×${p.lots}`

  // E6 — hypothesis broken: review immediately.
  if (p.hypothesisVerdict === 'broken') {
    return mk('E6', true, `Review ${name} now.`, 'Hypothesis check returned broken. Rule E6.', 'close_now')
  }

  // E2 / E3 — 3× credit. Stale prices never fire urgent alerts; they surface as stale instead.
  if (multiple != null && multiple >= 3 && !priceStale) {
    if (p.type === 'call') {
      return mk(
        'E2',
        true,
        `Close ${name} today.`,
        `Marks ${multiple.toFixed(1)}× the credit received (${fmtMoney(mid)} vs ${fmtMoney(p.creditPerContract)}). Rule E2. No roll — closing and writing are two separate decisions.`,
        'close_now',
      )
    }
    return mk(
      'E3',
      false,
      `Hold ${name} — prepare to take delivery.`,
      `Marks ${multiple.toFixed(1)}× credit. Rule E3: assignment at ${p.strike} is the plan, not a problem. All fourteen historical assignments were profitable.`,
      'watch',
    )
  }

  // E4 — expired out of the money.
  if (days <= 0) {
    const otm = p.type === 'call' ? spot < p.strike : spot > p.strike
    if (otm) {
      return mk('E4', false, `${name} expires out of the money.`, 'Do nothing. Rule E4.', 'healthy')
    }
    return mk(
      p.type === 'put' ? 'E3' : 'E2',
      p.type === 'call',
      p.type === 'put' ? `Assignment expected on ${name}.` : `Close or settle ${name} — in the money at expiry.`,
      p.type === 'put' ? 'In the money at expiry — take delivery per rule E3.' : 'In the money at expiry.',
      p.type === 'call' ? 'close_now' : 'watch',
    )
  }

  // E1 — take-profit: mid decayed to ≤ 20% of credit.
  if (multiple != null && multiple <= 0.2) {
    return mk(
      'E1',
      false,
      `Buy to close ${name}.`,
      `Mid is ${(multiple * 100).toFixed(0)}% of credit — the strike is nearly free. Rule E1.`,
      'watch',
    )
  }

  // E5 — delta drift on a low-delta write.
  if (p.entryDelta != null && Math.abs(p.entryDelta) <= 0.08 && Math.abs(delta) > 0.15) {
    return mk(
      'E5',
      false,
      `Review ${name}.`,
      `Delta drifted from ${(Math.abs(p.entryDelta) * 100).toFixed(0)} to ${(Math.abs(delta) * 100).toFixed(0)} — the entry hypothesis is deteriorating. Rule E5.`,
      'watch',
    )
  }

  return { position: p, signal: null, chip: 'healthy', midPerContract: mid, currentDelta: delta, stale: priceStale }
}

export function formatExpiry(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]}`
}

/** The one urgent instruction, if any: E2 first (the most important rule), then E6. */
export function urgentSignal(statuses: PositionStatus[]): ExitSignal | null {
  const urgents = statuses.map((s) => s.signal).filter((s): s is ExitSignal => Boolean(s?.urgent))
  const e2 = urgents.find((s) => s.rule === 'E2')
  return e2 ?? urgents[0] ?? null
}
