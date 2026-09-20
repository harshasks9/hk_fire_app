import { guardOwned } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { and, eq } from 'drizzle-orm'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('decision', id)
  if (denied) return denied
  const b = (await req.json()) as { status?: 'active' | 'proposed' | 'superseded' | 'revisited' | 'reversed'; title?: string; statement?: string; context?: string; reasoning?: string; decidedAt?: string; alternatives?: string[] }
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.status) set.status = b.status
  if (b.title !== undefined && b.title.trim()) set.title = b.title.trim().slice(0, 200)
  if (b.statement !== undefined && b.statement.trim()) set.statement = b.statement.trim()
  if (b.context !== undefined) set.context = b.context
  if (b.reasoning !== undefined) set.reasoning = b.reasoning
  if (b.decidedAt && !Number.isNaN(Date.parse(b.decidedAt))) set.decidedAt = new Date(b.decidedAt)
  if (Array.isArray(b.alternatives)) set.alternatives = b.alternatives.map(String).filter(Boolean)
  await db.update(schema.decisions).set(set).where(eq(schema.decisions.id, id))
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('decision', id)
  if (denied) return denied
  const db = await getDb()
  await db.delete(schema.decisionRevisions).where(eq(schema.decisionRevisions.decisionId, id))
  await db.delete(schema.entityRelations).where(and(eq(schema.entityRelations.toType, 'decision'), eq(schema.entityRelations.toId, id)))
  await db.delete(schema.decisions).where(eq(schema.decisions.id, id))
  return new NextResponse(null, { status: 204 })
}
