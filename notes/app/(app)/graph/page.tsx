import { Page } from '@/components/shell/AppShell'
import { PageHeader } from '@/components/ui'
import { getActiveContext } from '@/lib/context'
import { getDb, schema } from '@/lib/db'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { GraphView } from '@/components/graph/GraphView'
export const dynamic = 'force-dynamic'
export default async function GraphPage() {
  const ctx = await getActiveContext()
  const db = await getDb()
  const ents = await db.select({ id: schema.entities.id, name: schema.entities.name, type: schema.entities.type, weight: schema.entities.mentionCount }).from(schema.entities).where(and(eq(schema.entities.contextId, ctx.id), sql`${schema.entities.mentionCount} > 0`)).orderBy(sql`${schema.entities.mentionCount} desc`).limit(60)
  const ids = ents.map((e) => e.id)
  const rels = ids.length ? await db.select().from(schema.entityRelations).where(and(eq(schema.entityRelations.contextId, ctx.id), inArray(schema.entityRelations.fromId, ids), inArray(schema.entityRelations.toId, ids))) : []
  // Co-mention edges strengthen the graph beyond explicit relations.
  const co = ids.length ? await db.execute(sql`select a.entity_id as a, b.entity_id as b, count(*)::int as n from note_entities a join note_entities b on a.note_id = b.note_id and a.entity_id < b.entity_id where a.entity_id in ${ids} and b.entity_id in ${ids} group by a.entity_id, b.entity_id having count(*) >= 2`) : { rows: [] as unknown[] }
  const edgeMap = new Map<string, { from: string; to: string; relation: string; weight: number }>()
  for (const r of rels) edgeMap.set(`${r.fromId}|${r.toId}`, { from: r.fromId, to: r.toId, relation: r.relation, weight: r.weight })
  for (const row of (co as unknown as { rows: { a: string; b: string; n: number }[] }).rows ?? (co as unknown as { a: string; b: string; n: number }[])) {
    const k = `${row.a}|${row.b}`
    if (!edgeMap.has(k) && !edgeMap.has(`${row.b}|${row.a}`)) edgeMap.set(k, { from: row.a, to: row.b, relation: 'co-mentioned', weight: Number(row.n) })
  }
  return (
    <Page width="wide">
      <PageHeader title="Graph" subtitle="The relationships the system maintains internally to make retrieval smarter. Optional view — nothing here needs tending." />
      <GraphView nodes={ents} edges={[...edgeMap.values()]} />
    </Page>
  )
}
