import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const b = (await req.json()) as { status?: 'active' | 'proposed' | 'superseded' | 'revisited' | 'reversed'; title?: string; context?: string; reasoning?: string }
  const db = await getDb()
  await db.update(schema.decisions).set({ ...b, updatedAt: new Date() }).where(eq(schema.decisions.id, id))
  return NextResponse.json({ ok: true })
}
