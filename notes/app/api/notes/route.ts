import { NextRequest, NextResponse } from 'next/server'
import { getActiveContext } from '@/lib/context'
import { createNote, scheduleProcessing } from '@/lib/notes'
import { listNotes } from '@/lib/queries'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const ctx = await getActiveContext()
  const q = req.nextUrl.searchParams.get('q') ?? undefined
  return NextResponse.json(await listNotes(ctx.id, { q, limit: 50 }))
}

export async function POST(req: NextRequest) {
  const ctx = await getActiveContext()
  const body = (await req.json().catch(() => ({}))) as { title?: string; markdown?: string; kind?: 'note' | 'meeting' | 'voice' | 'capture' | 'link' | 'document' | 'screenshot' | 'email'; researchProjectId?: string; process?: boolean }
  const id = await createNote({ contextId: ctx.id, title: body.title, markdown: body.markdown, kind: body.kind, researchProjectId: body.researchProjectId })
  if (body.process || body.markdown) scheduleProcessing(id)
  return NextResponse.json({ id }, { status: 201 })
}
