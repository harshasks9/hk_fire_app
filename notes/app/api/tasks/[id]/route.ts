import { guardOwned, requestOrigin } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { deleteTaskExtras, getTaskDetail, setTaskDetails } from '@/lib/tasks'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('task', id)
  if (denied) return denied
  const d = await getTaskDetail(id, requestOrigin(req))
  if (!d) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(d)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('task', id)
  if (denied) return denied
  const b = (await req.json()) as { status?: 'open' | 'waiting' | 'delegated' | 'done' | 'dropped'; title?: string; dueAt?: string | null; priority?: 'low' | 'normal' | 'high' | 'urgent'; owner?: string; entityId?: string | null; details?: unknown | null }
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.status) { set.status = b.status; set.completedAt = b.status === 'done' ? new Date() : null }
  if (b.title !== undefined && b.title.trim()) set.title = b.title.trim()
  if (b.dueAt !== undefined) set.dueAt = b.dueAt ? new Date(b.dueAt) : null
  if (b.priority) set.priority = b.priority
  if (b.owner) set.owner = b.owner
  if (b.entityId !== undefined) set.entityId = b.entityId || null
  await db.update(schema.tasks).set(set).where(eq(schema.tasks.id, id))
  if (b.details !== undefined) await setTaskDetails(id, b.details)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('task', id)
  if (denied) return denied
  const db = await getDb()
  await deleteTaskExtras([id])
  await db.delete(schema.tasks).where(eq(schema.tasks.id, id))
  return new NextResponse(null, { status: 204 })
}
