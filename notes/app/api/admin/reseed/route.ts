import { NextResponse } from 'next/server'
import { runSeed } from '@/lib/seed/run'
export const maxDuration = 300
export async function POST() {
  const r = await runSeed({ force: true })
  return NextResponse.json(r)
}
