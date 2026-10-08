import { NextResponse } from 'next/server'
import { requireSession, withNotebookAi } from '@/lib/session'
import { apiError } from '@/lib/api'
import { getProvider } from '@/lib/ai/provider'
import { effectiveKeys } from '@/lib/ai/scope'
import { probeGemini } from '@/lib/ai/gemini-probe'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Try the notebook's AI configuration for real: one tiny generation, and the Gemini model probe when a Gemini key applies. */
export async function POST() {
  try {
    await requireSession()
    return await withNotebookAi(async () => {
    const provider = getProvider()
    const keys = effectiveKeys()
    const out: Record<string, unknown> = { provider: provider.name, model: provider.model, mode: keys.preference ?? 'auto' }
    if (provider.isLLM) {
      const started = Date.now()
      try {
        const text = await provider.complete('Reply with the single word: ok', { purpose: 'settings-test', maxTokens: 5 })
        out.generation = { ok: true, sample: text.trim().slice(0, 40), ms: Date.now() - started }
      } catch (e) {
        out.generation = { ok: false, error: String((e as Error).message ?? e).slice(0, 300) }
      }
    } else {
      out.generation = { ok: true, sample: 'local heuristics (no model calls)' }
    }
    if (keys.gemini && keys.preference !== 'local') out.gemini = await probeGemini(keys.gemini)
    return NextResponse.json(out)
    })
  } catch (e) {
    return apiError(e)
  }
}
