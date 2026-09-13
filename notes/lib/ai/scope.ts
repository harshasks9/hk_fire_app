/*
  Per-notebook AI configuration, carried through the async call chain with
  AsyncLocalStorage so that getProvider()/getEmbeddingProvider()/logAiCall()
  use the right keys without every call site threading them explicitly.
  When nothing is set (scripts, cron before a notebook is chosen) the
  deployment's environment keys apply.
*/
import { AsyncLocalStorage } from 'node:async_hooks'
import type { AiMode } from '../db/schema'

export interface AiScope {
  notebookId?: string
  mode: AiMode
  preference?: 'auto' | 'anthropic' | 'gemini'
  anthropicKey?: string
  geminiKey?: string
  ownerName?: string
}

const als = new AsyncLocalStorage<AiScope>()

export function currentAiScope(): AiScope | undefined {
  return als.getStore()
}

/** Make `scope` the AI configuration for the rest of this async context. */
export function enterAiScope(scope: AiScope) {
  als.enterWith(scope)
}

export function runWithAiScope<T>(scope: AiScope, fn: () => T): T {
  return als.run(scope, fn)
}

/** Effective keys after applying the scope: own keys, shared (env) keys, or none in local mode. */
export function effectiveKeys(): { anthropic?: string; gemini?: string; preference?: 'auto' | 'anthropic' | 'gemini' | 'local' } {
  const s = als.getStore()
  const env = { anthropic: process.env.ANTHROPIC_API_KEY || undefined, gemini: process.env.GEMINI_API_KEY || undefined }
  const envPref = process.env.AI_PROVIDER as 'auto' | 'anthropic' | 'gemini' | 'local' | undefined
  if (!s) return { ...env, preference: envPref }
  if (s.mode === 'local') return { preference: 'local' }
  if (s.mode === 'own') return { anthropic: s.anthropicKey, gemini: s.geminiKey, preference: s.preference ?? 'auto' }
  return { ...env, preference: s.preference && s.preference !== 'auto' ? s.preference : envPref }
}
