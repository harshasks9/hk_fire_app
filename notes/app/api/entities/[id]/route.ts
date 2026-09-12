import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = (await req.json()) as { pinned?: boolean; name?: string; attributes?: Record<string, string>; summary?: string }
  const db = await getDb()
  const set: Record<string, unknown> = { updatedAt: new Date() }
  if (b.pinned !== undefined) set.pinned = b.pinned
  if (b.name) set.name = b.name
  if (b.attributes) set.attributes = b.attributes
  if (b.summary !== undefined) { set.summary = b.summary; set.summaryUpdatedAt = new Date() }
  await db.update(schema.entities).set(set).where(eq(schema.entities.id, id))
  return NextResponse.json({ ok: true })
}
