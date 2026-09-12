/*
  Gemini model discovery. Model names change and ListModels can advertise models
  a key is no longer allowed to use ("no longer available to new users"), so we:
    1. ask the API which models this key can see,
    2. rank candidates (env override, then the newest stable Flash, the
       "-latest" aliases, Flash-Lite, Pro, anything else stable),
    3. verify a candidate with a one-token call and skip it on 404,
    4. remember the working pair in app_meta so cold starts reuse it.
*/
import { createHash } from 'node:crypto'

const API = 'https://generativelanguage.googleapis.com/v1beta/models'
const META_KEY = 'gemini_models'
const TTL_MS = 6 * 3600_000

export interface ResolvedModels {
  generation: string
  embedding: string
  source: 'env' | 'discovered' | 'default' | 'stored'
  verified: boolean
}

export const EMBEDDING_PREFERENCE = ['gemini-embedding-001', 'text-embedding-004', 'gemini-embedding-2', 'gemini-embedding-latest', 'text-embedding-005']

let cache: { key: string; models: ResolvedModels; at: number } | null = null
/** Models that answered 404 in this process; never retried until the process restarts. */
const unavailable = new Set<string>()

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

/** Mark a model as unusable for this key (called by providers when a call returns 404). */
export function markGeminiModelUnavailable(model: string) {
  unavailable.add(model)
  cache = null
}

export function invalidateGeminiModels() {
  cache = null
}

const NOT_GENERAL = /preview|exp|image|tts|audio|live|robotics|computer-use|transcribe|omni|research|antigravity|lyria|gemma|customtools|banana|thinking|embedding|aqa|imagen|veo/

function version(n: string): number {
  const m = /gemini-(\d+(?:\.\d+)?)/.exec(n)
  return m ? parseFloat(m[1]!) : -1
}
const byVersionDesc = (a: string, b: string) => version(b) - version(a) || a.localeCompare(b)
const uniq = (xs: string[]) => Array.from(new Set(xs))

/** Ordered generation candidates: env override first, then the newest stable Flash. */
export function rankGenerationModels(names: string[], env?: string): string[] {
  const stable = names.filter((n) => n.startsWith('gemini-') && !NOT_GENERAL.test(n))
  const flash = stable.filter((n) => /^gemini-\d+(\.\d+)?-flash$/.test(n)).sort(byVersionDesc)
  const latest = stable.filter((n) => /^gemini-(flash|pro)-latest$/.test(n)).sort()
  const flashLite = stable.filter((n) => /^gemini-\d+(\.\d+)?-flash-lite$/.test(n)).sort(byVersionDesc)
  const pro = stable.filter((n) => /^gemini-\d+(\.\d+)?-pro$/.test(n)).sort(byVersionDesc)
  const rest = stable.sort(byVersionDesc)
  const previews = names.filter((n) => /^gemini-\d+(\.\d+)?-flash(-lite)?-preview(-\d+)*$/.test(n)).sort(byVersionDesc)
  return uniq([...(env ? [env] : []), ...flash, ...latest, ...flashLite, ...pro, ...rest, ...previews]).filter((n) => !unavailable.has(n))
}

/** Ordered embedding candidates. The first preference stays stable so stored vectors remain comparable. */
export function rankEmbeddingModels(names: string[], env?: string): string[] {
  const embeds = names.filter((n) => /embedding/.test(n))
  const stable = embeds.filter((n) => !/preview|exp/.test(n)).sort(byVersionDesc)
  const previews = embeds.filter((n) => /preview|exp/.test(n)).sort(byVersionDesc)
  return uniq([...(env ? [env] : []), ...EMBEDDING_PREFERENCE.filter((p) => embeds.includes(p)), ...stable, ...previews]).filter((n) => !unavailable.has(n))
}

/** One-token generation call. true = usable, false = 404 (unavailable), null = other error (assume usable). */
export async function probeGeneration(apiKey: string, model: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${API}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'ok' }] }], generationConfig: { maxOutputTokens: 1 } }),
      signal: AbortSignal.timeout(20_000),
    })
    if (res.ok) return true
    return res.status === 404 ? false : null
  } catch {
    return null
  }
}

