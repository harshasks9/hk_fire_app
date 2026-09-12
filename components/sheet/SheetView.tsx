'use client'
import * as React from 'react'
import { flushSync } from 'react-dom'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { Plus, Trash2, BarChart3, LineChart, PieChart, AreaChart, X, Table2 } from 'lucide-react'
import { evaluateSheet, formatValue, cellKey, colToLetter, parseGrid, isError, gridToTsv, type CellFormat } from '@/lib/sheet/formula'
import { chartDataFromRange, normalizeSheet, type SheetData, type ChartType, type SheetChart } from '@/lib/sheet/model'
import { Chart } from './Chart'
import { cx, uid } from '@/lib/util'

const FORMATS: { id: CellFormat; label: string }[] = [
  { id: 'auto', label: 'Auto' }, { id: 'number', label: '1,234.56' }, { id: 'integer', label: '1,234' }, { id: 'currency', label: '$' }, { id: 'percent', label: '%' }, { id: 'text', label: 'Text' },
]
const CHART_TYPES: { id: ChartType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'bar', label: 'Bar', icon: BarChart3 }, { id: 'line', label: 'Line', icon: LineChart }, { id: 'area', label: 'Area', icon: AreaChart }, { id: 'pie', label: 'Pie', icon: PieChart },
]

