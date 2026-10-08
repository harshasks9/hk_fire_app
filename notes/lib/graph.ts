/*
  The knowledge graph as something to look at: people, companies, topics,
  projects, tags, notes, meetings and decisions, with the relationships the
  pipeline maintains between them. Two modes:

  - overview: the most-mentioned entities and tags of a context, linked by
    explicit relations, co-mentions and tag co-occurrence;
  - focus: one node and its neighbourhood (one or two hops), any type.
*/
import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { entityHref } from './search'
import { allTagsOf } from './tags'
import { truncate } from './util'

export type GraphNodeType = 'person' | 'company' | 'topic' | 'project' | 'tag' | 'note' | 'meeting' | 'decision'
export const GRAPH_TYPES: GraphNodeType[] = ['person', 'company', 'topic', 'project', 'tag', 'note', 'meeting', 'decision']

export interface GNode { id: string; type: GraphNodeType; label: string; weight: number; href: string; meta?: string; date?: string }
export interface GEdge { source: string; target: string; relation: string; weight: number }
export interface GraphData { nodes: GNode[]; edges: GEdge[]; focus: GNode | null; truncated: boolean }

export interface GraphQuery { contextIds: string[]; types?: GraphNodeType[]; focus?: { type: GraphNodeType; id: string } | null; depth?: 1 | 2; limit?: number }

const nid = (type: GraphNodeType, id: string) => `${type}:${id}`

class Builder {
  nodes = new Map<string, GNode>()
  edges = new Map<string, GEdge>()
  constructor(readonly types: Set<GraphNodeType>, readonly cap: number) {}
  get full() { return this.nodes.size >= this.cap }
  node(n: GNode, force = false): boolean {
    if (!force && !this.types.has(n.type)) return false
    if (this.nodes.has(n.id)) return true
    if (this.full && !force) return false
    this.nodes.set(n.id, n)
    return true
  }
  edge(a: string, b: string, relation: string, weight = 1) {
    if (a === b || !this.nodes.has(a) || !this.nodes.has(b)) return
    const k = a < b ? `${a}|${b}` : `${b}|${a}`
    const ex = this.edges.get(k)
    if (ex) ex.weight = Math.max(ex.weight, weight)
    else this.edges.set(k, { source: a, target: b, relation, weight })
  }
}

function entityNode(e: { id: string; name: string; type: string; mentionCount: number; attributes?: Record<string, string | undefined> }): GNode {
  return { id: nid(e.type as GraphNodeType, e.id), type: e.type as GraphNodeType, label: e.name, weight: e.mentionCount, href: entityHref(e.type as 'person', e.id), meta: e.attributes?.role ? `${e.attributes.role}${e.attributes.company ? ' · ' + e.attributes.company : ''}` : e.attributes?.status }
}
function noteNode(n: { id: string; title: string; kind: string; wordCount: number; updatedAt: Date; meetingId: string | null }): GNode {
  return { id: nid('note', n.id), type: 'note', label: n.title || 'Untitled', weight: Math.min(30, 2 + n.wordCount / 120), href: n.kind === 'meeting' && n.meetingId ? `/meetings/${n.meetingId}` : `/notes/${n.id}`, meta: n.kind, date: n.updatedAt.toISOString() }
}
function tagNode(tag: string, count: number): GNode {
  return { id: nid('tag', tag), type: 'tag', label: `#${tag}`, weight: count, href: `/notes?tag=${encodeURIComponent(tag)}`, meta: `${count} ${count === 1 ? 'note' : 'notes'}` }
}
function meetingNode(m: { id: string; title: string; startsAt: Date }): GNode {
  return { id: nid('meeting', m.id), type: 'meeting', label: m.title, weight: 6, href: `/meetings/${m.id}`, meta: 'meeting', date: m.startsAt.toISOString() }
}
function decisionNode(d: { id: string; title: string; decidedAt: Date; status: string }): GNode {
  return { id: nid('decision', d.id), type: 'decision', label: truncate(d.title, 60), weight: 5, href: `/decisions/${d.id}`, meta: d.status, date: d.decidedAt.toISOString() }
}

