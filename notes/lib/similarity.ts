import { tokenize } from './ai/embeddings'

export function keywordSet(s: string): Set<string> {
  return new Set(tokenize(s).map((t) => t.replace(/(ings?|ed|es|s)$/, '')))
}

export function jaccard(a: string, b: string): number {
  const A = keywordSet(a)
  const B = keywordSet(b)
  if (A.size === 0 || B.size === 0) return 0
  let inter = 0
  for (const t of A) if (B.has(t)) inter++
  return inter / (A.size + B.size - inter)
}

export function similarText(a: string, b: string, threshold = 0.5): boolean {
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) return true
  return jaccard(a, b) >= threshold
}
