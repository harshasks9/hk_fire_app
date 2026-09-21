/* Server side of the web clipper: fetch a page, extract the article, file it as a note. */
import { getDb, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { addSource, createNote } from '@/lib/notes'
import { extractArticle, clipMarkdown, type Article } from './article'

export { extractArticle, clipMarkdown, parseShare, articleMeta } from './article'
export type { Article } from './article'

const MAX_BYTES = 3 * 1024 * 1024

/** Hosts a server should not be talked into fetching on someone's behalf. */
export function isFetchableUrl(raw: string): boolean {
  let u: URL
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  // Local development and end-to-end tests clip pages served from this machine.
  if (process.env.CLIP_ALLOW_PRIVATE === '1') return true
  const h = u.hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return false
  const v4 = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])]
    if (a === 10 || a === 127 || a === 0 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254)) return false
  }
  if (h.startsWith('[') || h.includes(':')) return false // IPv6 literals: not worth the risk
  return true
}

export interface FetchedArticle extends Article { fetched: boolean; contentType: string; error?: string }

/** Fetch a page and extract its article. Never throws: a page that cannot be read comes back with `fetched: false` and an empty body. */
export async function fetchArticle(url: string, opts: { timeoutMs?: number } = {}): Promise<FetchedArticle> {
  const empty = (error: string): FetchedArticle => ({ ...extractArticle('', url), title: url, canonical: url, fetched: false, contentType: '', error })
  if (!isFetchableUrl(url)) return empty('This address cannot be fetched')
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 9000), redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HKNotes/1.0; +https://notes.hkfire.app)', Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.5', 'Accept-Language': 'en' } })
    const contentType = res.headers.get('content-type') ?? ''
    if (!res.ok) return empty(`The page answered ${res.status}`)
    if (!/html|xml|text\/plain/i.test(contentType) && contentType) return { ...empty(''), fetched: true, contentType }
    const html = await readCapped(res, MAX_BYTES)
    const finalUrl = res.url || url
    const a = extractArticle(html, finalUrl)
    return { ...a, fetched: true, contentType }
  } catch (e) {
    return empty(e instanceof Error && e.name === 'TimeoutError' ? 'The page took too long to answer' : 'The page could not be fetched')
  }
}

async function readCapped(res: Response, max: number): Promise<string> {
  if (!res.body) return await res.text()
  const reader = res.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (size < max) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) { chunks.push(value); size += value.length }
  }
  try { await reader.cancel() } catch { /* stream already closed */ }
  const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)))
  return buf.toString('utf8')
}

export interface ClipInput {
  contextId: string
  url: string
  /** Title the sharer supplied (the page's own headline wins when the page can be read). */
  title?: string
  /** The reader's comment, kept above the article. */
  comment?: string
  /** Text selected on the page, kept as a quote. */
  selection?: string
  source?: string
  createdAt?: Date
  maxChars?: number
}

export interface ClipResult { id: string; title: string; markdown: string; article: FetchedArticle }

/** Fetch, extract and file a page as a `link` note in the Inbox. The caller schedules the pipeline. */
export async function clipToNote(input: ClipInput): Promise<ClipResult> {
  const article = await fetchArticle(input.url)
  const given = (input.title ?? '').trim()
  const title = (article.fetched && article.wordCount > 0 ? article.title : '') || given || article.title || input.url
  const a: Article = { ...article, title }
  const markdown = clipMarkdown(a, { url: input.url, comment: input.comment, selection: input.selection, maxChars: input.maxChars })
  const id = await createNote({ contextId: input.contextId, title, markdown, kind: 'link', source: input.source ?? 'clip', sourceUrl: input.url, status: 'inbox', createdAt: input.createdAt })
  await addSource(id, { kind: 'url', url: article.canonical || input.url, title, extractedText: article.markdown ? article.markdown.slice(0, 100000) : undefined })
  return { id, title, markdown, article }
}
