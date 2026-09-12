/*
  Markdown ⇄ TipTap document helpers. Used by quick capture, uploads, the seed
  and exports. Covers the subset the editor produces: headings, paragraphs,
  bullet/ordered/task lists, quotes, code blocks, callouts, tables, marks.
*/
export interface PMNode { type: string; attrs?: Record<string, unknown>; content?: PMNode[]; text?: string; marks?: { type: string; attrs?: Record<string, unknown> }[] }

function inline(text: string): PMNode[] {
  const out: PMNode[] = []
  const re = /(\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*\n]+\*|_[^_\n]+_|@[A-Z][\w.-]+(?:\s[A-Z][\w.-]+)?|https?:\/\/[^\s)]+)/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) })
    const tok = m[0]
    if (tok.startsWith('**') || tok.startsWith('__')) out.push({ type: 'text', text: tok.slice(2, -2), marks: [{ type: 'bold' }] })
    else if (tok.startsWith('`')) out.push({ type: 'text', text: tok.slice(1, -1), marks: [{ type: 'code' }] })
    else if (tok.startsWith('[')) {
      const mm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!
      out.push({ type: 'text', text: mm[1]!, marks: [{ type: 'link', attrs: { href: mm[2], target: '_blank' } }] })
    } else if (tok.startsWith('http')) out.push({ type: 'text', text: tok, marks: [{ type: 'link', attrs: { href: tok, target: '_blank' } }] })
    else if (tok.startsWith('@')) out.push({ type: 'text', text: tok })
    else out.push({ type: 'text', text: tok.slice(1, -1), marks: [{ type: 'italic' }] })
    last = m.index + tok.length
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) })
  return out.filter((n) => n.text !== '')
}

function para(text: string): PMNode {
  const t = text.trim()
  return t ? { type: 'paragraph', content: inline(t) } : { type: 'paragraph' }
}

export function markdownToDoc(md: string): PMNode {
  const lines = md.replace(/\r/g, '').split('\n')
  const content: PMNode[] = []
  let i = 0
  const flushList = (kind: 'bullet' | 'ordered' | 'task') => {
    const items: PMNode[] = []
    while (i < lines.length) {
      const l = lines[i]!
      const bullet = l.match(/^\s*[-*•]\s+(?!\[)(.*)$/)
      const ordered = l.match(/^\s*\d+[.)]\s+(.*)$/)
      const task = l.match(/^\s*[-*]\s+\[([ xX])\]\s+(.*)$/)
      if (kind === 'task' && task) items.push({ type: 'taskItem', attrs: { checked: task[1] !== ' ' }, content: [para(task[2]!)] })
      else if (kind === 'bullet' && bullet && !task) items.push({ type: 'listItem', content: [para(bullet[1]!)] })
      else if (kind === 'ordered' && ordered) items.push({ type: 'listItem', content: [para(ordered[1]!)] })
      else break
      i++
    }
    content.push({ type: kind === 'task' ? 'taskList' : kind === 'ordered' ? 'orderedList' : 'bulletList', content: items })
  }
  while (i < lines.length) {
    const line = lines[i]!
    if (!line.trim()) {
      i++
      continue
    }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      content.push({ type: 'heading', attrs: { level: h[1]!.length }, content: inline(h[2]!) })
      i++
      continue
    }
    if (/^```/.test(line)) {
      const buf: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i]!)) buf.push(lines[i++]!)
      i++
      content.push({ type: 'codeBlock', content: [{ type: 'text', text: buf.join('\n') }] })
      continue
    }
    const callout = line.match(/^:::(\w+)?\s*(.*)$/)
    if (callout) {
      const kind = callout[1] || 'info'
      const buf: string[] = callout[2] ? [callout[2]] : []
      i++
      while (i < lines.length && !/^:::/.test(lines[i]!)) buf.push(lines[i++]!)
      i++
      content.push({ type: 'callout', attrs: { kind }, content: buf.filter((b) => b.trim()).map(para) })
      continue
    }
    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      flushList('task')
      continue
    }
    if (/^\s*[-*•]\s+/.test(line)) {
      flushList('bullet')
      continue
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      flushList('ordered')
      continue
    }
    if (/^>\s?/.test(line)) {
      const buf: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i]!)) buf.push(lines[i++]!.replace(/^>\s?/, ''))
      content.push({ type: 'blockquote', content: [para(buf.join(' '))] })
      continue
    }
    if (/^\|/.test(line) && /^\|/.test(lines[i + 1] ?? '')) {
      const rows: string[][] = []
      while (i < lines.length && /^\|/.test(lines[i]!)) {
        const cells = lines[i]!.split('|').slice(1, -1).map((c) => c.trim())
        if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells)
        i++
      }
      content.push({
        type: 'table',
        content: rows.map((r, ri) => ({ type: 'tableRow', content: r.map((c) => ({ type: ri === 0 ? 'tableHeader' : 'tableCell', content: [para(c)] })) })),
      })
      continue
    }
    if (/^---+$/.test(line.trim())) {
      content.push({ type: 'horizontalRule' })
      i++
      continue
    }
    // paragraph: join consecutive plain lines
    const buf: string[] = []
    while (i < lines.length && lines[i]!.trim() && !/^(#{1,3}\s|```|:::|>\s?|\s*[-*•]\s+|\s*\d+[.)]\s+|\||---)/.test(lines[i]!)) buf.push(lines[i++]!)
    content.push(para(buf.join(' ')))
  }
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] }
}

