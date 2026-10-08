import { describe, it, expect } from 'vitest'
import { extractArticle, articleMeta, parseShare, clipMarkdown, absolutizeUrls } from '../lib/clip/article'
import { isFetchableUrl } from '../lib/clip'
import { bookmarkletCode } from '../components/settings/ClipperSection'

const PAGE = `<!doctype html><html><head>
<title>Samsung asks for a 3% buffer | The Daily Supply</title>
<meta property="og:title" content="Samsung asks for a 3% buffer">
<meta property="og:site_name" content="The Daily Supply">
<meta name="author" content="Jane Q. Reporter">
<meta property="article:published_time" content="2026-09-18T09:30:00Z">
<meta name="description" content="Suppliers are being asked to absorb volatility.">
<meta property="og:image" content="/img/hero.jpg">
<link rel="canonical" href="https://daily.example.com/news/samsung-buffer">
</head><body>
<header><nav><a href="/">Home</a> <a href="/news">News</a> <a href="/markets">Markets</a></nav></header>
<div class="sidebar"><ul><li><a href="/a">Most read one</a></li><li><a href="/b">Most read two, a long teaser with commas, commas, commas</a></li></ul></div>
<article>
<h1>Samsung asks for a 3% buffer</h1>
<p>Samsung has asked its component suppliers for an additional <strong>3% buffer</strong> on committed volumes, three people familiar with the talks said on Thursday, citing demand swings in the memory market.</p>
<p>The request, first raised in <a href="/news/earlier">August</a>, would shift inventory risk to suppliers. "Everyone is being asked to carry more," one executive said, adding that pricing had not been discussed.</p>
<h2>What happens next</h2>
<ul><li>Suppliers respond by <em>October 1</em></li><li>A follow-up meeting is planned in Suwon</li></ul>
<table><tr><th>Quarter</th><th>Buffer</th></tr><tr><td>Q3</td><td>2%</td></tr><tr><td>Q4</td><td>3%</td></tr></table>
<div class="share-tools"><a href="#">Share on X</a> <a href="#">Share on LinkedIn</a></div>
<div class="comments"><p>First! Great article, thanks for sharing this, really insightful, love it.</p></div>
</article>
<footer><p>© 2026 The Daily Supply. All rights reserved. Terms. Privacy. Contact us at hello@example.com.</p></footer>
<script>window.track({ a: 1 })</script>
</body></html>`

describe('web clipper: article extraction', () => {
  it('reads the headline, byline, date, site, description, image and canonical URL', () => {
    const m = articleMeta(PAGE, 'https://daily.example.com/news/samsung-buffer?utm=1')
    expect(m.title).toBe('Samsung asks for a 3% buffer')
    expect(m.siteName).toBe('The Daily Supply')
    expect(m.author).toBe('Jane Q. Reporter')
    expect(m.published).toBe('2026-09-18T09:30:00.000Z')
    expect(m.description).toBe('Suppliers are being asked to absorb volatility.')
    expect(m.image).toBe('https://daily.example.com/img/hero.jpg')
    expect(m.canonical).toBe('https://daily.example.com/news/samsung-buffer')
  })
  it('keeps the article and drops navigation, sidebar, sharing, comments, footer and scripts', () => {
    const a = extractArticle(PAGE, 'https://daily.example.com/news/samsung-buffer')
    expect(a.method).toBe('article')
    expect(a.markdown).toContain('**3% buffer**')
    expect(a.markdown).toContain('## What happens next')
    expect(a.markdown).toContain('- Suppliers respond by _October 1_')
    expect(a.markdown).toContain('| Quarter | Buffer |')
    expect(a.markdown).toContain('[August](https://daily.example.com/news/earlier)')
    expect(a.markdown).not.toContain('Most read')
    expect(a.markdown).not.toContain('Share on X')
    expect(a.markdown).not.toContain('First! Great article')
    expect(a.markdown).not.toContain('All rights reserved')
    expect(a.markdown).not.toContain('window.track')
    expect(a.markdown.startsWith('# Samsung')).toBe(false) // the headline is the note title, not repeated
    expect(a.wordCount).toBeGreaterThan(50)
  })
  it('falls back to the densest block when there is no <article>', () => {
    const html = `<html><head><title>Plain page</title></head><body><div id="wrap"><div class="menu"><a href="/1">One</a><a href="/2">Two</a><a href="/3">Three</a></div><div class="content"><p>${'A sentence with a comma, and another clause, and more words to make it long enough to count as text. '.repeat(6)}</p><p>${'Second paragraph, with detail, and numbers like 42%. '.repeat(4)}</p></div><div class="footer-links"><a href="/x">X</a><a href="/y">Y</a></div></div></body></html>`
    const a = extractArticle(html, 'https://x.example.com/p')
    expect(['density', 'page']).toContain(a.method)
    expect(a.markdown).toContain('Second paragraph')
    expect(a.title).toBe('Plain page')
  })
  it('returns an empty body for a page with nothing readable', () => {
    const a = extractArticle('<html><head><title>Login</title></head><body><form><input></form></body></html>', 'https://x.example.com/login')
    expect(a.method).toBe('none')
    expect(a.wordCount).toBe(0)
    expect(a.title).toBe('Login')
  })
  it('makes relative links and images absolute', () => {
    expect(absolutizeUrls('<a href="/a/b">x</a> <img src="img/c.png"> <a href="https://other.example.com/">y</a> <a href="#top">z</a>', 'https://site.example.com/news/story')).toBe('<a href="https://site.example.com/a/b">x</a> <img src="https://site.example.com/news/img/c.png"> <a href="https://other.example.com/">y</a> <a href="#top">z</a>')
  })
})

