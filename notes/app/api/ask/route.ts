import { NextRequest } from 'next/server'
import { getActiveContext, getContexts } from '@/lib/context'
import { ask } from '@/lib/ask'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { question, entityId, noteIds, all } = (await req.json()) as { question: string; entityId?: string; noteIds?: string[]; all?: boolean }
  const ctx = await getActiveContext()
  const ids = all ? (await getContexts()).map((c) => c.id) : [ctx.id]
  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const ev of ask(ids, question, { entityId, noteIds, userName: process.env.USER_NAME || 'Harsha' })) controller.enqueue(enc.encode(JSON.stringify(ev) + '\n'))
      } catch (err) {
        controller.enqueue(enc.encode(JSON.stringify({ type: 'error', message: String(err) }) + '\n'))
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' } })
}
