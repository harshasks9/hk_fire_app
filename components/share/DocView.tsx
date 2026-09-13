import * as React from 'react'
import type { PMNode } from '@/lib/markdown'
import { SheetStatic } from '@/components/sheet/SheetView'

type Base = string | undefined

/** Read-only renderer for editor JSON, used by public share pages. Mirrors the editor's prose styling. `assetBase` rewrites attachment URLs so a public viewer can load them. */
export function DocView({ doc, assetBase }: { doc: PMNode; assetBase?: string }) {
  return <div className="editor-prose share-prose">{(doc.content ?? []).map((n, i) => <Block key={i} node={n} base={assetBase} />)}</div>
}

function rewrite(src: string, base: Base): string {
  const m = /^\/api\/attachments\/([^/?#]+)/.exec(src)
  return base && m ? `${base}/${m[1]}` : src
}

function Inline({ nodes, base }: { nodes?: PMNode[]; base: Base }) {
  return <>{(nodes ?? []).map((n, i) => <InlineNode key={i} node={n} base={base} />)}</>
}

function InlineNode({ node, base }: { node: PMNode; base: Base }) {
  if (node.type === 'hardBreak') return <br />
  if (node.type === 'mention') return <span className="mention">@{String(node.attrs?.label ?? node.attrs?.id ?? '')}</span>
  if (node.type === 'image') return <img src={rewrite(String(node.attrs?.src ?? ''), base)} alt={String(node.attrs?.alt ?? '')} className="max-w-full rounded-lg" />
  if (node.type !== 'text') return null
  let el: React.ReactNode = node.text ?? ''
  for (const m of node.marks ?? []) {
    if (m.type === 'bold') el = <strong>{el}</strong>
    else if (m.type === 'italic') el = <em>{el}</em>
    else if (m.type === 'code') el = <code>{el}</code>
    else if (m.type === 'strike') el = <s>{el}</s>
    else if (m.type === 'underline') el = <u>{el}</u>
    else if (m.type === 'link') el = <a href={rewrite(String(m.attrs?.href ?? '#'), base)} target="_blank" rel="noopener noreferrer">{el}</a>
    else if (m.type === 'highlight') el = <mark>{el}</mark>
  }
  return <>{el}</>
}

function Block({ node, base }: { node: PMNode; base: Base }) {
  const kids = (node.content ?? []).map((n, i) => <Block key={i} node={n} base={base} />)
  switch (node.type) {
    case 'paragraph': return <p><Inline nodes={node.content} base={base} /></p>
    case 'heading': {
      const level = Math.min(3, Math.max(1, Number(node.attrs?.level ?? 2)))
      const Tag = (`h${level}`) as 'h1' | 'h2' | 'h3'
      return <Tag><Inline nodes={node.content} base={base} /></Tag>
    }
    case 'bulletList': return <ul>{kids}</ul>
    case 'orderedList': return <ol>{kids}</ol>
    case 'listItem': return <li>{kids}</li>
    case 'taskList': return <ul data-type="taskList">{kids}</ul>
    case 'taskItem': return <li data-type="taskItem" data-checked={String(Boolean(node.attrs?.checked))}><label><input type="checkbox" checked={Boolean(node.attrs?.checked)} readOnly /></label><div>{kids}</div></li>
    case 'blockquote': return <blockquote>{kids}</blockquote>
    case 'codeBlock': return <pre><code>{(node.content ?? []).map((n) => n.text ?? '').join('')}</code></pre>
    case 'horizontalRule': return <hr />
    case 'image': return <img src={rewrite(String(node.attrs?.src ?? ''), base)} alt={String(node.attrs?.alt ?? '')} className="max-w-full rounded-lg" />
    case 'table': return <div className="overflow-x-auto"><table><tbody>{kids}</tbody></table></div>
    case 'tableRow': return <tr>{kids}</tr>
    case 'tableHeader': return <th>{kids}</th>
    case 'tableCell': return <td>{kids}</td>
    case 'callout': return <div className="callout" data-kind={String(node.attrs?.kind ?? 'info')}>{kids}</div>
    case 'sheet': return <SheetStatic data={node.attrs?.sheet} />
    default: return node.content ? <div>{kids}</div> : <p><Inline nodes={[node]} base={base} /></p>
  }
}
