import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { restoreNote } from '@/lib/trash'
export const dynamic = 'force-dynamic'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  await restoreNote(id)
  return NextResponse.json({ ok: true })
}
