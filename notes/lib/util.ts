/* Small shared helpers. Server + client safe. */

export function uid(prefix = ''): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 10)
  return prefix ? `${prefix}_${t}${r}` : `${t}${r}`
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

export function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1).trimEnd() + '…'
}

export function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

export function relativeTime(d: Date | string | number, now = Date.now()): string {
  const t = typeof d === 'number' ? d : new Date(d).getTime()
  const diff = now - t
  const abs = Math.abs(diff)
  const future = diff < 0
  const m = Math.round(abs / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return future ? `in ${m} min` : `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return future ? `in ${h}h` : `${h}h ago`
  const days = Math.round(h / 24)
  if (days === 1) return future ? 'tomorrow' : 'yesterday'
  if (days < 7) return future ? `in ${days} days` : `${days} days ago`
  const w = Math.round(days / 7)
  if (w < 5) return future ? `in ${w}w` : `${w}w ago`
  return formatDate(t)
}

export function formatDate(d: Date | string | number, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  const date = new Date(d)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString('en-US', sameYear ? opts : { ...opts, year: 'numeric' })
}

export function formatTime(d: Date | string | number): string {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function formatDateTime(d: Date | string | number): string {
  return `${formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' })} · ${formatTime(d)}`
}

export function isToday(d: Date | string | number): boolean {
  const a = new Date(d)
  const b = new Date()
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function greeting(now = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
}

export function pluralize(n: number, one: string, many = one + 's'): string {
  return `${n} ${n === 1 ? one : many}`
}

export function safeJson<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}

/** Extract the first JSON object/array from an LLM response, tolerating code fences. */
export function extractJson<T = unknown>(text: string): T | null {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fence ? fence[1]! : text
  const start = body.search(/[[{]/)
  if (start < 0) return null
  const candidate = body.slice(start)
  // Walk back from the end to find a parsable prefix.
  for (let end = candidate.length; end > 0; end--) {
    const ch = candidate[end - 1]
    if (ch !== '}' && ch !== ']') continue
    try {
      return JSON.parse(candidate.slice(0, end)) as T
    } catch {
      /* keep shrinking */
    }
  }
  return null
}

/** Split long text into overlapping chunks for embedding. */
export function chunkText(text: string, size = 900, overlap = 120): string[] {
  const clean = text.replace(/\r/g, '').trim()
  if (!clean) return []
  if (clean.length <= size) return [clean]
  const paragraphs = clean.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''
  for (const p of paragraphs) {
    if ((current + '\n\n' + p).length > size && current) {
      chunks.push(current.trim())
      current = current.slice(Math.max(0, current.length - overlap)) + '\n\n' + p
    } else {
      current = current ? current + '\n\n' + p : p
    }
    while (current.length > size * 1.6) {
      chunks.push(current.slice(0, size).trim())
      current = current.slice(size - overlap)
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks
}

export function sentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' \n ')
    .split(/(?<=[.!?])\s+|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
}

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
