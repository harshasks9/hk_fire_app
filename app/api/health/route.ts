import { NextResponse } from 'next/server'
import { dbMode } from '@/lib/db'
import { aiStatus } from '@/lib/ai/provider'
export const dynamic = 'force-dynamic'
export async function GET() {
  return NextResponse.json({ ok: true, db: dbMode(), ai: aiStatus().provider, time: new Date().toISOString() })
}
