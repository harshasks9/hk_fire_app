/*
  Embeddings. Gemini text-embedding-004 (768d) when configured; otherwise a
  deterministic local embedding (hashed unigram+bigram features, L2 normalised,
  768d) so semantic search works everywhere and the vector column has one shape.
*/
import type { EmbeddingProvider } from './types'

export const EMBEDDING_DIMENSIONS = 768

const STOP = new Set('a an the and or of to in on for with is are was were be been it this that these those as at by from we i you he she they our your their my his her its not no yes do does did have has had will would can could should may might so if then than into about over under up down out very just also more most'.split(' '))

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9$%.\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.replace(/^[.-]+|[.-]+$/g, ''))
    .filter((t) => t.length > 1 && !STOP.has(t))
}

function fnv1a(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

function stem(t: string): string {
  return t.replace(/(ings?|ed|es|s|ly|tion|ments?)$/i, (m) => (t.length - m.length >= 4 ? '' : m))
}

export function localEmbed(text: string): number[] {
  const v = new Float64Array(EMBEDDING_DIMENSIONS)
  const toks = tokenize(text).map(stem)
  if (toks.length === 0) return Array.from(v)
  const add = (feature: string, weight: number) => {
    const h = fnv1a(feature)
    const idx = h % EMBEDDING_DIMENSIONS
    const sign = (h >>> 16) & 1 ? 1 : -1
    v[idx] = (v[idx] ?? 0) + sign * weight
    // second hash for smoother distribution
    const h2 = fnv1a('#' + feature)
    const j = h2 % EMBEDDING_DIMENSIONS
    v[j] = (v[j] ?? 0) + ((h2 >>> 8) & 1 ? 1 : -1) * weight * 0.5
  }
  const counts = new Map<string, number>()
  for (const t of toks) counts.set(t, (counts.get(t) ?? 0) + 1)
  for (const [t, c] of counts) add(t, 1 + Math.log(c))
  for (let i = 0; i < toks.length - 1; i++) add(toks[i] + '_' + toks[i + 1], 0.6)
  let norm = 0
  for (let i = 0; i < v.length; i++) norm += v[i]! * v[i]!
  norm = Math.sqrt(norm) || 1
  return Array.from(v, (x) => x / norm)
}

export const localEmbeddingProvider: EmbeddingProvider = {
  name: 'local-hash-v1',
  dimensions: EMBEDDING_DIMENSIONS,
  async embed(texts) {
    return texts.map(localEmbed)
  },
}

export function geminiEmbeddingProvider(apiKey: string): EmbeddingProvider {
  return {
    name: 'gemini-text-embedding-004',
    dimensions: EMBEDDING_DIMENSIONS,
    async embed(texts) {
      const out: number[][] = []
      for (let i = 0; i < texts.length; i += 50) {
        const batch = texts.slice(i, i + 50)
        const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
          body: JSON.stringify({
            requests: batch.map((t) => ({ model: 'models/text-embedding-004', content: { parts: [{ text: t.slice(0, 8000) }] } })),
          }),
          signal: AbortSignal.timeout(30_000),
        })
        if (!res.ok) throw new Error(`Gemini embeddings HTTP ${res.status}`)
        const json = (await res.json()) as { embeddings: { values: number[] }[] }
        for (const e of json.embeddings) out.push(e.values)
      }
      return out
    },
  }
}

export function getEmbeddingProvider(): EmbeddingProvider {
  const key = process.env.GEMINI_API_KEY
  if (key && process.env.AI_PROVIDER !== 'local' && process.env.EMBEDDINGS !== 'local') return geminiEmbeddingProvider(key)
  return localEmbeddingProvider
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1)
}