export async function buildGraph(q: GraphQuery): Promise<GraphData> {
  const types = new Set<GraphNodeType>(q.types?.length ? q.types : q.focus ? GRAPH_TYPES : ['person', 'company', 'topic', 'project', 'tag'])
  const b = new Builder(types, q.limit ?? 160)
  if (!q.contextIds.length) return { nodes: [], edges: [], focus: null, truncated: false }
  const focus = q.focus ? await focusGraph(b, q.contextIds, q.focus, q.depth ?? 1) : null
  if (!q.focus) await overviewGraph(b, q.contextIds)
  await connect(b, q.contextIds)
  return { nodes: [...b.nodes.values()], edges: [...b.edges.values()], focus, truncated: b.full }
}

/* ------------------------------------------------------------- overview */

async function overviewGraph(b: Builder, contextIds: string[]) {
  const db = await getDb()
  const wantEntities = (['person', 'company', 'topic', 'project'] as GraphNodeType[]).filter((t) => b.types.has(t))
  if (wantEntities.length) {
    const ents = await db.select().from(schema.entities).where(and(inArray(schema.entities.contextId, contextIds), inArray(schema.entities.type, wantEntities as ('person' | 'company' | 'topic' | 'project')[]), sql`${schema.entities.mentionCount} > 0`)).orderBy(desc(schema.entities.mentionCount)).limit(70)
    for (const e of ents) b.node(entityNode(e))
  }
  if (b.types.has('tag')) {
    const rows = await tagCounts(contextIds, 30)
    for (const r of rows) b.node(tagNode(r.tag, r.count))
  }
  if (b.types.has('meeting')) {
    const ms = await db.select().from(schema.meetings).where(and(inArray(schema.meetings.contextId, contextIds), eq(schema.meetings.status, 'completed'))).orderBy(desc(schema.meetings.startsAt)).limit(30)
    for (const m of ms) b.node(meetingNode(m))
  }
  if (b.types.has('decision')) {
    const ds = await db.select().from(schema.decisions).where(inArray(schema.decisions.contextId, contextIds)).orderBy(desc(schema.decisions.decidedAt)).limit(30)
    for (const d of ds) b.node(decisionNode(d))
  }
  if (b.types.has('note')) {
    const ns = await db.select().from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt))).orderBy(desc(schema.notes.updatedAt)).limit(40)
    for (const n of ns) b.node(noteNode(n))
  }
}

/* --------------------------------------------------------------- focus */

async function focusGraph(b: Builder, contextIds: string[], f: { type: GraphNodeType; id: string }, depth: 1 | 2): Promise<GNode | null> {
  const db = await getDb()
  let seed: GNode | null = null
  if (f.type === 'tag') seed = tagNode(f.id, (await tagCounts(contextIds, 1000)).find((t) => t.tag === f.id)?.count ?? 0)
  else if (f.type === 'note') {
    const n = (await db.select().from(schema.notes).where(and(eq(schema.notes.id, f.id), inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt))))[0]
    if (n) seed = noteNode(n)
  } else if (f.type === 'meeting') {
    const m = (await db.select().from(schema.meetings).where(and(eq(schema.meetings.id, f.id), inArray(schema.meetings.contextId, contextIds))))[0]
    if (m) seed = meetingNode(m)
  } else if (f.type === 'decision') {
    const d = (await db.select().from(schema.decisions).where(and(eq(schema.decisions.id, f.id), inArray(schema.decisions.contextId, contextIds))))[0]
    if (d) seed = decisionNode(d)
  } else {
    const e = (await db.select().from(schema.entities).where(and(eq(schema.entities.id, f.id), inArray(schema.entities.contextId, contextIds))))[0]
    if (e) seed = entityNode(e)
  }
  if (!seed) return null
  b.node(seed, true)
  const first = await expand(b, contextIds, seed)
  if (depth === 2) {
    for (const n of first) {
      if (b.full) break
      if (n.type === 'person' || n.type === 'company' || n.type === 'topic' || n.type === 'project' || n.type === 'tag') await expand(b, contextIds, n, 12)
    }
  }
  return seed
}

