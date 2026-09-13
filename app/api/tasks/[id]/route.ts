import { guardOwned } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('task', id)
  if (denied) return denied
  const b = (await req.json()) as { status?: 'open' | 'waiting' | 'delegated' | 'done' | 'dropped'; title?: string; dueAt?: string | null; priority?: 'low' | 'normal' | 'high' | 'urgent'; owner?: string; entityId?: string | null }
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.status) { set.status = b.status; set.completedAt = b.status === 'done' ? new Date() : null }
  if (b.title !== undefined) set.title = b.title
  if (b.dueAt !== undefined) set.dueAt = b.dueAt ? new Date(b.dueAt) : null
  if (b.priority) set.priority = b.priority
  if (b.owner) set.owner = b.owner
  if (b.entityId !== undefined) set.entityId = b.entityId || null
  await db.update(schema.tasks).set(set).where(eq(schema.tasks.id, id))
  return NextResponse.json({ ok: true })
}
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('task', id)
  if (denied) return denied
  const db = await getDb()
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id))
  return new NextResponse(null, { status: 204 })
}
