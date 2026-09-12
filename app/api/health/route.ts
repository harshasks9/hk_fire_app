import { NextResponse } from 'next/server'
import { dbMode, getDb } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { aiStatus } from '@/lib/ai/provider'
import { probeGemini } from '@/lib/ai/gemini-probe'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET(req: Request) {
  const url = new URL(req.url)
  const base = { ok: true, db: dbMode(), ai: aiStatus().provider, time: new Date().toISOString() }
  if (url.searchParams.get('probe') === 'db') {
    // Diagnostic: connection + three round trips, in milliseconds.
    const t0 = Date.now()
    const db = await getDb()
    const connectMs = Date.now() - t0
    const rt: number[] = []
    for (let i = 0; i < 3; i++) { const t = Date.now(); await db.execute(sql`select 1`); rt.push(Date.now() - t) }
    return NextResponse.json({ ...base, db: { mode: dbMode(), connectMs, roundTripsMs: rt, region: process.env.VERCEL_REGION ?? null } })
  }
  if (url.searchParams.get('probe') === 'ai') {
    // Diagnostic: model discovery + a one-token generation and embedding call.
    // Reports status codes and Google's error text only; the key is never returned.
    return NextResponse.json({ ...base, gemini: await probeGemini() })
  }
  return NextResponse.json(base)
}
