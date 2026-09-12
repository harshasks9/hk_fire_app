/* Retrieval for RAG: gather the passages an answer must be grounded in. */
import { and, desc, eq, ilike, inArray, isNull, or, sql, cosineDistance } from 'drizzle-orm'
import { getDb, schema } from './db'
import { embedQuery } from './queries'
import { tokenize } from './ai/embeddings'

export interface Passage { noteId: string; title: string; date: Date; kind: string; text: string; score: number; meetingId?: string | null }

export async function retrievePassages(contextIds: string[], question: string, opts: { limit?: number; entityId?: string; noteIds?: string[] } = {}): Promise<Passage[]> {
  const db = await getDb()
  const limit = opts.limit ?? 10
  const v = await embedQuery(question)
  const dist = cosineDistance(schema.embeddings.embedding, v)
  let scopeNoteIds = opts.noteIds
  if (opts.entityId) {
    const m = await db.select({ noteId: schema.noteEntities.noteId }).from(schema.noteEntities).where(eq(schema.noteEntities.entityId, opts.entityId))
    scopeNoteIds = m.map((x) => x.noteId)
    if (!scopeNoteIds.length) return []
  }
  const conds = [inArray(schema.embeddings.contextId, contextIds), eq(schema.embeddings.ownerType, 'note')]
  if (scopeNoteIds) conds.push(inArray(schema.embeddings.ownerId, scopeNoteIds))
  const sem = await db.select({ ownerId: schema.embeddings.ownerId, text: schema.embeddings.text, d: dist }).from(schema.embeddings).where(and(...conds)).orderBy(dist).limit(limit * 3)
  const scores = new Map<string, { text: string; score: number }[]>()
  for (const s of sem) {
    const sim = 1 - Number(s.d)
    scores.set(s.ownerId, [...(scores.get(s.ownerId) ?? []), { text: s.text, score: sim }])
  }
  // Keyword boost: chunks containing rare query terms
  const terms = tokenize(question).filter((t) => t.length > 3)
  const keywordConds = terms.slice(0, 6).map((t) => ilike(schema.notes.contentText, `%${t}%`))
  if (keywordConds.length) {
    const kw = await db.select({ id: schema.notes.id, text: schema.notes.contentText }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), or(...keywordConds)!, scopeNoteIds ? inArray(schema.notes.id, scopeNoteIds) : sql`true`)).orderBy(desc(schema.notes.updatedAt)).limit(20)
    for (const n of kw) {
      const lower = n.text.toLowerCase()
      const matched = terms.filter((t) => lower.includes(t)).length
      if (!matched) continue
      const existing = scores.get(n.id)
      const boost = (matched / Math.max(terms.length, 1)) * 0.5
      if (existing) existing.forEach((e) => (e.score += boost))
      else scores.set(n.id, [{ text: bestWindow(n.text, terms), score: 0.2 + boost }])
    }
  }
  const ranked = [...scores.entries()].map(([noteId, chunks]) => ({ noteId, best: chunks.sort((a, b) => b.score - a.score)[0]! })).sort((a, b) => b.best.score - a.best.score).slice(0, limit)
  const ids = ranked.map((r) => r.noteId)
  if (!ids.length) return []
  const notes = await db.select({ id: schema.notes.id, title: schema.notes.title, createdAt: schema.notes.createdAt, kind: schema.notes.kind, meetingId: schema.notes.meetingId }).from(schema.notes).where(and(inArray(schema.notes.id, ids), isNull(schema.notes.deletedAt)))
  const out: Passage[] = []
  for (const r of ranked) {
    const n = notes.find((x) => x.id === r.noteId)
    if (n) out.push({ noteId: n.id, title: n.title || 'Untitled', date: n.createdAt, kind: n.kind, text: r.best.text, score: r.best.score, meetingId: n.meetingId })
  }
  return out
}

function bestWindow(text: string, terms: string[]): string {
  const lower = text.toLowerCase()
  let idx = -1
  for (const t of terms) {
    const i = lower.indexOf(t)
    if (i >= 0 && (idx < 0 || i < idx)) idx = i
  }
  const start = Math.max(0, (idx < 0 ? 0 : idx) - 300)
  return text.slice(start, start + 900)
}
