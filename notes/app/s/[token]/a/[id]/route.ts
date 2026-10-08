import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { resolveShareToken } from '@/lib/share'
import { ensureReady } from '@/lib/bootstrap'
export const dynamic = 'force-dynamic'

/** An attachment of a publicly shared note or task, reachable only through the share token. */
export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string; id: string }> }) {
  await ensureReady()
  const { token, id } = await params
  const r = await resolveShareToken(token, { countView: false })
  if (!r || !r.attachments.some((a) => a.id === id)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const db = await getDb()
  const a = (await db.select().from(schema.attachments).where(eq(schema.attachments.id, id)))[0]
  if (!a) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (a.storageUrl) return NextResponse.redirect(a.storageUrl)
  if (!a.data) return NextResponse.json({ error: 'no data' }, { status: 404 })
  return new NextResponse(Buffer.from(a.data, 'base64'), { headers: { 'Content-Type': a.mime, 'Content-Disposition': `inline; filename="${a.name.replace(/"/g, '')}"`, 'Cache-Control': 'private, max-age=3600' } })
}