export async function probeEmbedding(apiKey: string, model: string, dims: number): Promise<boolean | null> {
  try {
    const res = await fetch(`${API}/${model}:embedContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ content: { parts: [{ text: 'ok' }] }, outputDimensionality: dims }),
      signal: AbortSignal.timeout(20_000),
    })
    if (res.ok) return true
    return res.status === 404 ? false : null
  } catch {
    return null
  }
}

async function firstUsable(candidates: string[], probe: (m: string) => Promise<boolean | null>, max = 6): Promise<{ model: string; verified: boolean } | null> {
  for (const m of candidates.slice(0, max)) {
    const r = await probe(m)
    if (r === false) {
      unavailable.add(m)
      continue
    }
    return { model: m, verified: r === true }
  }
  return null
}

/* ----------------------------- persistence (best effort) ----------------------------- */

function keyFingerprint(apiKey: string) {
  return createHash('sha256').update(apiKey).digest('hex').slice(0, 12)
}

interface Stored { generation: string; embedding: string; key: string; at: string }

async function readStored(apiKey: string): Promise<Stored | null> {
  try {
    const { getDb, schema } = await import('../db')
    const { eq } = await import('drizzle-orm')
    const db = await getDb()
    const row = (await db.select({ value: schema.appMeta.value }).from(schema.appMeta).where(eq(schema.appMeta.key, META_KEY)))[0]
    const v = row?.value as Stored | undefined
    if (!v || v.key !== keyFingerprint(apiKey)) return null
    if (Date.now() - Date.parse(v.at) > 7 * 24 * 3600_000) return null
    return v
  } catch {
    return null
  }
}

async function writeStored(apiKey: string, models: ResolvedModels) {
  try {
    const { getDb, schema } = await import('../db')
    const db = await getDb()
    const value: Stored = { generation: models.generation, embedding: models.embedding, key: keyFingerprint(apiKey), at: new Date().toISOString() }
    await db.insert(schema.appMeta).values({ key: META_KEY, value }).onConflictDoUpdate({ target: schema.appMeta.key, set: { value, updatedAt: new Date() } })
  } catch {
    /* optional */
  }
}

/* ----------------------------------- resolve ----------------------------------- */

export async function resolveGeminiModels(apiKey: string, force = false): Promise<ResolvedModels> {
  if (!force && cache && cache.key === apiKey && Date.now() - cache.at < TTL_MS) return cache.models
  const envGen = process.env.GEMINI_MODEL
  const envEmb = process.env.GEMINI_EMBEDDING_MODEL

  // Reuse a pair that worked recently unless a caller reported it broken.
  if (!force) {
    const stored = await readStored(apiKey)
    if (stored && !unavailable.has(stored.generation) && !unavailable.has(stored.embedding) && (!envGen || envGen === stored.generation) && (!envEmb || envEmb === stored.embedding)) {
      const models: ResolvedModels = { generation: stored.generation, embedding: stored.embedding, source: 'stored', verified: true }
      cache = { key: apiKey, models, at: Date.now() }
      return models
    }
  }

  let models: ResolvedModels
  try {
    const list = await listGeminiModels(apiKey)
    const gen = list.filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent')).map((m) => m.name.replace(/^models\//, ''))
    const emb = list.filter((m) => (m.supportedGenerationMethods ?? []).includes('embedContent')).map((m) => m.name.replace(/^models\//, ''))
    const g = await firstUsable(rankGenerationModels(gen, envGen), (m) => probeGeneration(apiKey, m))
    const e = await firstUsable(rankEmbeddingModels(emb, envEmb), (m) => probeEmbedding(apiKey, m, 768))
    models = {
      generation: g?.model ?? envGen ?? 'gemini-flash-latest',
      embedding: e?.model ?? envEmb ?? 'gemini-embedding-001',
      source: envGen && g?.model === envGen ? 'env' : 'discovered',
      verified: Boolean(g?.verified && e?.verified),
    }
  } catch {
    models = { generation: envGen ?? 'gemini-flash-latest', embedding: envEmb ?? 'gemini-embedding-001', source: 'default', verified: false }
  }
  cache = { key: apiKey, models, at: Date.now() }
  if (models.verified) await writeStored(apiKey, models)
  return models
}