/** Add a node's direct neighbours (respecting type filters) and the edges to them. Returns what was added. */
async function expand(b: Builder, contextIds: string[], n: GNode, perKind = 40): Promise<GNode[]> {
  const db = await getDb()
  const added: GNode[] = []
  const link = (m: GNode, relation: string, weight = 1) => {
    const had = b.nodes.has(m.id)
    if (b.node(m)) {
      b.edge(n.id, m.id, relation, weight)
      if (!had) added.push(m)
    }
  }
  const rawId = n.id.slice(n.id.indexOf(':') + 1)
  const isEntity = n.type === 'person' || n.type === 'company' || n.type === 'topic' || n.type === 'project'

  if (isEntity) {
    const rels = await db.select().from(schema.entityRelations).where(and(inArray(schema.entityRelations.contextId, contextIds), or(eq(schema.entityRelations.fromId, rawId), eq(schema.entityRelations.toId, rawId)))).orderBy(desc(schema.entityRelations.weight)).limit(perKind)
    const otherIds = rels.map((r) => (r.fromId === rawId ? r.toId : r.fromId))
    const ents = otherIds.length ? await db.select().from(schema.entities).where(inArray(schema.entities.id, otherIds)) : []
    const mtgs = otherIds.length ? await db.select().from(schema.meetings).where(inArray(schema.meetings.id, otherIds)) : []
    const decs = otherIds.length ? await db.select().from(schema.decisions).where(inArray(schema.decisions.id, otherIds)) : []
    for (const r of rels) {
      const other = r.fromId === rawId ? r.toId : r.fromId
      const e = ents.find((x) => x.id === other)
      if (e) link(entityNode(e), r.relation, r.weight)
      const m = mtgs.find((x) => x.id === other)
      if (m) link(meetingNode(m), r.relation, r.weight)
      const d = decs.find((x) => x.id === other)
      if (d) link(decisionNode(d), r.relation, r.weight)
    }
    // Notes that mention it (and, through them, tags and co-mentioned entities).
    const mentions = await db.select({ n: schema.notes, excerpt: schema.noteEntities.excerpt }).from(schema.noteEntities).innerJoin(schema.notes, eq(schema.notes.id, schema.noteEntities.noteId)).where(and(eq(schema.noteEntities.entityId, rawId), isNull(schema.notes.deletedAt))).orderBy(desc(schema.notes.updatedAt)).limit(perKind)
    const tagCount = new Map<string, number>()
    for (const { n: note } of mentions) {
      link(noteNode(note), 'mentioned in')
      for (const t of allTagsOf(note)) tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
      if (note.meetingId && b.types.has('meeting')) {
        const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, note.meetingId)))[0]
        if (m) link(meetingNode(m), 'discussed in')
      }
    }
    for (const [t, c] of [...tagCount.entries()].sort((a, b2) => b2[1] - a[1]).slice(0, 12)) link(tagNode(t, c), 'tagged', c)
    const co = await coMentions(contextIds, [rawId], 2, perKind)
    if (co.length) {
      const ids = co.map((r) => (r.a === rawId ? r.b : r.a))
      const ents2 = await db.select().from(schema.entities).where(inArray(schema.entities.id, ids))
      for (const r of co) {
        const e = ents2.find((x) => x.id === (r.a === rawId ? r.b : r.a))
        if (e) link(entityNode(e), 'co-mentioned', r.n)
      }
    }
    const decs2 = await db.select().from(schema.decisions).where(and(inArray(schema.decisions.contextId, contextIds), or(eq(schema.decisions.topicEntityId, rawId), eq(schema.decisions.companyEntityId, rawId)))).orderBy(desc(schema.decisions.decidedAt)).limit(12)
    for (const d of decs2) link(decisionNode(d), 'decision about')
  } else if (n.type === 'note') {
    const note = (await db.select().from(schema.notes).where(eq(schema.notes.id, rawId)))[0]
    if (!note) return added
    const ents = await db.select({ e: schema.entities }).from(schema.noteEntities).innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId)).where(eq(schema.noteEntities.noteId, rawId))
    for (const { e } of ents) link(entityNode(e), 'mentions', 1 + Math.min(e.mentionCount, 10) / 10)
    const counts = await tagCounts(contextIds, 1000)
    for (const t of allTagsOf(note)) link(tagNode(t, counts.find((c) => c.tag === t)?.count ?? 1), 'tagged')
    if (note.meetingId) {
      const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, note.meetingId)))[0]
      if (m) link(meetingNode(m), 'meeting')
    }
    const decs = await db.select().from(schema.decisions).where(eq(schema.decisions.sourceNoteId, rawId))
    for (const d of decs) link(decisionNode(d), 'decided here')
    // Notes this one links to, and notes that link here.
    if (b.types.has('note')) {
      const outgoing = await db.select({ n: schema.notes }).from(schema.noteLinks).innerJoin(schema.notes, eq(schema.notes.id, schema.noteLinks.toNoteId)).where(and(eq(schema.noteLinks.fromNoteId, rawId), isNull(schema.notes.deletedAt))).limit(perKind)
      for (const { n: o } of outgoing) link(noteNode(o), 'links to', 2)
      const incoming = await db.select({ n: schema.notes }).from(schema.noteLinks).innerJoin(schema.notes, eq(schema.notes.id, schema.noteLinks.fromNoteId)).where(and(eq(schema.noteLinks.toNoteId, rawId), isNull(schema.notes.deletedAt))).limit(perKind)
      for (const { n: o } of incoming) link(noteNode(o), 'linked from', 2)
    }
    // Related notes through shared entities.
    const entIds = ents.map((x) => x.e.id)
    if (entIds.length && b.types.has('note')) {
      const rel = (await db.execute(sql`select ne.note_id as id, count(*)::int as n from note_entities ne join notes nt on nt.id = ne.note_id where ne.entity_id in ${entIds} and ne.note_id <> ${rawId} and nt.deleted_at is null and nt.context_id in ${contextIds} group by ne.note_id order by n desc limit 10`)) as unknown as { rows?: { id: string; n: number }[] } | { id: string; n: number }[]
      const rows = Array.isArray(rel) ? rel : (rel.rows ?? [])
      const others = rows.length ? await db.select().from(schema.notes).where(inArray(schema.notes.id, rows.map((r) => r.id))) : []
      for (const r of rows) {
        const o = others.find((x) => x.id === r.id)
        if (o && Number(r.n) >= 2) link(noteNode(o), 'shares people/topics', Number(r.n))
      }
    }
  } else if (n.type === 'tag') {
    const notes = await db.select().from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), sql`(${schema.notes.tags} @> ${JSON.stringify([rawId])}::jsonb or ${schema.notes.manualTags} @> ${JSON.stringify([rawId])}::jsonb)`)).orderBy(desc(schema.notes.updatedAt)).limit(perKind)
    const noteIds = notes.map((x) => x.id)
    for (const note of notes) link(noteNode(note), 'tagged')
    if (noteIds.length) {
      const ents = await db.select({ e: schema.entities, n: sql<number>`count(*)` }).from(schema.noteEntities).innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId)).where(inArray(schema.noteEntities.noteId, noteIds)).groupBy(schema.entities.id).orderBy(desc(sql`count(*)`)).limit(20)
      for (const { e, n: c } of ents) link(entityNode(e), 'appears with', Number(c))
      const coTags = new Map<string, number>()
      for (const note of notes) for (const t of allTagsOf(note)) if (t !== rawId) coTags.set(t, (coTags.get(t) ?? 0) + 1)
      const counts = await tagCounts(contextIds, 1000)
      for (const [t, c] of [...coTags.entries()].sort((a, b2) => b2[1] - a[1]).slice(0, 10)) link(tagNode(t, counts.find((x) => x.tag === t)?.count ?? c), 'co-tagged', c)
    }
  } else if (n.type === 'meeting') {
    const m = (await db.select().from(schema.meetings).where(eq(schema.meetings.id, rawId)))[0]
    if (!m) return added
    const parts = await db.select({ e: schema.entities, relation: schema.entityRelations.relation }).from(schema.entityRelations).innerJoin(schema.entities, eq(schema.entities.id, schema.entityRelations.fromId)).where(and(eq(schema.entityRelations.toType, 'meeting'), eq(schema.entityRelations.toId, rawId)))
    for (const { e, relation } of parts) link(entityNode(e), relation)
    if (m.companyEntityId) {
      const c = (await db.select().from(schema.entities).where(eq(schema.entities.id, m.companyEntityId)))[0]
      if (c) link(entityNode(c), 'with')
    }
    if (m.noteId) {
      const note = (await db.select().from(schema.notes).where(eq(schema.notes.id, m.noteId)))[0]
      if (note) {
        link(noteNode(note), 'notes')
        const ents = await db.select({ e: schema.entities }).from(schema.noteEntities).innerJoin(schema.entities, eq(schema.entities.id, schema.noteEntities.entityId)).where(eq(schema.noteEntities.noteId, note.id))
        for (const { e } of ents) link(entityNode(e), 'discussed')
        const counts = await tagCounts(contextIds, 1000)
        for (const t of allTagsOf(note)) link(tagNode(t, counts.find((c) => c.tag === t)?.count ?? 1), 'tagged')
        const decs = await db.select().from(schema.decisions).where(eq(schema.decisions.sourceNoteId, note.id))
        for (const d of decs) link(decisionNode(d), 'decided here')
      }
    }
  } else if (n.type === 'decision') {
    const d = (await db.select().from(schema.decisions).where(eq(schema.decisions.id, rawId)))[0]
    if (!d) return added
    for (const [id, rel] of [[d.topicEntityId, 'about'], [d.companyEntityId, 'concerns']] as const) {
      if (!id) continue
      const e = (await db.select().from(schema.entities).where(eq(schema.entities.id, id)))[0]
      if (e) link(entityNode(e), rel)
    }
    if (d.sourceNoteId) {
      const note = (await db.select().from(schema.notes).where(and(eq(schema.notes.id, d.sourceNoteId), isNull(schema.notes.deletedAt))))[0]
      if (note) link(noteNode(note), 'decided in')
    }
    const rels = await db.select({ e: schema.entities, relation: schema.entityRelations.relation }).from(schema.entityRelations).innerJoin(schema.entities, eq(schema.entities.id, schema.entityRelations.fromId)).where(and(eq(schema.entityRelations.toType, 'decision'), eq(schema.entityRelations.toId, rawId)))
    for (const { e, relation } of rels) link(entityNode(e), relation)
  }
  return added
}

