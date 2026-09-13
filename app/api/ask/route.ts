import { NextRequest } from 'next/server'
import { getActiveScope } from '@/lib/context'
import { getSession, withNotebookAi } from '@/lib/session'
import { ask } from '@/lib/ask'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const { question, entityId, noteIds, all } = (await req.json()) as { question: string; entityId?: string; noteIds?: string[]; all?: boolean }
  const s = await getSession()
  const scope = await getActiveScope()
  const ids = all ? scope.contexts.map((c) => c.id) : scope.ids
  const enc = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await withNotebookAi(async () => {
          for await (const ev of ask(ids, question, { entityId, noteIds, userName: s?.user.name ?? process.env.USER_NAME ?? 'You' })) controller.enqueue(enc.encode(JSON.stringify(ev) + '\n'))
        })
      } catch (err) {
        controller.enqueue(enc.encode(JSON.stringify({ type: 'error', message: String(err) }) + '\n'))
      }
      controller.close()
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache' } })
}
