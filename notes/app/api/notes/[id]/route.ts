import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { getNote } from '@/lib/queries'
import { softDeleteNote, updateNote } from '@/lib/notes'
import { purgeNote } from '@/lib/trash'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const d = await getNote(id)
  if (!d) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(d)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const body = (await req.json()) as Parameters<typeof updateNote>[1] & { process?: boolean }
  const { process, ...patch } = body
  await updateNote(id, patch, { process })
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() })
}

/** Move to Trash; `?purge=1` deletes forever (with everything derived from the note). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  if (req.nextUrl.searchParams.get('purge') === '1') await purgeNote(id)
  else await softDeleteNote(id)
  return new NextResponse(null, { status: 204 })
}
