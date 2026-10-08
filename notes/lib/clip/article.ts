/*
  Readable-article extraction for the web clipper. Pure functions over an HTML
  string: no network, no DOM. Picks the block of the page that reads like the
  article (paragraph-dense, link-sparse), strips the chrome around it and turns
  it into Markdown with the document converter the uploads already use.
*/
import { htmlToMarkdown } from '@/lib/documents/extract'

export interface ArticleMeta {
  title: string
  siteName: string
  author: string
  published: string | null
  description: string
  image: string | null
  canonical: string
}

export interface Article extends ArticleMeta {
  markdown: string
  excerpt: string
  wordCount: number
  /** How the body was found: a semantic container, the densest block, or the whole page. */
  method: 'article' | 'main' | 'density' | 'page' | 'none'
}

const STRIP_RE = /<(script|style|noscript|svg|template|iframe|nav|footer|header|aside|form|button|select|dialog|menu)\b[\s\S]*?<\/\1>/gi
const COMMENT_RE = /<!--[\s\S]*?-->/g
const NOISE_CLASS_RE = /\b(comments?|comment-list|sidebar|share|sharing|social|related|recommend|newsletter|subscribe|promo|advert|ad-|ads\b|banner|cookie|popup|modal|breadcrumb|pagination|footer|nav|menu|toolbar|widget|byline-links|tags-list)\b/i

function meta(html: string, ...names: string[]): string {
  for (const n of names) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*?content=["']([^"']*)["']`, 'i')
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*?(?:property|name|itemprop)=["']${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'i')
    const m = re1.exec(html) ?? re2.exec(html)
    if (m?.[1]?.trim()) return decode(m[1].trim())
  }
  return ''
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
}

/** Title, byline, date, description and image from Open Graph, Twitter cards, schema.org and the <title>. */
export function articleMeta(html: string, url: string): ArticleMeta {
  const titleTag = decode(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim()
  const h1 = decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? '').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
  const siteName = meta(html, 'og:site_name', 'application-name') || hostOf(url)
  let title = meta(html, 'og:title', 'twitter:title', 'headline') || h1 || titleTag
  // "Headline | Site" → "Headline" when the suffix is the site's own name.
  const sep = title.match(/^(.*?)\s+[|–—-]\s+([^|–—-]+)$/)
  if (sep && sep[2] && (sep[2].trim().toLowerCase() === siteName.toLowerCase() || titleTag.endsWith(sep[2]))) title = sep[1]!.trim() || title
  const author = meta(html, 'author', 'article:author', 'og:article:author', 'twitter:creator', 'parsely-author', 'dc.creator', 'sailthru.author').replace(/^@/, '').replace(/^https?:\/\/\S+$/, '')
  const publishedRaw = meta(html, 'article:published_time', 'og:article:published_time', 'datePublished', 'date', 'pubdate', 'publish-date', 'parsely-pub-date', 'dc.date', 'sailthru.date') || (html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1] ?? '')
  const published = publishedRaw && !Number.isNaN(Date.parse(publishedRaw)) ? new Date(publishedRaw).toISOString() : null
  const description = meta(html, 'og:description', 'twitter:description', 'description')
  const image = absolute(meta(html, 'og:image', 'twitter:image', 'twitter:image:src'), url)
  const canonicalRaw = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1] ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1] ?? meta(html, 'og:url')
  const canonical = absolute(canonicalRaw, url) ?? url
  return { title: title || titleTag || url, siteName, author, published, description, image, canonical }
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return '' }
}

function absolute(href: string, base: string): string | null {
  if (!href) return null
  try { return new URL(href, base).toString() } catch { return null }
}

/** Make relative links and images absolute so the clipped Markdown still points somewhere. */
export function absolutizeUrls(fragment: string, base: string): string {
  return fragment.replace(/(<(?:a|img)\b[^>]*?\s(?:href|src)=["'])([^"']+)(["'])/gi, (_, pre: string, u: string, post: string) => {
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(u)) return `${pre}${u}${post}`
    return `${pre}${absolute(u, base) ?? u}${post}`
  })
}

function textOf(fragment: string): string {
  return decode(fragment.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function linkTextLength(fragment: string): number {
  let n = 0
  for (const m of fragment.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi)) n += textOf(m[1]!).length
  return n
}

/** Score a candidate block: paragraphs and commas are good, links and short text are bad. */
function score(fragment: string): number {
  const text = textOf(fragment)
  if (text.length < 140) return 0
  const paragraphs = (fragment.match(/<p\b/gi) ?? []).length
  const commas = (text.match(/[,;，、]/g) ?? []).length
  const linkDensity = linkTextLength(fragment) / Math.max(1, text.length)
  const base = Math.min(text.length / 100, 40) + paragraphs * 3 + Math.min(commas, 30)
  return base * (1 - Math.min(0.9, linkDensity * 1.4))
}

/** Every top-level-ish block element with its inner HTML, cheaply: div/section/article/main with balanced tags. */
function blocks(html: string, tag: string): string[] {
  const out: string[] = []
  const open = new RegExp(`<${tag}\\b[^>]*>`, 'gi')
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = open.exec(html)) && guard++ < 4000) {
    const start = m.index
    let depth = 1
    const scan = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi')
    scan.lastIndex = start + m[0].length
    let s: RegExpExecArray | null
    while ((s = scan.exec(html))) {
      if (s[0].startsWith('</')) depth--
      else if (!s[0].endsWith('/>')) depth++
      if (depth === 0) { out.push(html.slice(start, s.index + s[0].length)); break }
    }
  }
  return out
}

function classOf(openTag: string): string {
  return `${openTag.match(/\bclass=["']([^"']*)["']/i)?.[1] ?? ''} ${openTag.match(/\bid=["']([^"']*)["']/i)?.[1] ?? ''} ${openTag.match(/\brole=["']([^"']*)["']/i)?.[1] ?? ''}`
}

/** Remove the blocks whose class or id says they are chrome (comments, sharing, related, ads…). */
function dropNoise(fragment: string): string {
  let out = fragment
  for (const tag of ['div', 'section', 'ul', 'ol', 'figure']) {
    for (const b of blocks(out, tag)) {
      const openTag = b.match(/^<[^>]+>/)?.[0] ?? ''
      const cls = classOf(openTag)
      if (cls && NOISE_CLASS_RE.test(cls) && !/\b(article|content|post-body|entry-content|story)\b/i.test(cls)) out = out.replace(b, ' ')
    }
  }
  return out
}

/** The readable part of a page as Markdown, plus its metadata. */
export function extractArticle(html: string, url: string): Article {
  const m = articleMeta(html, url)
  const clean = html.replace(COMMENT_RE, '').replace(STRIP_RE, ' ')
  const bodyHtml = clean.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? clean
  let candidate = ''
  let method: Article['method'] = 'none'
  const articles = blocks(bodyHtml, 'article').filter((a) => textOf(a).length >= 200)
  if (articles.length) { candidate = articles.sort((a, b) => score(b) - score(a))[0]!; method = 'article' }
  if (!candidate) {
    const mains = blocks(bodyHtml, 'main').filter((a) => textOf(a).length >= 200)
    if (mains.length) { candidate = mains[0]!; method = 'main' }
  }
  if (!candidate) {
    // Densest block among div/section: the one with the most paragraph text and the fewest links.
    let best = 0
    for (const tag of ['section', 'div', 'td']) for (const b of blocks(bodyHtml, tag)) {
      const s = score(b)
      if (s > best) { best = s; candidate = b; method = 'density' }
    }
    // Prefer a smaller block that still carries almost all of the text (the page wrapper scores high too).
    if (candidate) {
      const total = textOf(candidate).length
      const inner = blocks(candidate.replace(/^<[^>]+>/, ''), 'div').concat(blocks(candidate.replace(/^<[^>]+>/, ''), 'section')).filter((b) => textOf(b).length >= total * 0.8 && b.length < candidate.length)
      if (inner.length) candidate = inner.sort((a, b) => a.length - b.length)[0]!
    }
  }
  if (!candidate || textOf(candidate).length < 200) { candidate = bodyHtml; method = textOf(bodyHtml).length >= 80 ? 'page' : 'none' }
  const fragment = absolutizeUrls(dropNoise(candidate), url)
  let { markdown } = htmlToMarkdown(`<div>${fragment}</div>`)
  // The headline is the note's title; drop it from the body when it opens the article.
  const firstLine = markdown.split('\n').find((l) => l.trim())?.trim() ?? ''
  if (firstLine.replace(/^#+\s*/, '').toLowerCase() === m.title.toLowerCase()) markdown = markdown.slice(markdown.indexOf(firstLine) + firstLine.length).trim()
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim()
  const text = markdown.replace(/[#*_`>\[\]()|-]/g, ' ').replace(/\s+/g, ' ').trim()
  const wordCount = text ? text.split(' ').length : 0
  const excerpt = m.description || text.slice(0, 280)
  return { ...m, markdown, excerpt, wordCount, method: wordCount ? method : 'none' }
}

