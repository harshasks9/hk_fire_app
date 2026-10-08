/*
  Import: Markdown / plain text files (one note each) and the app's own JSON
  export. Titles and dates come from front matter, the first heading or the
  filename; duplicates (same title, same day, same text) are skipped.
*/
import { and, eq, inArray } from 'drizzle-orm'
import { getDb, schema } from './db'
import { createNote } from './notes'
import { docToText, markdownToDoc } from './markdown'
import { sha256 } from './crypto'
import { extractNoteLinks, syncNoteLinks } from './links'

export interface ImportFile { name: string; text: string; lastModified?: number }
export interface ImportResult { created: { id: string; title: string }[]; skipped: { name: string; reason: string }[] }

export interface ParsedNote { title: string; markdown: string; createdAt?: Date; contextSlug?: string; kind?: 'note' | 'meeting' | 'document' }

/** Strips one pair of matching quotes and unescapes \" and \\ inside a double-quoted value (what our exporter writes). */
function unquote(v: string): string {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1).replace(/\\(["\\])/g, '$1')
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1)
  return v.replace(/^["']|["']$/g, '')
}

export function parseFrontMatter(text: string): { data: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(text)
  if (!m) return { data: {}, body: text }
  const data: Record<string, string> = {}
  for (const line of m[1]!.split(/\r?\n/)) {
    const kv = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/.exec(line)
    if (kv) data[kv[1]!.toLowerCase()] = unquote(kv[2]!.trim())
  }
  return { data, body: text.slice(m[0].length) }
}

function parseDate(s: string | undefined, fallback?: number): Date | undefined {
  if (s) {
    const t = Date.parse(s)
    if (!Number.isNaN(t)) return new Date(t)
  }
  return fallback ? new Date(fallback) : undefined
}

export function parseMarkdownFile(file: ImportFile): ParsedNote {
  const { data, body } = parseFrontMatter(file.text.replace(/^﻿/, ''))
  let markdown = body.trim()
  let title = data.title ?? ''
  const heading = /^#\s+(.+?)\s*$/m.exec(markdown)
  if (!title && heading && markdown.trimStart().startsWith('#')) {
    title = heading[1]!.trim()
    markdown = markdown.replace(heading[0], '').trim()
  }
  if (!title) title = file.name.replace(/\.(md|markdown|txt)$/i, '').replace(/[-_]+/g, ' ').trim()
  const createdAt = parseDate(data.date ?? data.created ?? data.created_at ?? data.createdat, file.lastModified)
  return { title, markdown, createdAt, contextSlug: data.context, kind: /meeting/i.test(data.type ?? data.kind ?? '') ? 'meeting' : 'note' }
}

/** Notes from the app's own export format ({ contexts, notes: [{ title, markdown, createdAt, contextId }] }). */
export function parseExportJson(text: string): ParsedNote[] {
  const j = JSON.parse(text) as { contexts?: { id: string; slug: string }[]; notes?: { title?: string; markdown?: string; createdAt?: string; contextId?: string; kind?: string }[] }
  const slugById = new Map((j.contexts ?? []).map((c) => [c.id, c.slug]))
  return (j.notes ?? []).map((n) => ({ title: n.title ?? '', markdown: n.markdown ?? '', createdAt: parseDate(n.createdAt), contextSlug: n.contextId ? slugById.get(n.contextId) : undefined, kind: n.kind === 'meeting' ? 'meeting' : 'note' }))
}

export function parseImportFile(file: ImportFile): ParsedNote[] {
  if (/\.json$/i.test(file.name)) {
    try {
      return parseExportJson(file.text)
    } catch {
      return []
    }
  }
  return [parseMarkdownFile(file)]
}

function fingerprint(title: string, text: string, day: string) {
  return sha256(`${title.trim().toLowerCase()}|${day}|${text.trim()}`)
}

export async function importNotes(input: { files: ImportFile[]; contexts: { id: string; slug: string }[]; defaultContextId: string }): Promise<ImportResult> {
  const db = await getDb()
  const result: ImportResult = { created: [], skipped: [] }
  const pending: { id: string; contextId: string }[] = []
  const ctxIds = input.contexts.map((c) => c.id)
  const existing = ctxIds.length ? await db.select({ title: schema.notes.title, contentText: schema.notes.contentText, createdAt: schema.notes.createdAt }).from(schema.notes).where(and(inArray(schema.notes.contextId, ctxIds))) : []
  const seen = new Set(existing.map((n) => fingerprint(n.title, n.contentText, n.createdAt.toISOString().slice(0, 10))))
  for (const f of input.files) {
    const parsed = parseImportFile(f)
    if (parsed.length === 0) { result.skipped.push({ name: f.name, reason: 'not a supported file' }); continue }
    for (const n of parsed) {
      if (!n.markdown.trim() && !n.title.trim()) { result.skipped.push({ name: f.name, reason: 'empty' }); continue }
      const doc = markdownToDoc(n.markdown)
      const text = docToText(doc)
      const createdAt = n.createdAt ?? new Date()
      const fp = fingerprint(n.title, text, createdAt.toISOString().slice(0, 10))
      if (seen.has(fp)) { result.skipped.push({ name: n.title || f.name, reason: 'already imported' }); continue }
      seen.add(fp)
      const contextId = (n.contextSlug && input.contexts.find((c) => c.slug === n.contextSlug)?.id) || input.defaultContextId
      const id = await createNote({ contextId, title: n.title, contentJson: doc, kind: n.kind ?? 'note', source: 'import', status: 'inbox', createdAt })
      result.created.push({ id, title: n.title })
      if (extractNoteLinks(doc).some((l) => !l.id)) pending.push({ id, contextId })
    }
  }
  // Second pass: [[links]] to notes that arrived later in the same import resolve now.
  for (const p of pending) {
    const row = (await db.select({ contentJson: schema.notes.contentJson }).from(schema.notes).where(eq(schema.notes.id, p.id)))[0]
    if (!row?.contentJson) continue
    const r = await syncNoteLinks(p.id, p.contextId, row.contentJson)
    if (r.changed) await db.update(schema.notes).set({ contentJson: r.doc }).where(eq(schema.notes.id, p.id))
  }
  return result
}

export { eq }
