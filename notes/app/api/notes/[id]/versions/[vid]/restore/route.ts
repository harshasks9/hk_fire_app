import { NextRequest, NextResponse } from 'next/server'
import { guardOwned } from '@/lib/api'
import { restoreVersion } from '@/lib/versions'
export const dynamic = 'force-dynamic'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string; vid: string }> }) {
  const { id, vid } = await params
  const denied = await guardOwned('note', id)
  if (denied) return denied
  const ok = await restoreVersion(id, vid)
  if (!ok) return NextResponse.json({ error: 'Version not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
