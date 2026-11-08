/**
 * Unicode-aware search across naming systems.
 *
 * "Krishna", "Kṛṣṇa", "krsna" and "कृष्ण" must reach the same record, while
 * genuinely different names stay different. The approach:
 *   1. Devanāgarī input is transliterated to IAST (a small, rule-based mapper).
 *   2. IAST is folded: NFD + strip combining marks (ṛ→r, ṣ→s, ā→a, ś→s, ṃ→m).
 *   3. Common English spellings are folded onto the same key: sh→s, ch→c,
 *      ri→r (Krishna→krsna), aa→a, ee→i, oo→u, w→v, th→t, dh→d, bh→b …
 * Every name, IAST form, Devanāgarī form, alias and other-script form of an entity
 * is indexed under its folded key; matching is by key prefix/containment, with a
 * small edit-distance fallback for typos. Distinct entities with the same name
 * (two Bharatas, two Nalas) are both returned — with their disambiguating labels.
 */
export interface Searchable {
  id: string
  name: string
  type: string
  iast?: string
  devanagari?: string
  aliases?: string[]
  scripts?: { text: string }[]
  summary?: string
  m?: { degree: number }
}

const V: Record<string, string> = { 'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū', 'ऋ': 'ṛ', 'ॠ': 'ṝ', 'ऌ': 'ḷ', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au' }
const M: Record<string, string> = { 'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ṛ', 'ॄ': 'ṝ', 'ॢ': 'ḷ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au' }
const C: Record<string, string> = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ', 'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ',
  'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ', 'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'ś',
  'ष': 'ṣ', 'स': 's', 'ह': 'h', 'ळ': 'ḷ', 'क़': 'q', 'ज़': 'z', 'फ़': 'f',
}
const SIGNS: Record<string, string> = { 'ं': 'ṃ', 'ः': 'ḥ', 'ँ': 'm̐', 'ऽ': "'", 'ॐ': 'oṃ' }

export function devanagariToIast(s: string): string {
  let out = ''
  const chars = [...s.normalize('NFC')]
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i]
    if (C[ch] !== undefined) {
      out += C[ch]
      const next = chars[i + 1]
      if (next === '्') { i++; continue }
      if (next && M[next] !== undefined) { out += M[next]; i++; continue }
      // inherent vowel, except word-finally in a modern-language name (schwa deletion is
      // ambiguous; the folded key below drops a final "a" anyway)
      out += 'a'
      continue
    }
    if (V[ch] !== undefined) { out += V[ch]; continue }
    if (SIGNS[ch] !== undefined) { out += SIGNS[ch]; continue }
    if (ch === '्' || ch === '़') continue
    out += ch
  }
  return out
}

const DEVA = /[ऀ-ॿ]/
export function fold(raw: string): string {
  let s = raw
  if (DEVA.test(s)) s = devanagariToIast(s)
  s = s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  s = s
    .replace(/[’'`ʼ]/g, '')
    .replace(/sh/g, 's')
    .replace(/ch/g, 'c')
    .replace(/zh/g, 'l')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/bh/g, 'b')
    .replace(/ph/g, 'p')
    .replace(/kh/g, 'k')
    .replace(/gh/g, 'g')
    .replace(/jh/g, 'j')
    .replace(/w/g, 'v')
    .replace(/ri(?=[^aeiou]|$)/g, 'r')
    .replace(/ru(?=[^aeiou]|$)/g, 'r')
    .replace(/ee/g, 'i')
    .replace(/oo/g, 'u')
    .replace(/aa/g, 'a')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/[^a-z0-9஀-௿฀-๿ក-៿ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // drop word-final short "a" so Rama/Ram, Krishna/Krishn, Hanumana/Hanuman meet
  return s.replace(/([^aeiou ])a(?=\s|$)/g, '$1')
}

interface Entry { id: string; key: string; label: string; weight: number }
export interface SearchIndex { entries: Entry[]; items: Map<string, Searchable> }

export function buildSearchIndex(items: Searchable[]): SearchIndex {
  const entries: Entry[] = []
  for (const it of items) {
    const push = (label: string | undefined, weight: number) => {
      if (!label) return
      const key = fold(label)
      if (key) entries.push({ id: it.id, key, label, weight })
    }
    push(it.name, 1)
    push(it.name.replace(/\s*\(.*?\)\s*/g, ' '), 1)
    push(it.iast, 0.95)
    push(it.devanagari, 0.95)
    for (const a of it.aliases ?? []) push(a, 0.85)
    for (const s of it.scripts ?? []) push(s.text, 0.85)
  }
  return { entries, items: new Map(items.map((i) => [i.id, i])) }
}

function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = cur[0]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

export interface Hit { id: string; score: number; matched: string }

export function search(index: SearchIndex, query: string, limit = 20, filter?: (s: Searchable) => boolean): Hit[] {
  const q = fold(query)
  if (!q) return []
  const best = new Map<string, Hit>()
  const consider = (e: Entry, score: number) => {
    const item = index.items.get(e.id)
    if (!item || (filter && !filter(item))) return
    const s = score * e.weight + Math.min(6, Math.log2(1 + (item.m?.degree ?? 0)))
    const cur = best.get(e.id)
    if (!cur || s > cur.score) best.set(e.id, { id: e.id, score: s, matched: e.label })
  }
  for (const e of index.entries) {
    if (e.key === q) consider(e, 100)
    else if (e.key.startsWith(q)) consider(e, 80 - Math.min(20, e.key.length - q.length))
    else if (e.key.split(' ').some((w) => w.startsWith(q))) consider(e, 62)
    else if (q.length >= 3 && e.key.includes(q)) consider(e, 45)
  }
  if (best.size < 5 && q.length >= 4) {
    for (const e of index.entries) {
      for (const w of e.key.split(' ')) {
        if (w.length >= 4 && lev(q, w, q.length > 6 ? 2 : 1) <= (q.length > 6 ? 2 : 1)) { consider(e, 30); break }
      }
    }
  }
  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit)
}