export function docToText(doc: unknown): string {
  const node = doc as PMNode | null | undefined
  if (!node) return ''
  const out: string[] = []
  const walk = (n: PMNode, depth: number) => {
    if (n.type === 'text') {
      out.push(n.text ?? '')
      return
    }
    if (n.type === 'hardBreak') {
      out.push('\n')
      return
    }
    const block = ['paragraph', 'heading', 'listItem', 'taskItem', 'blockquote', 'codeBlock', 'callout', 'tableRow', 'horizontalRule'].includes(n.type)
    if (n.type === 'taskItem') out.push(n.attrs?.checked ? '[x] ' : '[ ] ')
    if (n.type === 'listItem' && depth > 0) out.push('- ')
    if (n.type === 'callout' && n.attrs?.kind === 'decision') out.push('Decision: ')
    if (n.type === 'callout' && n.attrs?.kind === 'ai') out.push('[AI] ')
    for (const c of n.content ?? []) walk(c, depth + 1)
    if (n.type === 'tableCell' || n.type === 'tableHeader') out.push(' | ')
    if (block) out.push('\n')
    if (n.type === 'paragraph' && depth === 1) out.push('\n')
  }
  walk(node, 0)
  return out.join('').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function docToMarkdown(doc: unknown): string {
  const node = doc as PMNode | null | undefined
  if (!node) return ''
  const inlineMd = (nodes: PMNode[] = []): string =>
    nodes
      .map((n) => {
        if (n.type === 'hardBreak') return '\n'
        if (n.type === 'mention') return `@${n.attrs?.label ?? n.attrs?.id ?? ''}`
        let t = n.text ?? ''
        for (const m of n.marks ?? []) {
          if (m.type === 'bold') t = `**${t}**`
          if (m.type === 'italic') t = `_${t}_`
          if (m.type === 'code') t = `\`${t}\``
          if (m.type === 'link') t = `[${t}](${m.attrs?.href ?? ''})`
        }
        return t
      })
      .join('')
  const block = (n: PMNode, indent = ''): string => {
    switch (n.type) {
      case 'heading':
        return `${'#'.repeat(Number(n.attrs?.level ?? 1))} ${inlineMd(n.content)}\n\n`
      case 'paragraph':
        return `${indent}${inlineMd(n.content)}\n\n`
      case 'bulletList':
        return (n.content ?? []).map((li) => `${indent}- ${(li.content ?? []).map((c) => block(c, indent + '  ')).join('').trim()}\n`).join('') + '\n'
      case 'orderedList':
        return (n.content ?? []).map((li, i) => `${indent}${i + 1}. ${(li.content ?? []).map((c) => block(c, indent + '   ')).join('').trim()}\n`).join('') + '\n'
      case 'taskList':
        return (n.content ?? []).map((li) => `${indent}- [${li.attrs?.checked ? 'x' : ' '}] ${(li.content ?? []).map((c) => block(c, indent + '  ')).join('').trim()}\n`).join('') + '\n'
      case 'blockquote':
        return (n.content ?? []).map((c) => `> ${block(c).trim()}\n`).join('') + '\n'
      case 'codeBlock':
        return `\`\`\`\n${inlineMd(n.content)}\n\`\`\`\n\n`
      case 'callout':
        return `:::${n.attrs?.kind ?? 'info'}\n${(n.content ?? []).map((c) => block(c)).join('')}:::\n\n`
      case 'table':
        return (
          (n.content ?? [])
            .map((row, ri) => {
              const cells = (row.content ?? []).map((c) => (c.content ?? []).map((p) => inlineMd(p.content)).join(' '))
              const line = `| ${cells.join(' | ')} |`
              return ri === 0 ? `${line}\n| ${cells.map(() => '---').join(' | ')} |` : line
            })
            .join('\n') + '\n\n'
        )
      case 'horizontalRule':
        return '---\n\n'
      case 'image':
        return `![${n.attrs?.alt ?? ''}](${n.attrs?.src ?? ''})\n\n`
      default:
        return (n.content ?? []).map((c) => block(c, indent)).join('')
    }
  }
  return (node.content ?? []).map((c) => block(c)).join('').trim() + '\n'
}
