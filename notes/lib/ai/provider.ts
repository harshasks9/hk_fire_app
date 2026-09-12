/*
  Provider selection. AI_PROVIDER=anthropic|gemini|local overrides auto-detection;
  otherwise the first configured key wins (Anthropic, then Gemini), falling back
  to local heuristics so the product works with no keys at all.
*/
import type { AIProvider } from './types'
import { localProvider } from './local'

export function getProvider(): AIProvider {
  const pref = process.env.AI_PROVIDER
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY
  if (pref === 'local') return localProvider
  if (pref === 'anthropic' && anthropicKey) return lazyAnthropic(anthropicKey)
  if (pref === 'gemini' && geminiKey) return lazyGemini(geminiKey)
  if (anthropicKey) return lazyAnthropic(anthropicKey)
  if (geminiKey) return lazyGemini(geminiKey)
  return localProvider
}

const cache: { anthropic?: AIProvider; gemini?: AIProvider } = {}

function lazyAnthropic(key: string): AIProvider {
  if (!cache.anthropic) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { anthropicProvider } = require('./anthropic') as typeof import('./anthropic')
    cache.anthropic = anthropicProvider(key)
  }
  return cache.anthropic
}

function lazyGemini(key: string): AIProvider {
  if (!cache.gemini) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { geminiProvider } = require('./gemini') as typeof import('./gemini')
    cache.gemini = geminiProvider(key)
  }
  return cache.gemini
}

export async function aiModels(): Promise<{ generation: string; embedding: string; source: string } | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key || getProvider().name !== 'gemini') return null
  const { resolveGeminiModels } = await import('./gemini-models')
  return resolveGeminiModels(key)
}

export function aiStatus() {
  const p = getProvider()
  return {
    provider: p.name,
    model: p.model,
    isLLM: p.isLLM,
    anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    embeddings: process.env.GEMINI_API_KEY && process.env.AI_PROVIDER !== 'local' ? 'gemini-text-embedding-004' : 'local-hash-v1',
  }
}
