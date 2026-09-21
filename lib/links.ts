/*
  Note-to-note links. A [[link]] is an inline `noteLink` node in the document
  ({ id, label }); the `note_links` table mirrors the document on every save so
  backlinks ("Linked from") are one indexed query. Unresolved links (id null,
  typed as [[Title]] or imported) are resolved by title inside the notebook.
*/
import { and, desc, eq, inArray, isNull, ne, or, sql } from 'drizzle-orm'
import { getDb, schema } from './db'
import { noteLinkNode, type PMNode } from './markdown'
import { uid } from './util'

export interface LinkRef { id: string | null; label: string }

/** Every noteLink node in a document, in order. */
export function extractNoteLinks(doc: unknown): LinkRef[] {
  const out: LinkRef[] = []
  const walk = (n: PMNode | undefined) => {
    if (!n) return
    if (n.type === 'noteLink') out.push({ id: typeof n.attrs?.id === 'string' && n.attrs.id ? n.attrs.id : null, label: String(n.attrs?.label ?? '').trim() })
    for (const c of n.content ?? []) walk(c)
  }
  walk(doc as PMNode)
  return out
}

/** A copy of the document with unresolved links given the id the resolver finds for their label. Untouched when nothing changes. */
export function resolveLinksInDoc(doc: unknown, resolve: (label: string) => string | null): { doc: unknown; changed: boolean } {
  let changed = false
  const walk = (n: PMNode): PMNode => {
    if (n.type === 'noteLink' && !(typeof n.attrs?.id === 'string' && n.attrs.id)) {
      const id = resolve(String(n.attrs?.label ?? ''))
      if (id) { changed = true; return { ...n, attrs: { ...n.attrs, id } } }
      return n
    }
    if (!n.content) return n
    const content = n.content.map(walk)
    return content.some((c, i) => c !== n.content![i]) ? { ...n, content } : n
  }
  const out = walk(doc as PMNode)
  return { doc: changed ? out : doc, changed }
}

/** The plain text of the blocks that contain a link to `targetId` (for the backlink list). */
export function linkExcerpts(doc: unknown, targetId: string, max = 2): string[] {
  const out: string[] = []
  const textOf = (n: PMNode): string => (n.type === 'text' ? n.text ?? '' : n.type === 'noteLink' || n.type === 'mention' ? String(n.attrs?.label ?? '') : (n.content ?? []).map(textOf).join(n.type === 'paragraph' || n.type === 'heading' ? '' : ' '))
  const hasLink = (n: PMNode): boolean => (n.type === 'noteLink' && n.attrs?.id === targetId) || (n.content ?? []).some(hasLink)
  const walk = (n: PMNode) => {
    if (out.length >= max) return
    if ((n.type === 'paragraph' || n.type === 'heading') && hasLink(n)) { out.push(textOf(n).replace(/\s+/g, ' ').trim().slice(0, 220)); return }
    for (const c of n.content ?? []) walk(c)
  }
  walk(doc as PMNode)
  return out
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Offsets of whole-word, case-insensitive occurrences of `title` in `text`. */
export function findMentionOffsets(text: string, title: string, limit = 5): { start: number; end: number }[] {
  const t = title.trim()
  if (t.length < 3) return []
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRe(t)}(?![\\p{L}\\p{N}])`, 'giu')
  const out: { start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) && out.length < limit) out.push({ start: m.index, end: m.index + m[0].length })
  return out
}

/** A short window of text around the first mention, for the "Unlinked mentions" list. */
export function mentionExcerpt(text: string, title: string, radius = 90): string {
  const hit = findMentionOffsets(text, title, 1)[0]
  if (!hit) return text.slice(0, radius * 2).replace(/\s+/g, ' ').trim()
  const start = Math.max(0, hit.start - radius)
  const end = Math.min(text.length, hit.end + radius)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`
}

/**
 * Replace the first plain-text occurrence of `title` in the document with a link to `target`.
 * Text that already sits inside a link mark, a code mark or a code block is left alone.
 */
export function linkMentionInDoc(doc: unknown, title: string, target: { id: string }): { doc: unknown; replaced: boolean } {
  let replaced = false
  const walk = (n: PMNode): PMNode => {
    if (replaced) return n
    if (n.type === 'codeBlock') return n
    if (!n.content) return n
    const content: PMNode[] = []
    let touched = false
    for (const c of n.content) {
      if (replaced || c.type !== 'text' || !c.text || (c.marks ?? []).some((m) => m.type === 'link' || m.type === 'code')) {
        const w = replaced ? c : walk(c)
        if (w !== c) touched = true
        content.push(w)
        continue
      }
      const hit = findMentionOffsets(c.text, title, 1)[0]
      if (!hit) { content.push(c); continue }
      const before = c.text.slice(0, hit.start)
      const after = c.text.slice(hit.end)
      if (before) content.push({ ...c, text: before })
      content.push(noteLinkNode(c.text.slice(hit.start, hit.end), target.id))
      if (after) content.push({ ...c, text: after })
      replaced = true
      touched = true
    }
    return touched ? { ...n, content } : n
  }
  const out = walk(doc as PMNode)
  return { doc: replaced ? out : doc, replaced }
}