export interface ShareInput { title?: string | null; text?: string | null; url?: string | null }

/**
 * What a share sheet or bookmarklet handed us. Android puts the URL in `text`
 * more often than in `url`; the bookmarklet puts the selection in `text`.
 */
export function parseShare(input: ShareInput): { url: string | null; title: string; text: string } {
  const title = (input.title ?? '').trim()
  let text = (input.text ?? '').trim()
  let url = (input.url ?? '').trim()
  const urlRe = /https?:\/\/[^\s<>"']+/
  if (!/^https?:\/\//i.test(url)) url = ''
  if (!url) {
    const m = text.match(urlRe) ?? title.match(urlRe)
    if (m) { url = m[0]; text = text.replace(m[0], '').trim() }
  } else if (text === url) text = ''
  return { url: url || null, title: title === url ? '' : title, text }
}

/** The Markdown body of a clipped note: the reader's comment, the selection, the byline and the article. */
export function clipMarkdown(a: Article, opts: { url: string; comment?: string; selection?: string; maxChars?: number }): string {
  const parts: string[] = []
  const byline = [a.author ? `By ${a.author}` : '', a.published ? new Date(a.published).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '', a.siteName].filter(Boolean).join(' · ')
  if (byline) parts.push(`_${byline}_`)
  if (opts.comment?.trim()) parts.push(opts.comment.trim())
  if (opts.selection?.trim()) parts.push(opts.selection.trim().split(/\n{2,}/).map((p) => `> ${p.replace(/\n/g, ' ').trim()}`).join('\n>\n'))
  if (a.description && !a.markdown.includes(a.description.slice(0, 60))) parts.push(a.description)
  if (a.markdown) {
    const max = opts.maxChars ?? 60000
    const body = a.markdown.length > max ? a.markdown.slice(0, max).replace(/\s+\S*$/, '') + '\n\n_(clipped: the article continues on the source page)_' : a.markdown
    parts.push(`## Article\n\n${body}`)
  }
  parts.push(`Source: ${a.canonical || opts.url}`)
  return parts.join('\n\n')
}
