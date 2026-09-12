/*
  Gemini model discovery. Model names change; instead of hard-coding them we ask
  the API which models this key can use and pick the best generation and
  embedding models, honouring GEMINI_MODEL / GEMINI_EMBEDDING_MODEL when set
  and available. Cached per process.
*/
const API = 'https://generativelanguage.googleapis.com/v1beta/models'

export interface ResolvedModels { generation: string; embedding: string; source: 'env' | 'discovered' | 'default' }

const GENERATION_PREFERENCE = ['gemini-2.5-flash', 'gemini-3-flash', 'gemini-3.0-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-3-pro', 'gemini-2.5-pro', 'gemini-pro-latest']
const EMBEDDING_PREFERENCE = ['gemini-embedding-001', 'text-embedding-004', 'gemini-embedding-2', 'gemini-embedding-latest', 'text-embedding-005']

let cache: { key: string; models: ResolvedModels; at: number } | null = null

interface ModelInfo { name: string; supportedGenerationMethods?: string[] }

export async function listGeminiModels(apiKey: string): Promise<ModelInfo[]> {
  const out: ModelInfo[] = []
  let pageToken: string | undefined
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${API}?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`, { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`Gemini ListModels HTTP ${res.status}`)
    const j = (await res.json()) as { models?: ModelInfo[]; nextPageToken?: string }
    out.push(...(j.models ?? []))
    pageToken = j.nextPageToken
    if (!pageToken) break
  }
  return out
}

function pick(available: Set<string>, preference: string[], prefixFallback: (n: string) => boolean, names: string[]): string | undefined {
  for (const p of preference) if (available.has(p)) return p
  // Versioned variants, e.g. gemini-2.5-flash-002
  for (const p of preference) {
    const v = names.find((n) => n.startsWith(p + '-') && !/preview|exp/.test(n))
    if (v) return v
  }
  return names.find(prefixFallback)
}

export async function resolveGeminiModels(apiKey: string, force = false): Promise<ResolvedModels> {
  if (!force && cache && cache.key === apiKey && Date.now() - cache.at < 6 * 3600_000) return cache.models
  const envGen = process.env.GEMINI_MODEL
  const envEmb = process.env.GEMINI_EMBEDDING_MODEL
  let models: ResolvedModels
  try {
    const list = await listGeminiModels(apiKey)
    const gen = list.filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent')).map((m) => m.name.replace(/^models\//, ''))
    const emb = list.filter((m) => (m.supportedGenerationMethods ?? []).includes('embedContent')).map((m) => m.name.replace(/^models\//, ''))
    const genSet = new Set(gen)
    const embSet = new Set(emb)
    const generation = (envGen && genSet.has(envGen) ? envGen : undefined) ?? pick(genSet, GENERATION_PREFERENCE, (n) => /flash/.test(n) && !/preview|exp|image|tts|audio|live/.test(n), gen) ?? pick(genSet, [], (n) => /gemini/.test(n) && !/image|tts|audio|live|embedding/.test(n), gen) ?? envGen ?? 'gemini-2.5-flash'
    const embedding = (envEmb && embSet.has(envEmb) ? envEmb : undefined) ?? pick(embSet, EMBEDDING_PREFERENCE, (n) => /embedding/.test(n), emb) ?? envEmb ?? 'gemini-embedding-001'
    models = { generation, embedding, source: envGen && generation === envGen ? 'env' : 'discovered' }
  } catch {
    models = { generation: envGen ?? 'gemini-2.5-flash', embedding: envEmb ?? 'gemini-embedding-001', source: 'default' }
  }
  cache = { key: apiKey, models, at: Date.now() }
  return models
}

export function invalidateGeminiModels() {
  cache = null
}