/* ------------------------------------------------------------------ db */

/** Live notes of the given contexts whose title matches exactly (case-insensitive). */
async function notesByTitle(contextIds: string[], titles: string[]) {
  if (!contextIds.length || !titles.length) return []
  const db = await getDb()
  const lowered = [...new Set(titles.map((t) => t.trim().toLowerCase()).filter(Boolean))]
  if (!lowered.length) return []
  return db.select({ id: schema.notes.id, title: schema.notes.title, updatedAt: schema.notes.updatedAt }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), inArray(sql`lower(${schema.notes.title})`, lowered))).orderBy(desc(schema.notes.updatedAt))
}

/** The notebook-wide list of context ids a note belongs with. */
export async function notebookContextIdsOf(contextId: string): Promise<string[]> {
  const db = await getDb()
  const ctx = (await db.select({ notebookId: schema.contexts.notebookId }).from(schema.contexts).where(eq(schema.contexts.id, contextId)))[0]
  if (!ctx) return [contextId]
  return (await db.select({ id: schema.contexts.id }).from(schema.contexts).where(eq(schema.contexts.notebookId, ctx.notebookId))).map((r) => r.id)
}

/**
 * Resolve unresolved links in a document by title and mirror every link into `note_links`.
 * Returns the (possibly updated) document so the caller stores resolved ids.
 */
export async function syncNoteLinks(noteId: string, contextId: string, doc: unknown): Promise<{ doc: unknown; changed: boolean }> {
  const db = await getDb()
  const refs = extractNoteLinks(doc)
  if (!refs.length) {
    await db.delete(schema.noteLinks).where(eq(schema.noteLinks.fromNoteId, noteId))
    return { doc, changed: false }
  }
  const contextIds = await notebookContextIdsOf(contextId)
  const unresolved = refs.filter((r) => !r.id).map((r) => r.label)
  let resolved = doc
  let changed = false
  if (unresolved.length) {
    const found = await notesByTitle(contextIds, unresolved)
    const byTitle = new Map<string, string>()
    for (const n of found) if (!byTitle.has(n.title.toLowerCase()) && n.id !== noteId) byTitle.set(n.title.toLowerCase(), n.id)
    const r = resolveLinksInDoc(doc, (label) => byTitle.get(label.trim().toLowerCase()) ?? null)
    resolved = r.doc
    changed = r.changed
  }
  const finalRefs = extractNoteLinks(resolved).filter((r): r is { id: string; label: string } => Boolean(r.id) && r.id !== noteId)
  // Only targets that exist in this notebook count; a pasted id from elsewhere is ignored.
  const targetIds = [...new Set(finalRefs.map((r) => r.id))]
  const valid = targetIds.length ? new Set((await db.select({ id: schema.notes.id }).from(schema.notes).where(and(inArray(schema.notes.id, targetIds), inArray(schema.notes.contextId, contextIds)))).map((r) => r.id)) : new Set<string>()
  const existing = await db.select().from(schema.noteLinks).where(eq(schema.noteLinks.fromNoteId, noteId))
  const wanted = new Map<string, string>()
  for (const r of finalRefs) if (valid.has(r.id) && !wanted.has(r.id)) wanted.set(r.id, r.label)
  const stale = existing.filter((e) => !wanted.has(e.toNoteId)).map((e) => e.id)
  if (stale.length) await db.delete(schema.noteLinks).where(inArray(schema.noteLinks.id, stale))
  for (const [toNoteId, label] of wanted) {
    const ex = existing.find((e) => e.toNoteId === toNoteId)
    if (ex) { if (ex.label !== label) await db.update(schema.noteLinks).set({ label }).where(eq(schema.noteLinks.id, ex.id)) }
    else await db.insert(schema.noteLinks).values({ id: uid('lnk'), fromNoteId: noteId, toNoteId, label }).onConflictDoNothing()
  }
  return { doc: resolved, changed }
}

export interface LinkedNote { id: string; title: string; kind: string; updatedAt: Date; excerpt: string }
export interface NoteLinks { outgoing: { id: string; title: string; kind: string }[]; backlinks: LinkedNote[]; unlinked: LinkedNote[] }

