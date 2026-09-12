import { NextRequest, NextResponse } from 'next/server'
import { meetingPrep } from '@/lib/prep'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await meetingPrep(id)
  return p ? NextResponse.json(p) : NextResponse.json({ error: 'not found' }, { status: 404 })
}
