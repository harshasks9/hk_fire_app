/* Gemini provider (REST, server-side only). */
import type { AIProvider, CompleteOptions, ExtractContext, Extraction } from './types'
import { emptyExtraction } from './types'
import { extractionPrompt, SYSTEM_CHIEF_OF_STAFF } from './prompts'
import { extractJson } from '../util'
import { logAiCall } from './log'
import { resolveGeminiModels, markGeminiModelUnavailable } from './gemini-models'
import { geminiFetch } from './gemini-retry'
import { QUOTA_SKIP_MS } from './gemini-models'

const API = 'https://generativelanguage.googleapis.com/v1beta/models'

export function geminiProvider(apiKey: string): AIProvider {
  let model = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  async function currentModel(): Promise<string> {
    model = (await resolveGeminiModels(apiKey)).generation
    return model
  }
  async function call(prompt: string, opts: CompleteOptions, retry = true): Promise<string> {
    const started = Date.now()
    const model = await currentModel()
    const body: Record<string, unknown> = {
      systemInstruction: { parts: [{ text: opts.system ?? SYSTEM_CHIEF_OF_STAFF }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: opts.maxTokens ?? 8192, ...(opts.json ? { responseMimeType: 'application/json' } : {}) },
    }
    const { res, errorText, attempts, quota } = await geminiFetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    })
    if (!res.ok) {
      const err = errorText.slice(0, 300)
      await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: `HTTP ${res.status}${attempts > 1 ? ` after ${attempts} attempts` : ''}: ${err}`, durationMs: Date.now() - started })
      if ((res.status === 404 || quota === 'daily') && retry) {
        // Model gone for this key (retired, or closed to new users) or its daily free-tier quota is spent:
        // move to the next usable model, whose quota is separate.
        markGeminiModelUnavailable(model, quota === 'daily' ? QUOTA_SKIP_MS : undefined)
        await resolveGeminiModels(apiKey, true)
        return call(prompt, opts, false)
      }
      throw new Error(`Gemini HTTP ${res.status}`)
    }
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('')
    await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, outputChars: text.length, ok: true, durationMs: Date.now() - started })
    return text
  }

  return {
    name: 'gemini',
    get model() {
      return model
    },
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
      const open = (m: string) =>
        geminiFetch(`${API}/${m}:streamGenerateContent?alt=sse`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(120_000),
        }, { maxWaitMs: 20_000 })
      let model = await currentModel()
      let { res, errorText, quota } = await open(model)
      if ((res.status === 404 || quota === 'daily') && !res.ok) {
        // Retired model or daily quota spent: switch models once and reopen the stream.
        await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: `HTTP ${res.status}: ${errorText.slice(0, 300)}`, durationMs: Date.now() - started })
        markGeminiModelUnavailable(model, quota === 'daily' ? QUOTA_SKIP_MS : undefined)
        model = (await resolveGeminiModels(apiKey, true)).generation
        ;({ res, errorText, quota } = await open(model))
      }
      if (!res.ok || !res.body) {
        await logAiCall({ provider: 'gemini', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: `HTTP ${res.status}: ${errorText.slice(0, 300)}`, durationMs: Date.now() - started })
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