/** Outgoing links, backlinks and unlinked mentions for a note. */
export async function noteLinksFor(note: { id: string; title: string; contextId: string }): Promise<NoteLinks> {
  const db = await getDb()
  const contextIds = await notebookContextIdsOf(note.contextId)
  const [out, back] = await Promise.all([
    db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind }).from(schema.noteLinks).innerJoin(schema.notes, eq(schema.notes.id, schema.noteLinks.toNoteId)).where(and(eq(schema.noteLinks.fromNoteId, note.id), isNull(schema.notes.deletedAt))).orderBy(desc(schema.notes.updatedAt)),
    db.select({ n: schema.notes }).from(schema.noteLinks).innerJoin(schema.notes, eq(schema.notes.id, schema.noteLinks.fromNoteId)).where(and(eq(schema.noteLinks.toNoteId, note.id), isNull(schema.notes.deletedAt), inArray(schema.notes.contextId, contextIds))).orderBy(desc(schema.notes.updatedAt)).limit(50),
  ])
  const backlinks: LinkedNote[] = back.map(({ n }) => ({ id: n.id, title: n.title, kind: n.kind, updatedAt: n.updatedAt, excerpt: linkExcerpts(n.contentJson, note.id, 1)[0] ?? '' }))
  let unlinked: LinkedNote[] = []
  const title = note.title.trim()
  if (title.length >= 3 && contextIds.length) {
    const exclude = [note.id, ...backlinks.map((b) => b.id)]
    const pattern = `%${title.replace(/[%_\\]/g, (c) => `\\${c}`)}%`
    const rows = await db.select({ n: schema.notes }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), sql`${schema.notes.id} not in ${exclude}`, or(sql`${schema.notes.contentText} ilike ${pattern}`, sql`${schema.notes.title} ilike ${pattern}`), ne(schema.notes.title, title))).orderBy(desc(schema.notes.updatedAt)).limit(40)
    unlinked = rows.map(({ n }) => n).filter((n) => findMentionOffsets(`${n.title}\n${n.contentText}`, title, 1).length > 0).slice(0, 12).map((n) => ({ id: n.id, title: n.title, kind: n.kind, updatedAt: n.updatedAt, excerpt: mentionExcerpt(n.contentText, title) }))
  }
  return { outgoing: out.map((o) => ({ id: o.id, title: o.title, kind: o.kind })), backlinks, unlinked }
}

/** Search the notebook's notes by title for the [[ autocomplete. */
export async function searchNoteTitles(contextIds: string[], q: string, limit = 8, exclude?: string) {
  if (!contextIds.length) return []
  const db = await getDb()
  const query = q.trim()
  const pattern = `%${query.replace(/[%_\\]/g, (c) => `\\${c}`)}%`
  const rows = await db.select({ id: schema.notes.id, title: schema.notes.title, kind: schema.notes.kind, updatedAt: schema.notes.updatedAt, contextId: schema.notes.contextId }).from(schema.notes).where(and(inArray(schema.notes.contextId, contextIds), isNull(schema.notes.deletedAt), ne(schema.notes.title, ''), query ? sql`${schema.notes.title} ilike ${pattern}` : sql`true`, exclude ? ne(schema.notes.id, exclude) : sql`true`)).orderBy(desc(schema.notes.updatedAt)).limit(query ? 40 : limit)
  const ql = query.toLowerCase()
  const rank = (t: string) => (t.toLowerCase() === ql ? 0 : t.toLowerCase().startsWith(ql) ? 1 : 2)
  return rows.sort((a, b) => rank(a.title) - rank(b.title) || b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit)
}

/** Find a note by exact title in the notebook (case-insensitive). */
export async function findNoteByTitle(contextIds: string[], title: string): Promise<{ id: string; title: string } | null> {
  const rows = await notesByTitle(contextIds, [title])
  return rows[0] ?? null
}

/** Turn an unlinked mention into a link: edit the mentioning note's document in place. */
export async function linkMention(fromNoteId: string, target: { id: string; title: string }): Promise<{ replaced: boolean }> {
  const db = await getDb()
  const from = (await db.select().from(schema.notes).where(eq(schema.notes.id, fromNoteId)))[0]
  if (!from || !from.contentJson) return { replaced: false }
  const r = linkMentionInDoc(from.contentJson, target.title, target)
  if (!r.replaced) return { replaced: false }
  const { updateNote } = await import('./notes')
  await updateNote(fromNoteId, { contentJson: r.doc })
  return { replaced: true }
}

/** Forget every link from or to these notes (purge, wipe, context deletion). */
export async function deleteLinksOf(noteIds: string[]) {
  if (!noteIds.length) return
  const db = await getDb()
  await db.delete(schema.noteLinks).where(or(inArray(schema.noteLinks.fromNoteId, noteIds), inArray(schema.noteLinks.toNoteId, noteIds)))
}
