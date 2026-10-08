import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { guardOwned } from '@/lib/api'
import { getDb, schema } from '@/lib/db'
import { linkMention, noteLinksFor } from '@/lib/links'
export const dynamic = 'force-dynamic'

/** Outgoing links, backlinks and unlinked mentions of a note. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const db = await getDb()
  const n = (await db.select({ id: schema.notes.id, title: schema.notes.title, contextId: schema.notes.contextId }).from(schema.notes).where(eq(schema.notes.id, id)))[0]
  if (!n) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(await noteLinksFor(n))
}

/** Turn an unlinked mention in another note into a [[link]] to this one: `{ fromNoteId }`. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const b = (await req.json().catch(() => ({}))) as { fromNoteId?: string }
  if (!b.fromNoteId) return NextResponse.json({ error: 'fromNoteId is required' }, { status: 400 })
  const deniedFrom = await guardOwned('note', b.fromNoteId)
  if (deniedFrom) return deniedFrom
  const db = await getDb()
  const target = (await db.select({ id: schema.notes.id, title: schema.notes.title }).from(schema.notes).where(eq(schema.notes.id, id)))[0]
  if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const r = await linkMention(b.fromNoteId, target)
  return NextResponse.json({ ok: true, replaced: r.replaced })
}
