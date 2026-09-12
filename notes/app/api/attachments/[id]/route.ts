import { guardOwned } from '@/lib/api'
import { NextRequest, NextResponse } from 'next/server'
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('attachment', id)
  if (denied) return denied
  const db = await getDb()
  const a = (await db.select().from(schema.attachments).where(eq(schema.attachments.id, id)))[0]
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (a.storageUrl) return NextResponse.redirect(a.storageUrl)
  if (!a.data) return NextResponse.json({ error: 'no data' }, { status: 404 })
  return new NextResponse(Buffer.from(a.data, 'base64'), { headers: { 'Content-Type': a.mime, 'Content-Disposition': `inline; filename="${a.name}"`, 'Cache-Control': 'private, max-age=3600' } })
}
