import { NextResponse } from 'next/server'
import { reprocessBatch } from '@/lib/pipeline'
export const maxDuration = 60

/**
  Re-analyze notes in resumable slices. Body: { offset?: number }. Responds with
  { processed, byModel, byLocal, total, next } where `next` is the offset to send
  on the following call, or null when done. Each call stays inside the function
  time limit; the client loops.
*/
export async function POST(req: Request) {
  let offset = 0
  try {
    const body = (await req.json()) as { offset?: number }
    if (typeof body.offset === 'number' && Number.isFinite(body.offset)) offset = body.offset
  } catch {
    /* no body: start from the beginning */
  }
  const batch = await reprocessBatch({ offset, budgetMs: 40_000 })
  return NextResponse.json({ ok: true, ...batch })
}
