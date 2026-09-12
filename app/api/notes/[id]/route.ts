import { NextRequest, NextResponse } from 'next/server'
import { getNote } from '@/lib/queries'
import { softDeleteNote, updateNote } from '@/lib/notes'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const d = await getNote(id)
  if (!d) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(d)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = (await req.json()) as Parameters<typeof updateNote>[1] & { process?: boolean }
  const { process, ...patch } = body
  await updateNote(id, patch, { process })
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await softDeleteNote(id)
  return new NextResponse(null, { status: 204 })
}