/* -------------------------------------------------------------- connect */

/** Edges among everything already in the graph: explicit relations, co-mentions, tag co-occurrence, note↔entity, note↔tag, meeting↔note. */
async function connect(b: Builder, contextIds: string[]) {
  const db = await getDb()
  const entityIds = [...b.nodes.values()].filter((n) => n.type === 'person' || n.type === 'company' || n.type === 'topic' || n.type === 'project').map((n) => n.id.slice(n.id.indexOf(':') + 1))
  const noteIds = [...b.nodes.values()].filter((n) => n.type === 'note').map((n) => n.id.slice(5))
  const meetingIds = [...b.nodes.values()].filter((n) => n.type === 'meeting').map((n) => n.id.slice(8))
  const decisionIds = [...b.nodes.values()].filter((n) => n.type === 'decision').map((n) => n.id.slice(9))
  const tags = [...b.nodes.values()].filter((n) => n.type === 'tag').map((n) => n.id.slice(4))
  const typeOf = new Map<string, GraphNodeType>()
  for (const n of b.nodes.values()) typeOf.set(n.id.slice(n.id.indexOf(':') + 1), n.type)
  const key = (raw: string) => { const t = typeOf.get(raw); return t ? nid(t, raw) : null }

  const allIds = [...entityIds, ...meetingIds, ...decisionIds]
  if (allIds.length) {
    const rels = await db.select().from(schema.entityRelations).where(and(inArray(schema.entityRelations.contextId, contextIds), inArray(schema.entityRelations.fromId, allIds), inArray(schema.entityRelations.toId, allIds)))
    for (const r of rels) {
      const a = key(r.fromId), c = key(r.toId)
      if (a && c) b.edge(a, c, r.relation, r.weight)
    }
  }
  if (entityIds.length > 1) {
    for (const r of await coMentions(contextIds, entityIds, 2, 400)) {
      const a = key(r.a), c = key(r.b)
      if (a && c) b.edge(a, c, 'co-mentioned', r.n)
    }
  }
  if (noteIds.length) {
    const notes = await db.select().from(schema.notes).where(inArray(schema.notes.id, noteIds))
    if (entityIds.length) {
      const ne = await db.select().from(schema.noteEntities).where(and(inArray(schema.noteEntities.noteId, noteIds), inArray(schema.noteEntities.entityId, entityIds)))
      for (const r of ne) { const c = key(r.entityId); if (c) b.edge(nid('note', r.noteId), c, 'mentions') }
    }
    if (noteIds.length > 1) {
      const nl = await db.select().from(schema.noteLinks).where(and(inArray(schema.noteLinks.fromNoteId, noteIds), inArray(schema.noteLinks.toNoteId, noteIds)))
      for (const l of nl) b.edge(nid('note', l.fromNoteId), nid('note', l.toNoteId), 'links to', 2)
    }
    for (const n of notes) {
      for (const t of allTagsOf(n)) if (tags.includes(t)) b.edge(nid('note', n.id), nid('tag', t), 'tagged')
      if (n.meetingId && meetingIds.includes(n.meetingId)) b.edge(nid('note', n.id), nid('meeting', n.meetingId), 'notes')
    }
    if (decisionIds.length) {
      const ds = await db.select().from(schema.decisions).where(inArray(schema.decisions.id, decisionIds))
      for (const d of ds) if (d.sourceNoteId && noteIds.includes(d.sourceNoteId)) b.edge(nid('decision', d.id), nid('note', d.sourceNoteId), 'decided in')
    }
  }
  if (decisionIds.length && entityIds.length) {
    const ds = await db.select().from(schema.decisions).where(inArray(schema.decisions.id, decisionIds))
    for (const d of ds) {
      if (d.topicEntityId && key(d.topicEntityId)) b.edge(nid('decision', d.id), key(d.topicEntityId)!, 'about')
      if (d.companyEntityId && key(d.companyEntityId)) b.edge(nid('decision', d.id), key(d.companyEntityId)!, 'concerns')
    }
  }
  if (meetingIds.length && entityIds.length) {
    const ms = await db.select().from(schema.meetings).where(inArray(schema.meetings.id, meetingIds))
    for (const m of ms) if (m.companyEntityId && key(m.companyEntityId)) b.edge(nid('meeting', m.id), key(m.companyEntityId)!, 'with')
  }
  if (tags.length && entityIds.length) {
    // Tag ↔ entity co-occurrence through notes.
    const rows = (await db.execute(sql`select t.tag as tag, ne.entity_id as entity_id, count(*)::int as n from notes n cross join lateral jsonb_array_elements_text(n.tags || n.manual_tags) as t(tag) join note_entities ne on ne.note_id = n.id where n.context_id in ${contextIds} and n.deleted_at is null and t.tag in ${tags} and ne.entity_id in ${entityIds} group by t.tag, ne.entity_id having count(*) >= 2 order by n desc limit 400`)) as unknown as { rows?: { tag: string; entity_id: string; n: number }[] } | { tag: string; entity_id: string; n: number }[]
    for (const r of Array.isArray(rows) ? rows : (rows.rows ?? [])) {
      const c = key(r.entity_id)
      if (c) b.edge(nid('tag', r.tag), c, 'tagged together', Number(r.n))
    }
  }
}

