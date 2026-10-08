/*
  Tags: short lowercase labels derived from a note's content by the pipeline
  (plus any the owner adds by hand). They exist to find things again — the
  Notes page filters by them, search understands `tag:` / `#tag`, and the
  graph shows them as hubs between notes and people.
*/
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import type { Extraction } from './ai/types'
import type { Note } from './db/schema'

export const MAX_TAGS = 12
const STOP = new Set(['note', 'notes', 'misc', 'general', 'other', 'untitled', 'todo', 'the', 'and', 'a', 'of', 'n-a', 'none'])

export function normalizeTag(raw: string): string | null {
  const t = raw
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
    .replace(/-+$/, '')
  if (!t || t.length < 2 || STOP.has(t)) return null
  if (/^\d+$/.test(t)) return null
  return t
}

export function normalizeTags(list: Iterable<string>): string[] {
  const out: string[] = []
  for (const raw of list) {
    const t = normalizeTag(raw)
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}

/**
 * What the pipeline stores: the model's tags first, then topics/projects as tags,
 * then a few signal tags that make filtering useful (what kind of thing this is,
 * what it contains). Capped so tags stay meaningful.
 */
export function deriveTags(ex: Extraction, note: Pick<Note, 'kind' | 'source'>): string[] {
  const out = normalizeTags(ex.tags ?? [])
  const add = (t: string) => {
    const n = normalizeTag(t)
    if (n && !out.includes(n) && out.length < MAX_TAGS) out.push(n)
  }
  for (const t of ex.topics) add(t.name)
  for (const p of ex.projects) add(p.name)
  if (note.kind === 'meeting' || note.kind === 'transcript') add('meeting')
  if (note.kind === 'voice') add('voice-note')
  if (note.kind === 'link') add('link')
  if (note.kind === 'screenshot') add('screenshot')
  if (note.source === 'recording' || note.source === 'recording:auto') add('recording')
  if (ex.decisions.some((d) => d.status !== 'proposed')) add('decision')
  if (ex.actions.length) add('action-items')
  if (ex.commitments.some((c) => c.kind === 'waiting' || c.kind === 'promised')) add('open-loop')
  if (ex.numbers.length >= 2) add('numbers')
  if (ex.risks.length) add('risk')
  return out.slice(0, MAX_TAGS)
}

export function allTagsOf(n: Pick<Note, 'tags' | 'manualTags'>): string[] {
  return normalizeTags([...(n.manualTags ?? []), ...(n.tags ?? [])])
}

export interface TagCount { tag: string; count: number; manual: number }

/** Every tag used in the given contexts with how many live notes carry it. */
export async function listTags(contextIds: string[], opts: { limit?: number } = {}): Promise<TagCount[]> {
  if (!contextIds.length) return []
  const db = await getDb()
  const rows = (await db.execute(sql`
    select tag, count(*)::int as count, sum(case when manual then 1 else 0 end)::int as manual from (
      select n.id, t.tag, false as manual from notes n cross join lateral jsonb_array_elements_text(n.tags) as t(tag) where n.context_id in ${contextIds} and n.deleted_at is null
      union
      select n.id, t.tag, true as manual from notes n cross join lateral jsonb_array_elements_text(n.manual_tags) as t(tag) where n.context_id in ${contextIds} and n.deleted_at is null
    ) x group by tag order by count desc, tag asc limit ${opts.limit ?? 200}`)) as unknown as { rows?: TagCount[] } | TagCount[]
  const list = Array.isArray(rows) ? rows : (rows.rows ?? [])
  return list.map((r) => ({ tag: String(r.tag), count: Number(r.count), manual: Number(r.manual) }))
}

/** SQL condition: the note carries `tag` (auto or manual). */
export function hasTagSql(tag: string) {
  const j = JSON.stringify([tag])
  return sql`(${schema.notes.tags} @> ${j}::jsonb or ${schema.notes.manualTags} @> ${j}::jsonb)`
}

export async function setManualTags(noteId: string, tags: string[]): Promise<string[]> {
  const db = await getDb()
  const clean = normalizeTags(tags).slice(0, 30)
  await db.update(schema.notes).set({ manualTags: clean, updatedAt: new Date() }).where(eq(schema.notes.id, noteId))
  return clean
}

/** Remove an automatic tag from one note (it may return if the note is reprocessed). */
export async function removeAutoTag(noteId: string, tag: string): Promise<void> {
  const db = await getDb()
  const n = (await db.select({ tags: schema.notes.tags }).from(schema.notes).where(eq(schema.notes.id, noteId)))[0]
  if (!n) return
  await db.update(schema.notes).set({ tags: n.tags.filter((t) => t !== tag) }).where(eq(schema.notes.id, noteId))
}

/** Notes in the contexts that have no tags yet (candidates for a backfill). */
export async function untaggedNoteIds(contextIds: string[], limit = 20): Promise<{ ids: string[]; remaining: number }> {
  if (!contextIds.length) return { ids: [], remaining: 0 }
  const db = await getDb()
  const where = and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), sql`jsonb_array_length(${schema.notes.tags}) = 0`, sql`${schema.notes.privacy} <> 'ai_excluded'`, sql`length(${schema.notes.contentText}) > 20`)
  const total = Number((await db.select({ n: sql<number>`count(*)` }).from(schema.notes).where(where))[0]?.n ?? 0)
  const rows = await db.select({ id: schema.notes.id }).from(schema.notes).where(where).orderBy(desc(schema.notes.updatedAt)).limit(limit)
  return { ids: rows.map((r) => r.id), remaining: total }
}

/** Rename a tag everywhere in the given contexts (both automatic and manual lists). Returns notes touched. */
export async function renameTag(contextIds: string[], from: string, to: string): Promise<number> {
  const db = await getDb()
  const [f] = normalizeTags([from]); const [t] = normalizeTags([to])
  if (!f || !t || !contextIds.length) return 0
  const rows = await db.select({ id: schema.notes.id, tags: schema.notes.tags, manualTags: schema.notes.manualTags }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), hasTagSql(f)))
  for (const n of rows) {
    await db.update(schema.notes).set({ tags: normalizeTags(n.tags.map((x) => (x === f ? t : x))), manualTags: normalizeTags((n.manualTags ?? []).map((x) => (x === f ? t : x))) }).where(eq(schema.notes.id, n.id))
  }
  return rows.length
}

/** Remove a tag from every note in the given contexts. Returns notes touched. */
export async function deleteTag(contextIds: string[], tag: string): Promise<number> {
  const db = await getDb()
  const [t] = normalizeTags([tag])
  if (!t || !contextIds.length) return 0
  const rows = await db.select({ id: schema.notes.id, tags: schema.notes.tags, manualTags: schema.notes.manualTags }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), hasTagSql(t)))
  for (const n of rows) {
    await db.update(schema.notes).set({ tags: n.tags.filter((x) => x !== t), manualTags: (n.manualTags ?? []).filter((x) => x !== t) }).where(eq(schema.notes.id, n.id))
  }
  return rows.length
}
