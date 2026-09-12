import * as React from 'react'
import type { PMNode } from '@/lib/markdown'

/** Read-only renderer for editor JSON, used by public share pages. Mirrors the editor's prose styling. */
export function DocView({ doc }: { doc: PMNode }) {
  return <div className="editor-prose share-prose">{(doc.content ?? []).map((n, i) => <Block key={i} node={n} />)}</div>
}

function Inline({ nodes }: { nodes?: PMNode[] }) {
  return <>{(nodes ?? []).map((n, i) => <InlineNode key={i} node={n} />)}</>
}

function InlineNode({ node }: { node: PMNode }) {
  if (node.type === 'hardBreak') return <br />
  if (node.type === 'mention') return <span className="mention">@{String(node.attrs?.label ?? node.attrs?.id ?? '')}</span>
  if (node.type === 'image') return <img src={String(node.attrs?.src ?? '')} alt={String(node.attrs?.alt ?? '')} className="max-w-full rounded-lg" />
  if (node.type !== 'text') return null
  let el: React.ReactNode = node.text ?? ''
  for (const m of node.marks ?? []) {
    if (m.type === 'bold') el = <strong>{el}</strong>
    else if (m.type === 'italic') el = <em>{el}</em>
    else if (m.type === 'code') el = <code>{el}</code>
    else if (m.type === 'strike') el = <s>{el}</s>
    else if (m.type === 'underline') el = <u>{el}</u>
    else if (m.type === 'link') el = <a href={String(m.attrs?.href ?? '#')} target="_blank" rel="noopener noreferrer">{el}</a>
    else if (m.type === 'highlight') el = <mark>{el}</mark>
  }
  return <>{el}</>
}

function Block({ node }: { node: PMNode }) {
  const kids = (node.content ?? []).map((n, i) => <Block key={i} node={n} />)
  switch (node.type) {
    case 'paragraph': return <p><Inline nodes={node.content} /></p>
    case 'heading': {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 2)))
      const Tag = (`h${level}`) as 'h1' | 'h2' | 'h3'
      return <Tag><Inline nodes={node.content} /></Tag>
    }
    case 'bulletList': return <ul>{kids}</ul>
    case 'orderedList': return <ol>{kids}</ol>
    case 'listItem': return <li>{kids}</li>
    case 'taskList': return <ul data-type="taskList">{kids}</ul>
    case 'taskItem': return <li data-type="taskItem" data-checked={String(Boolean(node.attrs?.checked))}><label><input type="checkbox" checked={Boolean(node.attrs?.checked)} readOnly /></label><div>{kids}</div></li>
    case 'blockquote': return <blockquote>{kids}</blockquote>
    case 'codeBlock': return <pre><code>{(node.content ?? []).map((n) => n.text ?? '').join('')}</code></pre>
    case 'horizontalRule': return <hr />
    case 'image': return <img src={String(node.attrs?.src ?? '')} alt={String(node.attrs?.alt ?? '')} className="max-w-full rounded-lg" />
    case 'table': return <div className="overflow-x-auto"><table><tbody>{kids}</tbody></table></div>
    case 'tableRow': return <tr>{kids}</tr>
    case 'tableHeader': return <th>{kids}</th>
    case 'tableCell': return <td>{kids}</td>
    case 'callout': return <div className="callout" data-kind={String(node.attrs?.kind ?? 'info')}>{kids}</div>
    default: return node.content ? <div>{kids}</div> : <p><Inline nodes={[node]} /></p>
  }
}
