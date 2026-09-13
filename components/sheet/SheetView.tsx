'use client'
import * as React from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { evaluateSheet, formatValue, cellKey, colToLetter, isError } from '@/lib/sheet/formula'
import { chartDataFromRange, normalizeSheet, type SheetData } from '@/lib/sheet/model'
import { Chart } from './Chart'
import { SheetEditor } from './SheetEditor'
import { cx } from '@/lib/util'

/** The `sheet` block inside a note: the grid editor, wired to the node's attributes. */
export function SheetView({ node, updateAttributes, editor, deleteNode, selected, getPos }: NodeViewProps) {
  const sheet = React.useMemo(() => normalizeSheet(node.attrs.sheet), [node.attrs.sheet])
  const onChange = React.useCallback((next: SheetData) => updateAttributes({ sheet: next }), [updateAttributes])
  const onExit = React.useCallback((dir: 'up' | 'down') => {
    const pos = typeof getPos === 'function' ? getPos() : null
    if (pos === null || pos === undefined) return
    const target = dir === 'up' ? Math.max(0, pos - 1) : pos + node.nodeSize
    editor.chain().focus().setTextSelection(Math.min(target, editor.state.doc.content.size)).run()
  }, [editor, getPos, node.nodeSize])
  return (
    <NodeViewWrapper className="hkn-sheet my-4" data-type="sheet" contentEditable={false}>
      <SheetEditor sheet={sheet} onChange={onChange} readOnly={!editor.isEditable} onRemove={deleteNode} onExit={onExit} selected={selected} />
    </NodeViewWrapper>
  )
}

function colToLetterIndex(letters: string): number {
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

/** Read-only rendering (share pages, previews). */
export function SheetStatic({ data }: { data: unknown }) {
  const sheet = normalizeSheet(data)
  const { values } = evaluateSheet(sheet.cells)
  let maxC = 0, maxR = 0
  for (const k of Object.keys(sheet.cells)) { const m = /^([A-Z]+)(\d+)$/.exec(k); if (!m) continue; maxC = Math.max(maxC, colToLetterIndex(m[1]!)); maxR = Math.max(maxR, Number(m[2]) - 1) }
  return (
    <div className="hkn-sheet my-4 rounded-xl border border-border bg-surface">
      {sheet.title ? <div className="border-b border-border px-3 py-2 text-[12.5px] font-medium">{sheet.title}</div> : null}
      <div className="overflow-x-auto">
        <table className="border-collapse text-[13px]">
          <tbody>
            {Array.from({ length: Math.min(sheet.rows, maxR + 1) }, (_, r) => (
              <tr key={r}>
                {Array.from({ length: Math.min(sheet.cols, maxC + 1) }, (_, c) => {
                  const v = values[cellKey(c, r)] ?? null
                  return <td key={c} className={cx('h-7 border-b border-r border-border px-1.5', typeof v === 'number' ? 'text-right tabular-nums' : 'text-left', isError(v) && 'text-danger')} style={{ minWidth: 90 }}>{formatValue(v, sheet.formats?.[colToLetter(c)] ?? 'auto')}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(sheet.charts ?? []).length ? <div className="grid gap-4 border-t border-border p-3 md:grid-cols-2">{(sheet.charts ?? []).map((ch) => <Chart key={ch.id} type={ch.type} data={chartDataFromRange(sheet, ch.range, values)} title={ch.title || undefined} height={220} compact />)}</div> : null}
    </div>
  )
}