describe('web clipper: share sheet and body', () => {
  it('finds the URL wherever the share sheet put it', () => {
    expect(parseShare({ url: 'https://a.example.com/x', title: 'A', text: '' })).toEqual({ url: 'https://a.example.com/x', title: 'A', text: '' })
    expect(parseShare({ url: '', title: 'Look at this', text: 'Look at this https://a.example.com/y' })).toEqual({ url: 'https://a.example.com/y', title: 'Look at this', text: 'Look at this' })
    expect(parseShare({ url: 'https://a.example.com/z', title: 'https://a.example.com/z', text: 'https://a.example.com/z' })).toEqual({ url: 'https://a.example.com/z', title: '', text: '' })
    expect(parseShare({ text: 'no link here' }).url).toBeNull()
    expect(parseShare({ url: 'javascript:alert(1)', text: '' }).url).toBeNull()
  })
  it('composes byline, comment, selection, article and source', () => {
    const a = extractArticle(PAGE, 'https://daily.example.com/news/samsung-buffer')
    const md = clipMarkdown(a, { url: 'https://daily.example.com/news/samsung-buffer?utm=1', comment: 'Relevant to the Q4 commit.', selection: 'Everyone is being asked to carry more' })
    const lines = md.split('\n')
    expect(lines[0]).toBe('_By Jane Q. Reporter · Sep 18, 2026 · The Daily Supply_')
    expect(md).toContain('\n\nRelevant to the Q4 commit.\n\n')
    expect(md).toContain('> Everyone is being asked to carry more')
    expect(md).toContain('## Article')
    expect(md.trim().endsWith('Source: https://daily.example.com/news/samsung-buffer')).toBe(true)
  })
  it('caps very long articles and says so', () => {
    const a = { ...extractArticle(PAGE, 'https://daily.example.com/x'), markdown: 'word '.repeat(5000), description: '' }
    const md = clipMarkdown(a, { url: 'https://daily.example.com/x', maxChars: 1000 })
    expect(md.length).toBeLessThan(1400)
    expect(md).toContain('the article continues on the source page')
  })
  it('refuses private and non-web addresses', () => {
    expect(isFetchableUrl('https://example.com/a')).toBe(true)
    expect(isFetchableUrl('http://localhost:3000/')).toBe(false)
    expect(isFetchableUrl('http://127.0.0.1/')).toBe(false)
    expect(isFetchableUrl('http://10.1.2.3/')).toBe(false)
    expect(isFetchableUrl('http://172.16.0.9/')).toBe(false)
    expect(isFetchableUrl('http://192.168.1.1/')).toBe(false)
    expect(isFetchableUrl('http://169.254.169.254/latest/meta-data')).toBe(false)
    expect(isFetchableUrl('http://[::1]/')).toBe(false)
    expect(isFetchableUrl('ftp://example.com/')).toBe(false)
    expect(isFetchableUrl('not a url')).toBe(false)
  })
  it('builds a bookmarklet that opens /clip with the page and selection', () => {
    const code = bookmarkletCode('https://notes.example.com')
    expect(code.startsWith('javascript:')).toBe(true)
    expect(code).toContain("'https://notes.example.com/clip?'")
    expect(code).toContain('getSelection')
    expect(code).toContain('popup=1')
  })
})
