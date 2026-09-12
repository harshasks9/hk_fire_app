/* Gemini provider (REST, server-side only). */
import type { AIProvider, CompleteOptions, ExtractContext, Extraction } from './types'
import { emptyExtraction } from './types'
import { extractionPrompt, SYSTEM_CHIEF_OF_STAFF } from './prompts'
import { extractJson } from '../util'
import { logAiCall } from './log'

const API = 'https://generativelanguage.googleapis.com/v1beta/models'

export function geminiProvider(apiKey: string, model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'): AIProvider {
  async function call(prompt: string, opts: CompleteOptions): Promise<string> {
    const started = Date.now()
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: opts.system ?? SYSTEM_CHIEF_OF_STAFF }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: opts.maxTokens ?? 8192, ...(opts.json ? { responseMimeType: 'application/json' } : {}) },
    }
    const res = await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    })
    if (!res.ok) {
      const err = (await res.text()).slice(0, 300)
      await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: `HTTP ${res.status}: ${err}`, durationMs: Date.now() - started })
      throw new Error(`Gemini HTTP ${res.status}`)
    }
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
    await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, outputChars: text.length, ok: true, durationMs: Date.now() - started })
    return text
  }

  return {
    name: 'gemini',
    model,
    isLLM: true,
    async extract(text: string, ctx: ExtractContext): Promise<Extraction> {
      const raw = await call(extractionPrompt(text, ctx), { json: true, purpose: 'extract', maxTokens: 8192 })
      const parsed = extractJson<Partial<Extraction>>(raw)
      return { ...emptyExtraction(), ...(parsed ?? {}) }
    },
    complete: call,
    async *stream(prompt: string, opts: CompleteOptions) {
      const started = Date.now()
      const body = {
        systemInstruction: { parts: [{ text: opts.system ?? SYSTEM_CHIEF_OF_STAFF }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: opts.maxTokens ?? 8192 },
      }
      const res = await fetch(`${API}/${model}:streamGenerateContent?alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(120_000),
      })
      if (!res.ok || !res.body) {
        await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: `HTTP ${res.status}`, durationMs: Date.now() - started })
        throw new Error(`Gemini HTTP ${res.status}`)
      }
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''
      let outChars = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const payload = line.slice(5).trim()
          if (!payload || payload === '[DONE]') continue
          try {
            const j = JSON.parse(payload) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
            const t = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
            if (t) {
              outChars += t.length
              yield t
            }
          } catch {
            /* partial line */
          }
        }
      }
      await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, outputChars: outChars, ok: true, durationMs: Date.now() - started })
    },
  }
}