async function coMentions(contextIds: string[], entityIds: string[], min: number, limit: number): Promise<{ a: string; b: string; n: number }[]> {
  if (!entityIds.length) return []
  const db = await getDb()
  const single = entityIds.length === 1
  const rows = (await db.execute(
    single
      ? sql`select a.entity_id as a, b.entity_id as b, count(*)::int as n from note_entities a join note_entities b on a.note_id = b.note_id and a.entity_id <> b.entity_id join notes n on n.id = a.note_id where a.entity_id = ${entityIds[0]} and n.deleted_at is null and n.context_id in ${contextIds} group by a.entity_id, b.entity_id having count(*) >= ${min} order by n desc limit ${limit}`
      : sql`select a.entity_id as a, b.entity_id as b, count(*)::int as n from note_entities a join note_entities b on a.note_id = b.note_id and a.entity_id < b.entity_id join notes n on n.id = a.note_id where a.entity_id in ${entityIds} and b.entity_id in ${entityIds} and n.deleted_at is null and n.context_id in ${contextIds} group by a.entity_id, b.entity_id having count(*) >= ${min} order by n desc limit ${limit}`,
  )) as unknown as { rows?: { a: string; b: string; n: number }[] } | { a: string; b: string; n: number }[]
  return (Array.isArray(rows) ? rows : (rows.rows ?? [])).map((r) => ({ a: r.a, b: r.b, n: Number(r.n) }))
}

async function tagCounts(contextIds: string[], limit: number): Promise<{ tag: string; count: number }[]> {
  const db = await getDb()
  const rows = (await db.execute(sql`select t.tag as tag, count(distinct n.id)::int as count from notes n cross join lateral jsonb_array_elements_text(n.tags || n.manual_tags) as t(tag) where n.context_id in ${contextIds} and n.deleted_at is null group by t.tag order by count desc, tag asc limit ${limit}`)) as unknown as { rows?: { tag: string; count: number }[] } | { tag: string; count: number }[]
  return (Array.isArray(rows) ? rows : (rows.rows ?? [])).map((r) => ({ tag: String(r.tag), count: Number(r.count) }))
}
