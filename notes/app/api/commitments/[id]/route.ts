import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = (await req.json()) as { status?: 'open' | 'resolved' | 'dismissed'; priority?: 'low' | 'normal' | 'high' | 'urgent' }
  const db = await getDb()
  const set: Record<string, unknown> = {}
  if (b.status) { set.status = b.status; set.resolvedAt = b.status === 'open' ? null : new Date() }
  if (b.priority) set.priority = b.priority
  await db.update(schema.commitments).set(set).where(eq(schema.commitments.id, id))
  return NextResponse.json({ ok: true })
}