/** The editable grid behind the `sheet` block: values, formulas, formats, paste from Excel, charts. */
export function SheetView({ node, updateAttributes, editor, deleteNode, selected }: NodeViewProps) {
  const sheet = React.useMemo(() => normalizeSheet(node.attrs.sheet), [node.attrs.sheet])
  const editable = editor.isEditable
  const [sel, setSel] = React.useState<{ c: number; r: number } | null>(null)
  const [editing, setEditing] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')
  const [barDraft, setBarDraft] = React.useState<string | null>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const { values } = React.useMemo(() => evaluateSheet(sheet.cells), [sheet.cells])

  const commit = React.useCallback((patch: Partial<SheetData>) => updateAttributes({ sheet: { ...sheet, ...patch } }), [sheet, updateAttributes])
  const setCell = (key: string, raw: string) => {
    const cells = { ...sheet.cells }
    if (raw.trim() === '') delete cells[key]
    else cells[key] = raw
    commit({ cells })
  }
  const selKey = sel ? cellKey(sel.c, sel.r) : null
  const move = (dc: number, dr: number) => {
    if (!sel) return
    const c = Math.max(0, Math.min(sheet.cols - 1, sel.c + dc))
    const r = Math.max(0, Math.min(sheet.rows - 1, sel.r + dr))
    setSel({ c, r })
  }
  const startEdit = (key: string, initial?: string) => {
    if (!editable) return
    // Render the input synchronously so the very next keystroke lands in it.
    flushSync(() => {
      setEditing(key)
      setDraft(initial ?? sheet.cells[key] ?? '')
    })
    const el = inputRef.current
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
  }
  const finishEdit = (save: boolean, then?: () => void) => {
    flushSync(() => {
      if (editing && save) setCell(editing, draft)
      setEditing(null)
      then?.()
    })
    gridRef.current?.focus()
  }
  const onKey = (e: React.KeyboardEvent) => {
    if (!sel || editing) return
    if (e.key === 'ArrowDown') { e.preventDefault(); move(0, 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(0, -1) }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1, 0) }
    else if (e.key === 'ArrowRight' || e.key === 'Tab') { e.preventDefault(); move(e.shiftKey ? -1 : 1, 0) }
    else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); startEdit(selKey!) }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); if (editable) setCell(selKey!, '') }
    else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); startEdit(selKey!, e.key) }
  }
  const onPaste = (e: React.ClipboardEvent) => {
    if (!sel || editing || !editable) return
    const text = e.clipboardData.getData('text/plain')
    const grid = parseGrid(text)
    if (!grid.length) return
    e.preventDefault()
    const cells = { ...sheet.cells }
    let rows = sheet.rows, cols = sheet.cols
    grid.forEach((line, ri) => line.forEach((v, ci) => {
      const c = sel.c + ci, r = sel.r + ri
      rows = Math.max(rows, r + 1); cols = Math.max(cols, c + 1)
      const key = cellKey(c, r)
      if (v.trim() === '') delete cells[key]
      else cells[key] = v
    }))
    commit({ cells, rows: Math.min(500, rows), cols: Math.min(52, cols) })
  }
  const onCopy = (e: React.ClipboardEvent) => {
    if (!sel || editing) return
    e.preventDefault()
    e.clipboardData.setData('text/plain', formatValue(values[selKey!] ?? null))
  }
  const copyAll = async () => {
    const rows: string[][] = []
    for (let r = 0; r < sheet.rows; r++) rows.push(Array.from({ length: sheet.cols }, (_, c) => formatValue(values[cellKey(c, r)] ?? null)))
    try { await navigator.clipboard.writeText(gridToTsv(rows)) } catch { /* ignore */ }
  }
  const addChart = (type: ChartType) => {
    const range = sel ? `A1:${cellKey(sheet.cols - 1, sheet.rows - 1)}` : `A1:${cellKey(Math.min(sheet.cols - 1, 2), Math.min(sheet.rows - 1, 6))}`
    commit({ charts: [...(sheet.charts ?? []), { id: uid('ch'), type, range: usedRange() ?? range }] })
  }
  const usedRange = (): string | null => {
    let maxC = -1, maxR = -1
    for (const k of Object.keys(sheet.cells)) { const m = /^([A-Z]+)(\d+)$/.exec(k); if (!m) continue; const c = colToLetterIndex(m[1]!), r = Number(m[2]) - 1; maxC = Math.max(maxC, c); maxR = Math.max(maxR, r) }
    return maxC >= 0 ? `A1:${cellKey(maxC, maxR)}` : null
  }
  const updateChart = (id: string, patch: Partial<SheetChart>) => commit({ charts: (sheet.charts ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) })
  const removeChart = (id: string) => commit({ charts: (sheet.charts ?? []).filter((c) => c.id !== id) })
  const selFormat = sel ? (sheet.formats?.[colToLetter(sel.c)] ?? 'auto') : 'auto'
  const colWidth = 108

  return (
    <NodeViewWrapper className={cx('hkn-sheet my-4 rounded-xl border bg-surface', selected ? 'border-accent' : 'border-border')} data-type="sheet" contentEditable={false}>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-[12.5px]">
        <Table2 className="h-3.5 w-3.5 text-fg-3" />
        <input value={sheet.title ?? ''} onChange={(e) => commit({ title: e.target.value })} placeholder="Sheet title" readOnly={!editable} className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:text-fg-3" />
        {editable ? (
          <>
            <select value={selFormat} disabled={!sel} onChange={(e) => sel && commit({ formats: { ...(sheet.formats ?? {}), [colToLetter(sel.c)]: e.target.value as CellFormat } })} className="h-7 rounded-md border border-border bg-surface px-1.5 text-[12px] disabled:opacity-50" title="Format for the selected column">{FORMATS.map((f) => <option key={f.id} value={f.id}>{sel ? `${colToLetter(sel.c)}: ` : ''}{f.label}</option>)}</select>
            <button className="rounded-md border border-border px-2 py-1 hover:bg-surface-2" onClick={() => commit({ rows: Math.min(500, sheet.rows + 1) })}><Plus className="inline h-3 w-3" /> row</button>
            <button className="rounded-md border border-border px-2 py-1 hover:bg-surface-2" onClick={() => commit({ cols: Math.min(52, sheet.cols + 1) })}><Plus className="inline h-3 w-3" /> col</button>
            <span className="mx-1 h-4 w-px bg-border" />
            {CHART_TYPES.map((t) => <button key={t.id} title={`Add ${t.label.toLowerCase()} chart`} className="rounded-md border border-border p-1 hover:bg-surface-2" onClick={() => addChart(t.id)}><t.icon className="h-3.5 w-3.5" /></button>)}
            <span className="mx-1 h-4 w-px bg-border" />
            <button className="rounded-md px-2 py-1 text-fg-3 hover:bg-surface-2 hover:text-fg" onClick={copyAll} title="Copy values as TSV">Copy</button>
            <button className="rounded-md p-1 text-fg-3 hover:bg-danger/10 hover:text-danger" onClick={() => { if (confirm('Remove this sheet?')) deleteNode() }} title="Remove sheet"><Trash2 className="h-3.5 w-3.5" /></button>
          </>
        ) : null}
      </div>
      {editable ? (
        <div className="flex items-center gap-2 border-b border-border px-3 py-1.5 text-[12.5px]">
          <span className="w-12 shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-center font-mono text-[11.5px] text-fg-2">{selKey ?? '—'}</span>
          <span className="text-fg-3">fx</span>
          <input
            value={barDraft ?? (editing === selKey ? draft : selKey ? (sheet.cells[selKey] ?? '') : '')}
            onFocus={() => selKey && setBarDraft(sheet.cells[selKey] ?? '')}
            onChange={(e) => setBarDraft(e.target.value)}
            onBlur={() => { if (barDraft !== null && selKey) setCell(selKey, barDraft); setBarDraft(null) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { if (barDraft !== null && selKey) setCell(selKey, barDraft); setBarDraft(null); (e.target as HTMLInputElement).blur(); move(0, 1) } if (e.key === 'Escape') { setBarDraft(null); (e.target as HTMLInputElement).blur() } }}
            placeholder={sel ? 'Type a value or =SUM(A1:A5)' : 'Select a cell'}
            disabled={!sel}
            className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] outline-none placeholder:text-fg-3"
          />
          {selKey && isError(values[selKey] ?? null) ? <span className="text-[11.5px] text-danger">{(values[selKey] as { error: string; detail?: string }).error}{(values[selKey] as { detail?: string }).detail ? ` · ${(values[selKey] as { detail?: string }).detail}` : ''}</span> : null}
        </div>
      ) : null}
      <div ref={gridRef} tabIndex={0} onKeyDown={onKey} onPaste={onPaste} onCopy={onCopy} className="overflow-x-auto outline-none" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) { /* keep selection for the formula bar */ } }}>
        <table className="border-collapse text-[13px]" style={{ minWidth: 40 + colWidth * sheet.cols }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 h-7 w-10 border-b border-r border-border bg-surface-2 text-[11px] font-medium text-fg-3"></th>
              {Array.from({ length: sheet.cols }, (_, c) => <th key={c} onClick={() => setSel({ c, r: sel?.r ?? 0 })} className={cx('h-7 border-b border-r border-border bg-surface-2 text-center text-[11px] font-medium text-fg-3', sel?.c === c && 'bg-accent-soft text-accent')} style={{ width: colWidth }}>{colToLetter(c)}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: sheet.rows }, (_, r) => (
              <tr key={r}>
                <td onClick={() => setSel({ c: sel?.c ?? 0, r })} className={cx('sticky left-0 z-10 border-b border-r border-border bg-surface-2 px-1 text-center text-[11px] text-fg-3', sel?.r === r && 'bg-accent-soft text-accent')}>{r + 1}</td>
                {Array.from({ length: sheet.cols }, (_, c) => {
                  const key = cellKey(c, r)
                  const raw = sheet.cells[key]
                  const v = values[key] ?? null
                  const isSel = sel?.c === c && sel?.r === r
                  const fmt = sheet.formats?.[colToLetter(c)] ?? 'auto'
                  const text = formatValue(v, fmt)
                  const numeric = typeof v === 'number'
                  return (
                    <td
                      key={key}
                      onMouseDown={(e) => { if (editing && editing !== key) finishEdit(true); setSel({ c, r }); if (editing !== key) e.preventDefault(); gridRef.current?.focus() }}
                      onDoubleClick={() => startEdit(key)}
                      className={cx('relative h-7 border-b border-r border-border px-1.5 align-middle', isSel && 'z-[1] ring-2 ring-inset ring-accent', numeric ? 'text-right tabular-nums' : 'text-left', isError(v) && 'text-danger', raw?.startsWith('=') && !isError(v) && 'text-accent')}
                      style={{ width: colWidth, maxWidth: colWidth }}
                    >
                      {editing === key ? (
                        <input ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={() => finishEdit(true)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); finishEdit(true, () => move(0, 1)) } else if (e.key === 'Tab') { e.preventDefault(); finishEdit(true, () => move(e.shiftKey ? -1 : 1, 0)) } else if (e.key === 'Escape') { e.preventDefault(); finishEdit(false) } }}
                          className="absolute inset-0 h-full w-full bg-surface px-1.5 font-mono text-[12.5px] outline-none ring-2 ring-inset ring-accent" />
                      ) : (
                        <span className="block truncate" title={raw && raw !== text ? raw : undefined}>{text}</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(sheet.charts ?? []).length ? (
        <div className="grid gap-4 border-t border-border p-3 md:grid-cols-2">
          {(sheet.charts ?? []).map((ch) => (
            <div key={ch.id} className="rounded-lg border border-border p-2.5">
              {editable ? (
                <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <select value={ch.type} onChange={(e) => updateChart(ch.id, { type: e.target.value as ChartType })} className="h-6 rounded-md border border-border bg-surface px-1 text-[12px]">{CHART_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
                  <input value={ch.range} onChange={(e) => updateChart(ch.id, { range: e.target.value.toUpperCase() })} className="h-6 w-24 rounded-md border border-border bg-surface px-1.5 font-mono text-[12px]" placeholder="A1:C6" />
                  <input value={ch.title ?? ''} onChange={(e) => updateChart(ch.id, { title: e.target.value })} className="h-6 min-w-0 flex-1 rounded-md border border-border bg-surface px-1.5 text-[12px]" placeholder="Chart title" />
                  <button onClick={() => removeChart(ch.id)} className="rounded-md p-1 text-fg-3 hover:text-danger" title="Remove chart"><X className="h-3.5 w-3.5" /></button>
                </div>
              ) : null}
              <Chart type={ch.type} data={chartDataFromRange(sheet, ch.range, values)} title={ch.title || undefined} height={220} compact />
            </div>
          ))}
        </div>
      ) : null}
      {editable ? <div className="border-t border-border px-3 py-1 text-[11px] text-fg-3">Type to edit · Enter/Tab to move · paste a block from Excel or Sheets · formulas start with = (SUM, AVERAGE, IF, SUMIF, VLOOKUP, PMT, NPV, IRR…)</div> : null}
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
