/*
  The scoreboard is adherence, not P&L. Four components, each a plain
  fraction the owner controls entirely. P&L is the output and lives one
  level down.
*/
import { insideDeltaBand } from './valuation'

export interface DisciplineComponent {
  key: 'cadence' | 'rule' | 'stop' | 'capacity'
  label: string
  numerator: number
  denominator: number
  /** null when the denominator is zero — "no data yet", never a fake 100%. */
  value: number | null
  detail: string
}

export interface DisciplineScore {
  components: DisciplineComponent[]
  /** Mean of measurable components; null when nothing is measurable. */
  overall: number | null
}

export interface WeekLite {
  weekNumber: number
  completedAt: Date | null
  missed: boolean
}

export interface PositionLite {
  entryDelta: number | null
  openedAt: Date
  type: 'call' | 'put'
}

export interface StopEvent {
  triggeredAt: Date
  takenSameSession: boolean
}

export function cadenceComponent(weeks: WeekLite[]): DisciplineComponent {
  const available = weeks.length
  const written = weeks.filter((w) => w.completedAt != null && !w.missed).length
  return {
    key: 'cadence',
    label: 'Cadence',
    numerator: written,
    denominator: available,
    value: available > 0 ? written / available : null,
    detail: 'Weeks written on schedule ÷ weeks available. The edge is the cadence; a skipped week is a real cost.',
  }
}

export function ruleComponent(positions: PositionLite[]): DisciplineComponent {
  const withDelta = positions.filter((p) => p.entryDelta != null)
  const inside = withDelta.filter((p) => insideDeltaBand(p.entryDelta!)).length
  return {
    key: 'rule',
    label: 'Rule',
    numerator: inside,
    denominator: withDelta.length,
    value: withDelta.length > 0 ? inside / withDelta.length : null,
    detail: 'Tickets inside 3–8 delta ÷ tickets written. This is the drift detector.',
  }
}

export function stopComponent(stops: StopEvent[]): DisciplineComponent {
  const taken = stops.filter((s) => s.takenSameSession).length
  return {
    key: 'stop',
    label: 'Stop',
    numerator: taken,
    denominator: stops.length,
    value: stops.length > 0 ? taken / stops.length : null,
    detail: 'E2 stops taken same session ÷ E2 stops triggered. Unmeasured before this app existed.',
  }
}

export function capacityComponent(
  coverableSharesWithCalls: number,
  coverableShares: number,
): DisciplineComponent {
  return {
    key: 'capacity',
    label: 'Capacity',
    numerator: coverableSharesWithCalls,
    denominator: coverableShares,
    value: coverableShares > 0 ? coverableSharesWithCalls / coverableShares : null,
    detail: 'Coverable shares with calls written ÷ coverable shares. 120,000 OWL shares sat idle for years.',
  }
}

export function disciplineScore(components: DisciplineComponent[]): DisciplineScore {
  const measurable = components.filter((c) => c.value != null)
  const overall =
    measurable.length > 0
      ? measurable.reduce((s, c) => s + c.value!, 0) / measurable.length
      : null
  return { components, overall }
}

/** Month key (UTC) for trend grouping. */
export function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7)
}

/** Rule-score trend by month — the signal that would have caught August before it cost anything. */
export function ruleTrend(positions: PositionLite[]): { month: string; value: number | null; n: number }[] {
  const byMonth = new Map<string, PositionLite[]>()
  for (const p of positions) {
    const k = monthKey(p.openedAt)
    if (!byMonth.has(k)) byMonth.set(k, [])
    byMonth.get(k)!.push(p)
  }
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, ps]) => {
      const c = ruleComponent(ps)
      return { month, value: c.value, n: c.denominator }
    })
}
