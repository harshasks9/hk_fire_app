/* Hybrid search: exact keyword + semantic (pgvector) + entity match, grouped by type. */
import { and, desc, eq, ilike, inArray, isNull, or, sql, cosineDistance } from 'drizzle-orm'
import { getDb, schema } from './db'
import { queryVector } from './queries'
import type { EntityType } from './db/schema'
import { escapeRegExp, truncate } from './util'

export interface SearchHit { id: string; type: 'note' | 'meeting' | 'person' | 'company' | 'topic' | 'project' | 'task' | 'decision' | 'research' | 'commitment'; title: string; subtitle?: string; snippet?: string; href: string; score: number; date?: Date; matchKind: 'keyword' | 'semantic' | 'entity' | 'both' }

export interface SearchResult { query: string; groups: { type: string; label: string; hits: SearchHit[] }[]; total: number; isQuestion: boolean }

const GROUP_LABELS: Record<string, string> = { note: 'Notes', meeting: 'Meetings', person: 'People', company: 'Companies', topic: 'Topics', project: 'Projects', task: 'Tasks', decision: 'Decisions', research: 'Research', commitment: 'Open loops' }

export function looksLikeQuestion(q: string): boolean {
  const t = q.trim().toLowerCase()
  return /\?$/.test(t) || /^(what|who|when|where|why|how|which|did|do|does|is|are|was|were|show|list|find|summarize|summarise|tell me|give me|has|have|should|can)\b/.test(t) && t.split(' ').length >= 3
}

function snippetFor(text: string, q: string): string {
  const terms = q.split(/\s+/).filter((t) => t.length > 2)
  const lower = text.toLowerCase()
  let idx = -1
  for (const t of terms) {
    const i = lower.indexOf(t.toLowerCase())
    if (i >= 0 && (idx < 0 || i < idx)) idx = i
  }
  if (idx < 0) return truncate(text.replace(/\s+/g, ' '), 160)
  const start = Math.max(0, idx - 60)
  const s = text.slice(start, start + 180).replace(/\s+/g, ' ')
  return (start > 0 ? '…' : '') + s + '…'
}

