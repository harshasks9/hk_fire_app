import { NextResponse } from 'next/server'
import { dbMode } from '@/lib/db'
import { aiStatus } from '@/lib/ai/provider'
import { probeGemini } from '@/lib/ai/gemini-probe'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET(req: Request) {
  const url = new URL(req.url)
  const base = { ok: true, db: dbMode(), ai: aiStatus().provider, time: new Date().toISOString() }
  if (url.searchParams.get('probe') === 'ai') {
    // Diagnostic: model discovery + a one-token generation and embedding call.
    // Reports status codes and Google's error text only; the key is never returned.
    return NextResponse.json({ ...base, gemini: await probeGemini() })
  }
  return NextResponse.json(base)
}
