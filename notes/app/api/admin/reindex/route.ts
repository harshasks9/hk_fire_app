import { NextResponse } from 'next/server'
import { reprocessAll } from '@/lib/pipeline'
export const maxDuration = 300
export async function POST() {
  const n = await reprocessAll()
  return NextResponse.json({ ok: true, notes: n })
}
