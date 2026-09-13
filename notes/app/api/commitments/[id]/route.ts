import { guardOwned } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('commitment', id)
  if (denied) return denied
  const b = (await req.json()) as { status?: 'open' | 'resolved' | 'dismissed'; priority?: 'low' | 'normal' | 'high' | 'urgent'; text?: string; kind?: 'promised' | 'waiting' | 'follow_up' | 'question'; byWhom?: string; dueAt?: string | null; dueHint?: string | null }
  const db = await getDb()
  const set: Record<string, unknown> = {}
  if (b.status) { set.status = b.status; set.resolvedAt = b.status === 'open' ? null : new Date() }
  if (b.priority) set.priority = b.priority
  if (b.text !== undefined && b.text.trim()) set.text = b.text.trim().slice(0, 500)
  if (b.kind && ['promised', 'waiting', 'follow_up', 'question'].includes(b.kind)) set.kind = b.kind
  if (b.byWhom !== undefined && b.byWhom.trim()) set.byWhom = b.byWhom.trim()
  if (b.dueAt !== undefined) set.dueAt = b.dueAt && !Number.isNaN(Date.parse(b.dueAt)) ? new Date(b.dueAt) : null
  if (b.dueHint !== undefined) set.dueHint = b.dueHint
  if (Object.keys(set).length) await db.update(schema.commitments).set(set).where(eq(schema.commitments.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('commitment', id)
  if (denied) return denied
  const db = await getDb()
  await db.delete(schema.commitments).where(eq(schema.commitments.id, id))
  return new NextResponse(null, { status: 204 })
}
