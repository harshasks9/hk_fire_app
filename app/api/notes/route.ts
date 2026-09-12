import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext, resolveContext } from '@/lib/context'
import { createNote, scheduleProcessing } from '@/lib/notes'
import { listNotes } from '@/lib/queries'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getActiveContext()
  const q = req.nextUrl.searchParams.get('q') ?? undefined
  return NextResponse.json(await listNotes(ctx.id, { q, limit: 50 }))
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { title?: string; markdown?: string; kind?: 'note' | 'meeting' | 'voice' | 'capture' | 'link' | 'document' | 'screenshot' | 'email'; researchProjectId?: string; process?: boolean; contextId?: string; createdAt?: string; source?: string }
  const ctx = await resolveContext(body.contextId)
  const createdAt = body.createdAt && !Number.isNaN(Date.parse(body.createdAt)) ? new Date(body.createdAt) : undefined
  const id = await createNote({ contextId: ctx.id, title: body.title, markdown: body.markdown, kind: body.kind, researchProjectId: body.researchProjectId, createdAt, source: body.source === 'offline' ? 'offline' : undefined })
  if (body.process || body.markdown) scheduleProcessing(id)
  return NextResponse.json({ id }, { status: 201 })
}