export function highlight(text: string, q: string): string {
  const terms = q.split(/\s+/).filter((t) => t.length > 2)
  if (!terms.length) return text
  return text.replace(new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi'), '<mark>$1</mark>')
}

export async function search(contextIds: string[], q: string, opts: { limit?: number; semantic?: boolean } = {}): Promise<SearchResult> {
  const db = await getDb()
  const query = q.trim()
  const hits = new Map<string, SearchHit>()
  const add = (h: SearchHit) => {
    const key = `${h.type}:${h.id}`
    const ex = hits.get(key)
    if (ex) {
      ex.score += h.score
      if (ex.matchKind !== h.matchKind) ex.matchKind = 'both'
      if (!ex.snippet && h.snippet) ex.snippet = h.snippet
    } else hits.set(key, h)
  }
  if (!query) return { query, groups: [], total: 0, isQuestion: false }
  const like = `%${query}%`
  const ctx = (col: import("drizzle-orm/pg-core").PgColumn) => inArray(col, contextIds)

  // Entities: name / alias
  const ents = await db.select().from(schema.entities).where(and(ctx(schema.entities.contextId), or(ilike(schema.entities.name, like), sql`exists (select 1 from jsonb_array_elements_text(${schema.entities.aliases}) a where a ilike ${like})`))).limit(12)
  for (const e of ents) add({ id: e.id, type: e.type, title: e.name, subtitle: e.attributes.role ? `${e.attributes.role}${e.attributes.company ? ' · ' + e.attributes.company : ''}` : e.attributes.status, href: entityHref(e.type, e.id), score: 10 + (e.name.toLowerCase() === query.toLowerCase() ? 10 : 0) + Math.min(e.mentionCount, 10) / 5, matchKind: 'entity' })

  // Notes keyword
  const notes = await db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind, text: schema.notes.contentText, updatedAt: schema.notes.updatedAt, meetingId: schema.notes.meetingId }).from(schema.notes).where(and(ctx(schema.notes.contextId), isNull(schema.notes.deletedAt), or(ilike(schema.notes.title, like), ilike(schema.notes.contentText, like)))).orderBy(desc(schema.notes.updatedAt)).limit(30)
  for (const n of notes) {
    const titleHit = n.title.toLowerCase().includes(query.toLowerCase())
    add({ id: n.id, type: n.kind === 'meeting' ? 'meeting' : 'note', title: n.title || 'Untitled', snippet: snippetFor(n.text, query), href: n.kind === 'meeting' && n.meetingId ? `/meetings/${n.meetingId}` : `/notes/${n.id}`, score: 5 + (titleHit ? 4 : 0), date: n.updatedAt, matchKind: 'keyword' })
  }
  // Tasks / decisions / commitments / research keyword
  const tasks = await db.select().from(schema.tasks).where(and(ctx(schema.tasks.contextId), ilike(schema.tasks.title, like))).limit(10)
  for (const t of tasks) add({ id: t.id, type: 'task', title: t.title, subtitle: `${t.owner} · ${t.status}`, href: `/tasks?highlight=${t.id}`, score: 4, date: t.dueAt ?? t.createdAt, matchKind: 'keyword' })
  const decs = await db.select().from(schema.decisions).where(and(ctx(schema.decisions.contextId), or(ilike(schema.decisions.title, like), ilike(schema.decisions.statement, like)))).limit(10)
  for (const d of decs) add({ id: d.id, type: 'decision', title: d.title, snippet: d.statement, href: `/decisions/${d.id}`, score: 6, date: d.decidedAt, matchKind: 'keyword' })
  const cmts = await db.select().from(schema.commitments).where(and(ctx(schema.commitments.contextId), eq(schema.commitments.status, 'open'), ilike(schema.commitments.text, like))).limit(8)
  for (const c of cmts) add({ id: c.id, type: 'commitment', title: c.text, subtitle: c.kind.replace('_', ' '), href: `/loops?highlight=${c.id}`, score: 4, date: c.detectedAt, matchKind: 'keyword' })
  const research = await db.select().from(schema.researchProjects).where(and(ctx(schema.researchProjects.contextId), or(ilike(schema.researchProjects.name, like), ilike(schema.researchProjects.synthesis, like)))).limit(5)
  for (const r of research) add({ id: r.id, type: 'research', title: r.name, snippet: r.description ?? undefined, href: `/research/${r.id}`, score: 6, date: r.updatedAt, matchKind: 'keyword' })

  // Semantic
  const qv = opts.semantic !== false ? await queryVector(contextIds, query) : null
  if (qv) {
    const dist = cosineDistance(schema.embeddings.embedding, qv.vector)
    const sem = await db.select({ ownerType: schema.embeddings.ownerType, ownerId: schema.embeddings.ownerId, text: schema.embeddings.text, d: dist }).from(schema.embeddings).where(and(ctx(schema.embeddings.contextId), eq(schema.embeddings.provider, qv.provider))).orderBy(dist).limit(24)
    const noteIds = [...new Set(sem.filter((s) => s.ownerType === 'note').map((s) => s.ownerId))]
    const noteRows = noteIds.length ? await db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind, updatedAt: schema.notes.updatedAt, meetingId: schema.notes.meetingId }).from(schema.notes).where(and(inArray(schema.notes.id, noteIds), isNull(schema.notes.deletedAt))) : []
    for (const s of sem) {
      const sim = 1 - Number(s.d)
      if (sim < 0.12) continue
      if (s.ownerType === 'note') {
        const n = noteRows.find((r) => r.id === s.ownerId)
        if (n) add({ id: n.id, type: n.kind === 'meeting' ? 'meeting' : 'note', title: n.title || 'Untitled', snippet: snippetFor(s.text, query), href: n.kind === 'meeting' && n.meetingId ? `/meetings/${n.meetingId}` : `/notes/${n.id}`, score: sim * 8, date: n.updatedAt, matchKind: 'semantic' })
      } else if (s.ownerType === 'entity') {
        const e = (await db.select().from(schema.entities).where(eq(schema.entities.id, s.ownerId)))[0]
        if (e) add({ id: e.id, type: e.type, title: e.name, subtitle: e.attributes.role, href: entityHref(e.type, e.id), score: sim * 4, matchKind: 'semantic' })
      } else if (s.ownerType === 'decision') {
        const d = (await db.select().from(schema.decisions).where(eq(schema.decisions.id, s.ownerId)))[0]
        if (d) add({ id: d.id, type: 'decision', title: d.title, snippet: d.statement, href: `/decisions/${d.id}`, score: sim * 5, date: d.decidedAt, matchKind: 'semantic' })
      } else if (s.ownerType === 'research') {
        const r = (await db.select().from(schema.researchProjects).where(eq(schema.researchProjects.id, s.ownerId)))[0]
        if (r) add({ id: r.id, type: 'research', title: r.name, snippet: r.description ?? undefined, href: `/research/${r.id}`, score: sim * 5, matchKind: 'semantic' })
      }
    }
  }
  const all = [...hits.values()].sort((a, b) => b.score - a.score)
  const order = ['note', 'meeting', 'person', 'company', 'topic', 'project', 'decision', 'task', 'commitment', 'research']
  const groups = order
    .map((type) => ({ type, label: GROUP_LABELS[type]!, hits: all.filter((h) => h.type === type).slice(0, opts.limit ?? 8) }))
    .filter((g) => g.hits.length)
    .sort((a, b) => (b.hits[0]?.score ?? 0) - (a.hits[0]?.score ?? 0))
  return { query, groups, total: all.length, isQuestion: looksLikeQuestion(query) }
}

export function entityHref(type: EntityType, id: string): string {
  return type === 'person' ? `/people/${id}` : type === 'company' ? `/companies/${id}` : type === 'topic' ? `/topics/${id}` : `/topics/${id}`
}
