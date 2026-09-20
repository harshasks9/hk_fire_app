import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { processNote, deleteDerived } from '@/lib/pipeline'
export const dynamic = 'force-dynamic'
export const maxDuration = 120
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  await deleteDerived(id)
  const r = await processNote(id)
  return NextResponse.json(r ?? { error: 'not found' }, { status: r ? 200 : 404 })
}
