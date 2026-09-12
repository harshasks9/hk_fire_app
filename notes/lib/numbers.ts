/*
  The numbers dashboard: every figure the pipeline extracted (facts), grouped
  by what it measures and who it belongs to, with history over time.
*/
import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb, schema } from './db'
import { canonicalLabel } from './ai/local'

export interface NumberPoint { value: number; display: string; at: string; noteId: string | null; excerpt: string | null; current: boolean }
export interface NumberSeries { entityId: string; entityName: string; entityType: string; label: string; unit: string | null; points: NumberPoint[]; latest: NumberPoint; previous: NumberPoint | null }
export interface NumbersData { series: NumberSeries[]; labels: string[]; entities: { id: string; name: string; type: string }[]; total: number }

export async function numbersFor(contextIds: string[], opts: { limit?: number } = {}): Promise<NumbersData> {
  if (!contextIds.length) return { series: [], labels: [], entities: [], total: 0 }
  const db = await getDb()
  const rows = await db
    .select({ f: schema.facts, entityName: schema.entities.name, entityType: schema.entities.type })
    .from(schema.facts)
    .innerJoin(schema.entities, eq(schema.entities.id, schema.facts.entityId))
    .where(and(inArray(schema.facts.contextId, contextIds)))
    .orderBy(desc(schema.facts.observedAt))
    .limit(opts.limit ?? 3000)
  const groups = new Map<string, NumberSeries>()
  for (const { f, entityName, entityType } of rows) {
    if (f.numericValue === null || f.numericValue === undefined || !Number.isFinite(f.numericValue)) continue
    const label = canonicalLabel(f.label)
    const key = `${f.entityId}|${label.toLowerCase()}`
    const point: NumberPoint = { value: f.numericValue, display: f.value, at: f.observedAt.toISOString(), noteId: f.sourceNoteId, excerpt: f.sourceExcerpt, current: !f.supersededById }
    const g = groups.get(key)
    if (g) g.points.push(point)
    else groups.set(key, { entityId: f.entityId, entityName, entityType, label, unit: f.unit, points: [point], latest: point, previous: null })
  }
  const series: NumberSeries[] = []
  for (const g of groups.values()) {
    g.points.sort((a, b) => a.at.localeCompare(b.at))
    // Same value observed twice in a row is one observation.
    g.points = g.points.filter((p, i, arr) => i === 0 || p.value !== arr[i - 1]!.value || p.at.slice(0, 10) !== arr[i - 1]!.at.slice(0, 10))
    g.latest = g.points[g.points.length - 1]!
    g.previous = g.points.length > 1 ? g.points[g.points.length - 2]! : null
    series.push(g)
  }
  series.sort((a, b) => b.points.length - a.points.length || b.latest.at.localeCompare(a.latest.at))
  const labels = [...new Set(series.map((s) => s.label))].sort()
  const entities = [...new Map(series.map((s) => [s.entityId, { id: s.entityId, name: s.entityName, type: s.entityType }])).values()].sort((a, b) => a.name.localeCompare(b.name))
  return { series, labels, entities, total: rows.length }
}
