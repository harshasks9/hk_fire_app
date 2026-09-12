import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { requireSession } from '@/lib/session'
import { createShareLink, listShareLinks } from '@/lib/share'
export const dynamic = 'force-dynamic'

function origin(req: NextRequest) {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  return host ? `${proto}://${host}` : new URL(req.url).origin
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const s = await requireSession()
  return NextResponse.json({ links: await listShareLinks(id, origin(req)), allowed: s.notebook.settings?.allowShareLinks !== false })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const s = await requireSession()
  if (s.notebook.settings?.allowShareLinks === false) return NextResponse.json({ error: 'Public sharing is turned off for this notebook' }, { status: 403 })
  const b = (await req.json().catch(() => ({}))) as { expiresDays?: number | null }
  const days = b.expiresDays === null ? null : [7, 30].includes(Number(b.expiresDays)) ? Number(b.expiresDays) : 7
  const link = await createShareLink({ noteId: id, notebookId: s.notebookId, userId: s.userId, expiresDays: days, origin: origin(req) })
  return NextResponse.json({ ok: true, link }, { status: 201 })
}
