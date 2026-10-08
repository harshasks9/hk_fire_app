import { describe, it, expect } from 'vitest'
import { extractNoteLinks, resolveLinksInDoc, linkExcerpts, findMentionOffsets, mentionExcerpt, linkMentionInDoc } from '../lib/links'
import { markdownToDoc, docToMarkdown, docToText, noteLinkNode, type PMNode } from '../lib/markdown'
import { docToHtml } from '../lib/export/html'

const doc = (...blocks: PMNode[]): PMNode => ({ type: 'doc', content: blocks })
const p = (...inline: PMNode[]): PMNode => ({ type: 'paragraph', content: inline })
const t = (text: string): PMNode => ({ type: 'text', text })

describe('note links: document helpers', () => {
  it('parses [[Title]] from Markdown and writes it back', () => {
    const d = markdownToDoc('See [[Q4 plan]] and the [[Samsung deal]] before **Friday**.\n\n- item with [[Nested link]]')
    const links = extractNoteLinks(d)
    expect(links.map((l) => l.label)).toEqual(['Q4 plan', 'Samsung deal', 'Nested link'])
    expect(links.every((l) => l.id === null)).toBe(true)
    expect(docToMarkdown(d)).toBe('See [[Q4 plan]] and the [[Samsung deal]] before **Friday**.\n\n- item with [[Nested link]]\n')
    expect(docToText(d)).toContain('See Q4 plan and the Samsung deal')
  })
  it('leaves ordinary links and brackets alone', () => {
    const d = markdownToDoc('A [site](https://a.example.com) and [not a link] and a [ ] box')
    expect(extractNoteLinks(d)).toEqual([])
    expect(docToMarkdown(d)).toContain('[site](https://a.example.com)')
  })
  it('resolves unresolved links by label and leaves the document untouched otherwise', () => {
    const d = doc(p(t('See '), noteLinkNode('Q4 plan'), t(' and '), noteLinkNode('Known', 'note_1')))
    const r = resolveLinksInDoc(d, (label) => (label === 'Q4 plan' ? 'note_9' : null))
    expect(r.changed).toBe(true)
    expect(extractNoteLinks(r.doc)).toEqual([{ id: 'note_9', label: 'Q4 plan' }, { id: 'note_1', label: 'Known' }])
    const same = resolveLinksInDoc(d, () => null)
    expect(same.changed).toBe(false)
    expect(same.doc).toBe(d)
  })
  it('quotes the block that carries a link (backlink excerpt)', () => {
    const d = doc({ type: 'heading', attrs: { level: 2 }, content: [t('Context')] }, p(t('Agreed in '), noteLinkNode('Kickoff', 'note_k'), t(' to ship by March.')), p(t('Unrelated paragraph.')))
    expect(linkExcerpts(d, 'note_k')).toEqual(['Agreed in Kickoff to ship by March.'])
    expect(linkExcerpts(d, 'note_zzz')).toEqual([])
  })
  it('finds whole-word, case-insensitive mentions', () => {
    expect(findMentionOffsets('The Q4 plan is the q4 PLAN; Q4 planning is not.', 'Q4 plan').map((o) => o.start)).toEqual([4, 19])
    expect(findMentionOffsets('Samsung deal', 'Samsung deals')).toEqual([])
    expect(findMentionOffsets('short', 'ab')).toEqual([])
    expect(mentionExcerpt('x'.repeat(200) + ' The Q4 plan matters. ' + 'y'.repeat(200), 'Q4 plan', 20)).toBe('…xxxxxxxxxxxxxxx The Q4 plan matters. yyyyyyyyyy…')
  })
  it('turns the first plain-text mention into a link, skipping existing links and code', () => {
    const d = doc(
      { type: 'codeBlock', content: [t('Q4 plan in code')] },
      p(t('The '), { type: 'text', text: 'Q4 plan', marks: [{ type: 'link', attrs: { href: 'https://x' } }] }, t(' page')),
      p(t('Read the Q4 plan, then the Q4 plan again.')),
    )
    const r = linkMentionInDoc(d, 'Q4 plan', { id: 'note_9' })
    expect(r.replaced).toBe(true)
    const para = (r.doc as PMNode).content![2]!
    expect(para.content!.map((n) => n.type)).toEqual(['text', 'noteLink', 'text'])
    expect(para.content![1]!.attrs).toEqual({ id: 'note_9', label: 'Q4 plan' })
    expect(para.content![2]!.text).toBe(', then the Q4 plan again.')
    expect((r.doc as PMNode).content![1]).toBe(d.content![1]) // untouched block keeps identity
    expect(linkMentionInDoc(d, 'Nothing here', { id: 'x' }).replaced).toBe(false)
  })
  it('renders as a labelled span in HTML export', () => {
    const html = docToHtml(doc(p(t('See '), noteLinkNode('Q4 <plan>', 'note_9'))), {})
    expect(html).toContain('<span class="note-link" data-note-id="note_9">Q4 &lt;plan&gt;</span>')
  })
})
