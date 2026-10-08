/*
  Provider selection. AI_PROVIDER=anthropic|gemini|local overrides auto-detection;
  otherwise the first configured key wins (Anthropic, then Gemini), falling back
  to local heuristics so the product works with no keys at all.
*/
import type { AIProvider } from './types'
import { localProvider } from './local'
import { effectiveKeys } from './scope'

export function getProvider(): AIProvider {
  const keys = effectiveKeys()
  const pref = keys.preference
  const anthropicKey = keys.anthropic
  const geminiKey = keys.gemini
  if (pref === 'local') return localProvider
  if (pref === 'anthropic' && anthropicKey) return lazyAnthropic(anthropicKey)
  if (pref === 'gemini' && geminiKey) return lazyGemini(geminiKey)
  if (anthropicKey) return lazyAnthropic(anthropicKey)
  if (geminiKey) return lazyGemini(geminiKey)
  return localProvider
}

// Providers are cached per key so notebooks with their own keys never share an instance.
const cache: { anthropic: Map<string, AIProvider>; gemini: Map<string, AIProvider> } = { anthropic: new Map(), gemini: new Map() }

function lazyAnthropic(key: string): AIProvider {
  let p = cache.anthropic.get(key)
  if (!p) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { anthropicProvider } = require('./anthropic') as typeof import('./anthropic')
    p = anthropicProvider(key)
    cache.anthropic.set(key, p)
  }
  return p
}

function lazyGemini(key: string): AIProvider {
  let p = cache.gemini.get(key)
  if (!p) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { geminiProvider } = require('./gemini') as typeof import('./gemini')
    p = geminiProvider(key)
    cache.gemini.set(key, p)
  }
  return p
}

export async function aiModels(): Promise<{ generation: string; embedding: string; source: string; verified: boolean } | null> {
  const key = effectiveKeys().gemini
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
    anthropicConfigured: Boolean(effectiveKeys().anthropic),
    geminiConfigured: Boolean(effectiveKeys().gemini),
    embeddings: effectiveKeys().gemini && effectiveKeys().preference !== 'local' && process.env.EMBEDDINGS !== 'local' ? 'gemini (model discovered at runtime)' : 'local-hash-v1',
  }
}
