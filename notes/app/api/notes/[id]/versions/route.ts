import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { listVersions, snapshotNote } from '@/lib/versions'
export const dynamic = 'force-dynamic'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  return NextResponse.json({ versions: await listVersions(id) })
}

/** Manual snapshot ("Save a version"). */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const created = await snapshotNote(id, 'manual')
  return NextResponse.json({ ok: true, created })
}
