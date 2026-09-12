/*
  Diagnostic probe for the Gemini configuration: which models the key can see,
  which ones we resolved, and what a tiny generation + embedding call returns.
  Never includes the key itself; Google error bodies are trimmed.
*/
import { listGeminiModels, resolveGeminiModels } from './gemini-models'

const API = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface GeminiProbe {
  configured: boolean
  env: { GEMINI_MODEL?: string; GEMINI_EMBEDDING_MODEL?: string; AI_PROVIDER?: string }
  listModels: { status: number | string; count?: number; generation?: string[]; embedding?: string[]; error?: string }
  resolved?: { generation: string; embedding: string; source: string }
  generate?: { model: string; status: number | string; error?: string }
  embed?: { model: string; status: number | string; dims?: number; error?: string }
}

function trim(s: string) {
  return s.replace(/\s+/g, ' ').slice(0, 400)
}

export async function probeGemini(): Promise<GeminiProbe> {
  const key = process.env.GEMINI_API_KEY
  const env = { GEMINI_MODEL: process.env.GEMINI_MODEL, GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL, AI_PROVIDER: process.env.AI_PROVIDER }
  if (!key) return { configured: false, env, listModels: { status: 'skipped' } }
  const out: GeminiProbe = { configured: true, env, listModels: { status: 'pending' } }
  try {
    const list = await listGeminiModels(key)
    const names = (m: { name: string; supportedGenerationMethods?: string[] }, method: string) => (m.supportedGenerationMethods ?? []).includes(method)
    out.listModels = {
      status: 200,
      count: list.length,
      generation: list.filter((m) => names(m, 'generateContent')).map((m) => m.name.replace(/^models\//, '')).slice(0, 40),
      embedding: list.filter((m) => names(m, 'embedContent')).map((m) => m.name.replace(/^models\//, '')),
    }
  } catch (e) {
    out.listModels = { status: 'error', error: trim(String(e)) }
  }
  const resolved = await resolveGeminiModels(key, true)
  out.resolved = resolved
  try {
    const res = await fetch(`${API}/${resolved.generation}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with the single word: ok' }] }], generationConfig: { maxOutputTokens: 5 } }),
      signal: AbortSignal.timeout(20_000),
    })
    out.generate = { model: resolved.generation, status: res.status, ...(res.ok ? {} : { error: trim(await res.text()) }) }
  } catch (e) {
    out.generate = { model: resolved.generation, status: 'error', error: trim(String(e)) }
  }
  try {
    const res = await fetch(`${API}/${resolved.embedding}:embedContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({ content: { parts: [{ text: 'probe' }] }, outputDimensionality: 768 }),
      signal: AbortSignal.timeout(20_000),
    })
    if (res.ok) {
      const j = (await res.json()) as { embedding?: { values?: number[] } }
      out.embed = { model: resolved.embedding, status: res.status, dims: j.embedding?.values?.length }
    } else out.embed = { model: resolved.embedding, status: res.status, error: trim(await res.text()) }
  } catch (e) {
    out.embed = { model: resolved.embedding, status: 'error', error: trim(String(e)) }
  }
  return out
}
