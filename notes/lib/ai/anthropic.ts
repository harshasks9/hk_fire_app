/* Anthropic provider via the official SDK. Server-side only. */
import Anthropic from '@anthropic-ai/sdk'
import type { AIProvider, CompleteOptions, ExtractContext, Extraction } from './types'
import { emptyExtraction } from './types'
import { extractionPrompt, SYSTEM_CHIEF_OF_STAFF } from './prompts'
import { extractJson } from '../util'
import { logAiCall } from './log'

export function anthropicProvider(apiKey: string, model = process.env.ANTHROPIC_MODEL || 'claude-opus-5'): AIProvider {
  const client = new Anthropic({ apiKey })

  async function call(prompt: string, opts: CompleteOptions): Promise<string> {
    const started = Date.now()
    try {
      const stream = client.messages.stream({
        model,
        max_tokens: opts.maxTokens ?? 16000,
        system: opts.system ?? SYSTEM_CHIEF_OF_STAFF,
        output_config: { effort: 'medium' },
        messages: [{ role: 'user', content: prompt }],
      })
      const msg = await stream.finalMessage()
      if (msg.stop_reason === 'refusal') throw new Error('Model declined the request')
      const text = msg.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
      await logAiCall({ provider: 'anthropic', model, purpose: opts.purpose, inputChars: prompt.length, outputChars: text.length, ok: true, durationMs: Date.now() - started })
      return text
    } catch (err) {
      await logAiCall({ provider: 'anthropic', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: String(err).slice(0, 300), durationMs: Date.now() - started })
      throw err
    }
  }

  return {
    name: 'anthropic',
    model,
    isLLM: true,
    async extract(text: string, ctx: ExtractContext): Promise<Extraction> {
      const raw = await call(extractionPrompt(text, ctx) + '\n\nRespond with the JSON object only.', { purpose: 'extract' })
      const parsed = extractJson<Partial<Extraction>>(raw)
      return { ...emptyExtraction(), ...(parsed ?? {}) }
    },
    complete: call,
    async *stream(prompt: string, opts: CompleteOptions) {
      const started = Date.now()
      let outChars = 0
      try {
        const stream = client.messages.stream({
          model,
          max_tokens: opts.maxTokens ?? 16000,
          system: opts.system ?? SYSTEM_CHIEF_OF_STAFF,
          output_config: { effort: 'medium' },
          messages: [{ role: 'user', content: prompt }],
        })
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            outChars += event.delta.text.length
            yield event.delta.text
          }
        }
        await logAiCall({ provider: 'anthropic', model, purpose: opts.purpose, inputChars: prompt.length, outputChars: outChars, ok: true, durationMs: Date.now() - started })
      } catch (err) {
        await logAiCall({ provider: 'anthropic', model, purpose: opts.purpose, inputChars: prompt.length, ok: false, error: String(err).slice(0, 300), durationMs: Date.now() - started })
        throw err
      }
    },
  }
}
