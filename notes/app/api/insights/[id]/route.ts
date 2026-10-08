import { guardOwned } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function PATCH(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('insight', id)
  if (denied) return denied
  const db = await getDb()
  await db.update(schema.insights).set({ dismissedAt: new Date() }).where(eq(schema.insights.id, id))
  return NextResponse.json({ ok: true })
}
