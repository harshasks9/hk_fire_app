'use client'
/*
  The spreadsheet grid. Self-contained: selection, keyboard, clipboard, undo,
  fill handle, row/column structure, resizing, formats, charts, fullscreen.
  It owns every event inside it, so the note editor around it never sees them.
*/
import * as React from 'react'
import { createPortal, flushSync } from 'react-dom'
import { Plus, Trash2, BarChart3, LineChart, PieChart, AreaChart, X, Table2, Maximize2, Minimize2, Undo2, Redo2, ChevronDown, Rows3, Columns3, Eraser, ArrowDownAZ, ArrowUpAZ, Copy, Scissors, ClipboardPaste, Sigma } from 'lucide-react'
import { evaluateSheet, formatValue, cellKey, colToLetter, parseGrid, isError, gridToTsv, type CellFormat, type CellValue } from '@/lib/sheet/formula'
import { chartDataFromRange, type SheetData, type ChartType, type SheetChart } from '@/lib/sheet/model'
import { rectOf, rectToA1, inRect, rectWidth, rectHeight, usedRect, insertRows, deleteRows, insertCols, deleteCols, clearRect, readRect, displayRect, writeGrid, tileGrid, fillRect, fillTarget, sortRect, setColumnFormat, MAX_ROWS, MAX_COLS, type Pos, type Rect } from '@/lib/sheet/grid'
import { Chart } from './Chart'
import { cx, uid } from '@/lib/util'

const FORMATS: { id: CellFormat; label: string }[] = [
  { id: 'auto', label: 'Auto' }, { id: 'number', label: '1,234.56' }, { id: 'integer', label: '1,234' }, { id: 'currency', label: '$ Currency' }, { id: 'percent', label: '% Percent' }, { id: 'text', label: 'Text' },
]
const CHART_TYPES: { id: ChartType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'bar', label: 'Bar', icon: BarChart3 }, { id: 'line', label: 'Line', icon: LineChart }, { id: 'area', label: 'Area', icon: AreaChart }, { id: 'pie', label: 'Pie', icon: PieChart },
]
const DEFAULT_W = 112
const MIN_W = 44
const ROW_H = 28
const HEAD_W = 44

type Drag =
  | { kind: 'select' }
  | { kind: 'cols'; start: number }
  | { kind: 'rows'; start: number }
  | { kind: 'fill' }
  | { kind: 'ref'; start: Pos }
  | { kind: 'resize'; c: number; x: number; w: number }

export interface SheetEditorProps {
  sheet: SheetData
  onChange: (next: SheetData) => void
  readOnly?: boolean
  /** Remove the whole block. */
  onRemove?: () => void
  /** Arrow past the top or bottom edge: hand focus back to the surrounding document. */
  onExit?: (dir: 'up' | 'down') => void
  selected?: boolean
}

export function SheetEditor({ sheet, onChange, readOnly = false, onRemove, onExit, selected }: SheetEditorProps) {
  const { values } = React.useMemo(() => evaluateSheet(sheet.cells), [sheet.cells])
  const [sel, setSel] = React.useState<{ anchor: Pos; focus: Pos } | null>(null)
  const [edit, setEdit] = React.useState<{ key: string; draft: string; where: 'cell' | 'bar' } | null>(null)
  const [full, setFull] = React.useState(false)
  const [menu, setMenu] = React.useState<{ x: number; y: number } | null>(null)
  const [fillPreview, setFillPreview] = React.useState<Rect | null>(null)
  const [resizing, setResizing] = React.useState<{ c: number; w: number } | null>(null)
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const history = React.useRef<{ past: SheetData[]; future: SheetData[] }>({ past: [], future: [] })
  const clip = React.useRef<{ text: string; grid: string[][]; from: Pos } | null>(null)
  const drag = React.useRef<Drag | null>(null)
  const caret = React.useRef<{ start: number; end: number }>({ start: 0, end: 0 })
  const refInsert = React.useRef<{ start: number; end: number } | null>(null)
  const gridRef = React.useRef<HTMLDivElement>(null)
  const cellInputRef = React.useRef<HTMLInputElement>(null)
  const barInputRef = React.useRef<HTMLInputElement>(null)

  const rect = sel ? rectOf(sel.anchor, sel.focus) : null
  const active = sel?.anchor ?? null
  const activeKey = active ? cellKey(active.c, active.r) : null
  const activeRaw = activeKey ? (sheet.cells[activeKey] ?? '') : ''
  const multi = rect ? rectWidth(rect) > 1 || rectHeight(rect) > 1 : false

  // The latest state, for the document-level mouse handlers registered once.
  const latest = React.useRef({ sheet, rect, sel, fillPreview, edit, values, resizing })
  latest.current = { sheet, rect, sel, fillPreview, edit, values, resizing }

  /* ---------------------------------------------------------- committing */
  const commit = React.useCallback((next: SheetData, opts: { history?: boolean } = {}) => {
    const cur = latest.current.sheet
    if (next === cur) return
    if (opts.history !== false) {
      history.current.past.push(cur)
      if (history.current.past.length > 200) history.current.past.shift()
      history.current.future = []
    }
    onChange(next)
  }, [onChange])
  const undo = () => { const prev = history.current.past.pop(); if (!prev) return; history.current.future.push(latest.current.sheet); onChange(prev) }
  const redo = () => { const next = history.current.future.pop(); if (!next) return; history.current.past.push(latest.current.sheet); onChange(next) }
  const setCell = (key: string, raw: string) => {
    const cur = latest.current.sheet
    if ((cur.cells[key] ?? '') === raw) return
    const cells = { ...cur.cells }
    if (raw.trim() === '') delete cells[key]; else cells[key] = raw
    commit({ ...cur, cells })
  }

  /* ---------------------------------------------------------- selection */
  const clampPos = (p: Pos, s: SheetData = latest.current.sheet): Pos => ({ c: Math.max(0, Math.min(s.cols - 1, p.c)), r: Math.max(0, Math.min(s.rows - 1, p.r)) })
  const select = (a: Pos, b: Pos = a) => setSel({ anchor: clampPos(a), focus: clampPos(b) })
  const focusGrid = () => gridRef.current?.focus({ preventScroll: true })
  React.useEffect(() => {
    if (!activeKey) return
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-key="${activeKey}"]`)
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeKey])
  React.useEffect(() => { if (mounted) focusGrid() }, [full, mounted])

  /* ---------------------------------------------------------- editing */
  const startEdit = (key: string, initial?: string, where: 'cell' | 'bar' = 'cell') => {
    if (readOnly) return
    // Render the input synchronously so the very next keystroke lands in it.
    flushSync(() => setEdit({ key, draft: initial ?? latest.current.sheet.cells[key] ?? '', where }))
    refInsert.current = null
    const el = where === 'bar' ? barInputRef.current : cellInputRef.current
    if (el && where === 'cell') { el.focus(); const n = el.value.length; el.setSelectionRange(n, n); caret.current = { start: n, end: n } }
  }
  const finishEdit = (save: boolean, then?: () => void) => {
    const e = latest.current.edit
    flushSync(() => setEdit(null))
    refInsert.current = null
    if (e && save) setCell(e.key, e.draft)
    then?.()
    focusGrid()
  }
  const formulaMode = !!edit && edit.draft.startsWith('=') && (() => {
    if (refInsert.current) return true
    const before = edit.draft.slice(0, caret.current.start).trimEnd()
    return /[=(+\-*/^&,<>:]$/.test(before)
  })()
  const insertRef = (text: string) => {
    const e = latest.current.edit
    if (!e) return
    const at = refInsert.current ?? caret.current
    const draft = e.draft.slice(0, at.start) + text + e.draft.slice(at.end)
    refInsert.current = { start: at.start, end: at.start + text.length }
    setEdit({ ...e, draft })
    requestAnimationFrame(() => {
      const el = e.where === 'bar' ? barInputRef.current : cellInputRef.current
      if (!el) return
      el.focus(); const n = at.start + text.length; el.setSelectionRange(n, n); caret.current = { start: n, end: n }
    })
  }
  const trackCaret = (el: HTMLInputElement) => { caret.current = { start: el.selectionStart ?? el.value.length, end: el.selectionEnd ?? el.value.length } }

  /* ---------------------------------------------------------- movement */
  const move = (dc: number, dr: number, extend = false) => {
    const s = latest.current.sel
    if (!s) return select({ c: 0, r: 0 })
    const base = extend ? s.focus : s.anchor
    const np = clampPos({ c: base.c + dc, r: base.r + dr })
    if (extend) return setSel({ anchor: s.anchor, focus: np })
    if (np.c === base.c && np.r === base.r) { if (dr < 0 && onExit) onExit('up'); else if (dr > 0 && onExit) onExit('down'); return }
    select(np)
  }
  /** Enter/Tab step: past the last row or column the sheet grows by one. */
  const step = (dc: number, dr: number) => {
    const s = latest.current.sel; const cur = latest.current.sheet
    if (!s) return
    const p = { c: s.anchor.c + dc, r: s.anchor.r + dr }
    if (p.c < 0 || p.r < 0) return select(clampPos(p))
    if (!readOnly && (p.r >= cur.rows || p.c >= cur.cols) && p.r < MAX_ROWS && p.c < MAX_COLS) {
      commit({ ...cur, rows: Math.max(cur.rows, p.r + 1), cols: Math.max(cur.cols, p.c + 1) })
      return setSel({ anchor: p, focus: p })
    }
    select(clampPos(p))
  }

  /* ---------------------------------------------------------- structure */
  const withRect = (fn: (r: Rect, s: SheetData) => SheetData) => { const r = latest.current.rect; if (!r || readOnly) return; commit(fn(r, latest.current.sheet)) }
  const act = {
    insertRowAbove: () => withRect((r, s) => insertRows(s, r.r1, 1)),
    insertRowBelow: () => withRect((r, s) => insertRows(s, r.r2 + 1, 1)),
    deleteRows: () => { const r = latest.current.rect; withRect((r, s) => deleteRows(s, r.r1, rectHeight(r))); if (r) select({ c: r.c1, r: r.r1 }) },
    insertColLeft: () => withRect((r, s) => insertCols(s, r.c1, 1)),
    insertColRight: () => withRect((r, s) => insertCols(s, r.c2 + 1, 1)),
    deleteCols: () => { const r = latest.current.rect; withRect((r, s) => deleteCols(s, r.c1, rectWidth(r))); if (r) select({ c: r.c1, r: r.r1 }) },
    clear: () => withRect((r, s) => clearRect(s, r)),
    addRow: () => { const s = latest.current.sheet; if (s.rows < MAX_ROWS) commit({ ...s, rows: s.rows + 1 }) },
    addCol: () => { const s = latest.current.sheet; if (s.cols < MAX_COLS) commit({ ...s, cols: s.cols + 1 }) },
    sort: (dir: 'asc' | 'desc') => withRect((r, s) => { const a = latest.current.sel!.anchor; const full = rectWidth(r) === 1 && rectHeight(r) === 1 ? (usedRect(s.cells) ?? r) : r; return sortRect(s, { ...full, r1: full.r1 + (rectHeight(full) > 1 && looksLikeHeader(s, full) ? 1 : 0) }, a.c, dir, latest.current.values) }),
    fillDown: () => withRect((r, s) => (rectHeight(r) > 1 ? fillRect(s, { ...r, r2: r.r1 }, r) : s)),
    fillRight: () => withRect((r, s) => (rectWidth(r) > 1 ? fillRect(s, { ...r, c2: r.c1 }, r) : s)),
    format: (fmt: CellFormat) => withRect((r, s) => setColumnFormat(s, Array.from({ length: rectWidth(r) }, (_, i) => r.c1 + i), fmt)),
  }

  /* ---------------------------------------------------------- clipboard */
  const copyToClipboard = (e?: React.ClipboardEvent) => {
    const r = latest.current.rect; const s = latest.current.sheet
    if (!r) return
    const grid = displayRect(s, latest.current.values, r)
    const text = gridToTsv(grid)
    clip.current = { text, grid: readRect(s.cells, r), from: { c: r.c1, r: r.r1 } }
    if (e) { e.preventDefault(); e.clipboardData.setData('text/plain', text) }
    else navigator.clipboard?.writeText(text).catch(() => undefined)
  }
  const onCopy = (e: React.ClipboardEvent) => { if (latest.current.edit) return; copyToClipboard(e) }
  const onCut = (e: React.ClipboardEvent) => { if (latest.current.edit) return; copyToClipboard(e); if (!readOnly) withRect((r, s) => clearRect(s, r)) }
  const pasteText = (text: string) => {
    const r = latest.current.rect; const s = latest.current.sheet
    if (!r || readOnly) return
    const internal = clip.current && clip.current.text === text ? clip.current : null
    const grid = internal ? internal.grid : parseGrid(text)
    if (!grid.length) return
    const h = grid.length, w = Math.max(...grid.map((l) => l.length))
    if (h === 1 && w === 1 && (rectWidth(r) > 1 || rectHeight(r) > 1)) { commit(tileGrid(s, grid, internal?.from ?? { c: r.c1, r: r.r1 }, r)); return }
    commit(writeGrid(s, grid, { c: r.c1, r: r.r1 }, internal?.from))
    setSel({ anchor: { c: r.c1, r: r.r1 }, focus: { c: Math.min(MAX_COLS - 1, r.c1 + w - 1), r: Math.min(MAX_ROWS - 1, r.r1 + h - 1) } })
  }
  const onPaste = (e: React.ClipboardEvent) => { if (latest.current.edit) return; e.preventDefault(); pasteText(e.clipboardData.getData('text/plain')) }
  const pasteFromMenu = async () => { try { pasteText(await navigator.clipboard.readText()) } catch { if (clip.current) pasteText(clip.current.text) } }

  /* ---------------------------------------------------------- keyboard */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (latest.current.edit) return
    const mod = e.metaKey || e.ctrlKey
    const s = latest.current.sel
    const k = e.key
    if (!s && !['Escape'].includes(k)) { select({ c: 0, r: 0 }); if (k.length !== 1) return }
    const cur = latest.current.sheet
    if (mod && (k === 'z' || k === 'Z')) { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return }
    if (mod && (k === 'y' || k === 'Y')) { e.preventDefault(); redo(); return }
    if (mod && (k === 'a' || k === 'A')) { e.preventDefault(); setSel({ anchor: { c: 0, r: 0 }, focus: { c: cur.cols - 1, r: cur.rows - 1 } }); return }
    if (mod && (k === 'd' || k === 'D')) { e.preventDefault(); act.fillDown(); return }
    if (mod && (k === 'r' || k === 'R')) { e.preventDefault(); act.fillRight(); return }
    if (mod && (k === 'c' || k === 'C' || k === 'x' || k === 'X' || k === 'v' || k === 'V')) return // native clipboard events follow
    if (k === 'ArrowDown') { e.preventDefault(); if (mod) { const p = e.shiftKey ? s!.focus : s!.anchor; const np = { c: p.c, r: cur.rows - 1 }; e.shiftKey ? setSel({ anchor: s!.anchor, focus: np }) : select(np) } else move(0, 1, e.shiftKey); return }
    if (k === 'ArrowUp') { e.preventDefault(); if (mod) { const p = e.shiftKey ? s!.focus : s!.anchor; const np = { c: p.c, r: 0 }; e.shiftKey ? setSel({ anchor: s!.anchor, focus: np }) : select(np) } else move(0, -1, e.shiftKey); return }
    if (k === 'ArrowRight') { e.preventDefault(); if (mod) { const p = e.shiftKey ? s!.focus : s!.anchor; const np = { c: cur.cols - 1, r: p.r }; e.shiftKey ? setSel({ anchor: s!.anchor, focus: np }) : select(np) } else move(1, 0, e.shiftKey); return }
    if (k === 'ArrowLeft') { e.preventDefault(); if (mod) { const p = e.shiftKey ? s!.focus : s!.anchor; const np = { c: 0, r: p.r }; e.shiftKey ? setSel({ anchor: s!.anchor, focus: np }) : select(np) } else move(-1, 0, e.shiftKey); return }
    if (k === 'Tab') { e.preventDefault(); step(e.shiftKey ? -1 : 1, 0); return }
    if (k === 'Enter') { e.preventDefault(); if (e.altKey) return; if (multi || e.shiftKey) step(0, e.shiftKey ? -1 : 1); else startEdit(activeKey!); return }
    if (k === 'F2') { e.preventDefault(); startEdit(activeKey!); return }
    if (k === 'Home') { e.preventDefault(); const p = mod ? { c: 0, r: 0 } : { c: 0, r: s!.anchor.r }; e.shiftKey ? setSel({ anchor: s!.anchor, focus: p }) : select(p); return }
    if (k === 'End') { e.preventDefault(); const u = usedRect(cur.cells); const p = mod ? { c: u?.c2 ?? 0, r: u?.r2 ?? 0 } : { c: u?.c2 ?? 0, r: s!.anchor.r }; e.shiftKey ? setSel({ anchor: s!.anchor, focus: p }) : select(p); return }
    if (k === 'PageDown' || k === 'PageUp') { e.preventDefault(); move(0, k === 'PageDown' ? 12 : -12, e.shiftKey); return }
    if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); act.clear(); return }
    if (k === 'Escape') { e.preventDefault(); if (menu) setMenu(null); else if (full) setFull(false); else if (s && multi) select(s.anchor); return }
    if (k.length === 1 && !mod && !e.altKey) { e.preventDefault(); startEdit(activeKey!, k); return }
  }
  const onEditKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') { e.preventDefault(); finishEdit(true, () => step(0, e.shiftKey ? -1 : 1)) }
    else if (e.key === 'Tab') { e.preventDefault(); finishEdit(true, () => step(e.shiftKey ? -1 : 1, 0)) }
    else if (e.key === 'Escape') { e.preventDefault(); finishEdit(false) }
    else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && edit && !edit.draft.startsWith('=')) { e.preventDefault(); finishEdit(true, () => move(0, e.key === 'ArrowDown' ? 1 : -1)) }
    else { const el = e.currentTarget; requestAnimationFrame(() => { if (el.isConnected) trackCaret(el) }) }
  }

  /* ---------------------------------------------------------- mouse */
  const posOf = (el: Element | null): Pos | null => {
    const td = el?.closest<HTMLElement>('[data-c]')
    if (!td) return null
    return { c: Number(td.dataset.c), r: Number(td.dataset.r) }
  }
  const onCellMouseDown = (e: React.MouseEvent, p: Pos) => {
    if (e.button === 2) { if (!latest.current.rect || !inRect(p, latest.current.rect)) select(p); return }
    if (e.button !== 0) return
    const ed = latest.current.edit
    if (ed && formulaMode) { e.preventDefault(); insertRef(cellKey(p.c, p.r)); drag.current = { kind: 'ref', start: p }; return }
    if (ed) { if (ed.key === cellKey(p.c, p.r) && ed.where === 'cell') return; finishEdit(true) }
    e.preventDefault()
    focusGrid()
    if (e.shiftKey && latest.current.sel) setSel({ anchor: latest.current.sel.anchor, focus: p })
    else select(p)
    drag.current = { kind: 'select' }
  }
  const onColHeadMouseDown = (e: React.MouseEvent, c: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    const th = e.currentTarget as HTMLElement
    const w = th.getBoundingClientRect()
    if (e.clientX > w.right - 7) { drag.current = { kind: 'resize', c, x: e.clientX, w: w.width }; setResizing({ c, w: w.width }); return }
    if (latest.current.edit) finishEdit(true)
    focusGrid()
    const cur = latest.current.sheet
    const startC = e.shiftKey && latest.current.sel ? latest.current.sel.anchor.c : c
    setSel({ anchor: { c: startC, r: 0 }, focus: { c, r: cur.rows - 1 } })
    drag.current = { kind: 'cols', start: startC }
  }
  const onRowHeadMouseDown = (e: React.MouseEvent, r: number) => {
    if (e.button !== 0) return
    e.preventDefault()
    if (latest.current.edit) finishEdit(true)
    focusGrid()
    const cur = latest.current.sheet
    const startR = e.shiftKey && latest.current.sel ? latest.current.sel.anchor.r : r
    setSel({ anchor: { c: 0, r: startR }, focus: { c: cur.cols - 1, r } })
    drag.current = { kind: 'rows', start: startR }
  }
  const onGridMouseOver = (e: React.MouseEvent) => {
    const d = drag.current
    if (!d) return
    const p = posOf(e.target as Element)
    if (!p) return
    const cur = latest.current.sheet
    if (d.kind === 'select') setSel((s) => (s ? { anchor: s.anchor, focus: p } : s))
    else if (d.kind === 'cols') setSel({ anchor: { c: d.start, r: 0 }, focus: { c: p.c, r: cur.rows - 1 } })
    else if (d.kind === 'rows') setSel({ anchor: { c: 0, r: d.start }, focus: { c: cur.cols - 1, r: p.r } })
    else if (d.kind === 'fill' && latest.current.rect) setFillPreview(fillTarget(latest.current.rect, p))
    else if (d.kind === 'ref') insertRef(rectToA1(rectOf(d.start, p)))
  }
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = drag.current
      if (d?.kind === 'resize') setResizing({ c: d.c, w: Math.max(MIN_W, d.w + e.clientX - d.x) })
    }
    const onUp = () => {
      const d = drag.current
      drag.current = null
      if (!d) return
      const { sheet: cur, rect: r, fillPreview: fp, resizing: rs } = latest.current
      if (d.kind === 'fill') {
        if (r && fp && (fp.r2 !== r.r2 || fp.r1 !== r.r1 || fp.c2 !== r.c2 || fp.c1 !== r.c1)) { commit(fillRect(cur, r, fp)); setSel({ anchor: { c: fp.c1, r: fp.r1 }, focus: { c: fp.c2, r: fp.r2 } }) }
        setFillPreview(null)
      } else if (d.kind === 'resize') {
        if (rs) commit({ ...cur, widths: { ...(cur.widths ?? {}), [colToLetter(rs.c)]: Math.round(rs.w) } })
        setResizing(null)
      } else if (d.kind === 'ref') {
        const ed = latest.current.edit
        const el = ed?.where === 'bar' ? barInputRef.current : cellInputRef.current
        el?.focus()
      }
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
  }, [commit])

  const onContextMenu = (e: React.MouseEvent) => {
    if (readOnly) return
    const p = posOf(e.target as Element)
    if (!p) return
    e.preventDefault()
    if (latest.current.edit) finishEdit(true)
    if (!latest.current.rect || !inRect(p, latest.current.rect)) select(p)
    setMenu({ x: e.clientX, y: e.clientY })
  }
  React.useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    return () => { document.removeEventListener('mousedown', close); window.removeEventListener('scroll', close, true) }
  }, [menu])

  /* ---------------------------------------------------------- charts */
  const addChart = (type: ChartType) => {
    const r = latest.current.rect
    const range = r && multi ? rectToA1(r) : rectToA1(usedRect(sheet.cells) ?? rectOf({ c: 0, r: 0 }, { c: Math.min(sheet.cols - 1, 2), r: Math.min(sheet.rows - 1, 6) }))
    commit({ ...sheet, charts: [...(sheet.charts ?? []), { id: uid('ch'), type, range }] })
  }
  const updateChart = (id: string, patch: Partial<SheetChart>) => commit({ ...sheet, charts: (sheet.charts ?? []).map((c) => (c.id === id ? { ...c, ...patch } : c)) }, { history: false })
  const removeChart = (id: string) => commit({ ...sheet, charts: (sheet.charts ?? []).filter((c) => c.id !== id) })

  /* ---------------------------------------------------------- derived display */
  const widthOf = (c: number) => (resizing?.c === c ? resizing.w : (sheet.widths?.[colToLetter(c)] ?? DEFAULT_W))
  const totalWidth = HEAD_W + Array.from({ length: sheet.cols }, (_, c) => widthOf(c)).reduce((a, b) => a + b, 0)
  const selFormat: CellFormat = active ? (sheet.formats?.[colToLetter(active.c)] ?? 'auto') : 'auto'
  const activeValue = activeKey ? (values[activeKey] ?? null) : null
  const stats = React.useMemo(() => {
    if (!rect || !multi) return null
    let sum = 0, count = 0, n = 0
    for (let r = rect.r1; r <= rect.r2; r++) for (let c = rect.c1; c <= rect.c2; c++) { const v = values[cellKey(c, r)]; if (v === undefined || v === null || v === '') continue; count++; if (typeof v === 'number') { sum += v; n++ } }
    return { sum, count, n }
  }, [rect, multi, values])
  const barValue = edit ? edit.draft : activeRaw

  const menuItems: { label: string; icon?: React.ReactNode; onSelect: () => void; danger?: boolean; sep?: boolean }[] = rect ? [
    { label: 'Cut', icon: <Scissors className="h-3.5 w-3.5" />, onSelect: () => { copyToClipboard(); act.clear() } },
    { label: 'Copy', icon: <Copy className="h-3.5 w-3.5" />, onSelect: () => copyToClipboard() },
    { label: 'Paste', icon: <ClipboardPaste className="h-3.5 w-3.5" />, onSelect: () => void pasteFromMenu() },
    { label: `Insert row above`, icon: <Rows3 className="h-3.5 w-3.5" />, onSelect: act.insertRowAbove, sep: true },
    { label: `Insert row below`, icon: <Rows3 className="h-3.5 w-3.5" />, onSelect: act.insertRowBelow },
    { label: rectHeight(rect) > 1 ? `Delete ${rectHeight(rect)} rows` : 'Delete row', icon: <Trash2 className="h-3.5 w-3.5" />, onSelect: act.deleteRows, danger: true },
    { label: `Insert column left`, icon: <Columns3 className="h-3.5 w-3.5" />, onSelect: act.insertColLeft, sep: true },
    { label: `Insert column right`, icon: <Columns3 className="h-3.5 w-3.5" />, onSelect: act.insertColRight },
    { label: rectWidth(rect) > 1 ? `Delete ${rectWidth(rect)} columns` : 'Delete column', icon: <Trash2 className="h-3.5 w-3.5" />, onSelect: act.deleteCols, danger: true },
    { label: 'Sort A → Z by this column', icon: <ArrowDownAZ className="h-3.5 w-3.5" />, onSelect: () => act.sort('asc'), sep: true },
    { label: 'Sort Z → A by this column', icon: <ArrowUpAZ className="h-3.5 w-3.5" />, onSelect: () => act.sort('desc') },
    { label: 'Clear', icon: <Eraser className="h-3.5 w-3.5" />, onSelect: act.clear, sep: true },
  ] : []

  const grid = (
    <div
      ref={gridRef}
      tabIndex={0}
      role="grid"
      aria-label={sheet.title || 'Sheet'}
      onKeyDown={onKeyDown}
      onCopy={onCopy}
      onCut={onCut}
      onPaste={onPaste}
      onMouseOver={onGridMouseOver}
      onContextMenu={onContextMenu}
      className={cx('hkn-grid relative select-none overflow-auto outline-none', full ? 'min-h-0 flex-1' : 'max-h-[560px]')}
      style={{ cursor: resizing ? 'col-resize' : undefined }}
    >
      <table className="border-separate border-spacing-0 text-[13px]" style={{ width: totalWidth, tableLayout: 'fixed' }}>
        <colgroup>
          <col style={{ width: HEAD_W }} />
          {Array.from({ length: sheet.cols }, (_, c) => <col key={c} style={{ width: widthOf(c) }} />)}
        </colgroup>
        <thead>
          <tr>
            <th onMouseDown={(e) => { e.preventDefault(); focusGrid(); setSel({ anchor: { c: 0, r: 0 }, focus: { c: sheet.cols - 1, r: sheet.rows - 1 } }) }} className="sticky left-0 top-0 z-30 border-b border-r border-border bg-surface-2" style={{ height: ROW_H }} title="Select all" />
            {Array.from({ length: sheet.cols }, (_, c) => {
              const on = rect ? c >= rect.c1 && c <= rect.c2 : false
              const whole = on && rect && rect.r1 === 0 && rect.r2 === sheet.rows - 1
              return (
                <th key={c} onMouseDown={(e) => onColHeadMouseDown(e, c)} onDoubleClick={(e) => { const th = e.currentTarget as HTMLElement; if (e.clientX > th.getBoundingClientRect().right - 7) commit({ ...sheet, widths: { ...(sheet.widths ?? {}), [colToLetter(c)]: DEFAULT_W } }) }}
                  className={cx('group/th sticky top-0 z-20 border-b border-r border-border text-center text-[11px] font-medium', whole ? 'bg-accent text-accent-fg' : on ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-3')} style={{ height: ROW_H }}>
                  <span className="relative block truncate px-1">{colToLetter(c)}</span>
                  {!readOnly ? <span className="absolute -right-[3px] top-0 z-10 h-full w-[7px] cursor-col-resize opacity-0 hover:opacity-100 group-hover/th:opacity-60"><span className="mx-auto block h-full w-[2px] bg-accent" /></span> : null}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: sheet.rows }, (_, r) => {
            const rowOn = rect ? r >= rect.r1 && r <= rect.r2 : false
            const rowWhole = rowOn && rect && rect.c1 === 0 && rect.c2 === sheet.cols - 1
            return (
              <tr key={r} style={{ height: ROW_H }}>
                <td onMouseDown={(e) => onRowHeadMouseDown(e, r)} className={cx('sticky left-0 z-10 border-b border-r border-border text-center text-[11px] tabular-nums', rowWhole ? 'bg-accent text-accent-fg' : rowOn ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-fg-3')}>{r + 1}</td>
                {Array.from({ length: sheet.cols }, (_, c) => {
                  const key = cellKey(c, r)
                  const raw = sheet.cells[key]
                  const v = values[key] ?? null
                  const isActive = active?.c === c && active?.r === r
                  const inSel = rect ? inRect({ c, r }, rect) : false
                  const inFill = fillPreview ? inRect({ c, r }, fillPreview) && !inSel : false
                  const fmt = sheet.formats?.[colToLetter(c)] ?? 'auto'
                  const isEditing = edit?.key === key
                  const text = isEditing && edit.where === 'bar' ? edit.draft : formatValue(v, fmt)
                  const numeric = typeof v === 'number' || (typeof v === 'boolean')
                  const edges = rect && inSel ? cx(r === rect.r1 && 'border-t-accent', r === rect.r2 && '[border-bottom-color:var(--accent)]', c === rect.c1 && 'border-l-accent', c === rect.c2 && '[border-right-color:var(--accent)]') : ''
                  const isHandle = rect && !readOnly && c === rect.c2 && r === rect.r2
                  return (
                    <td
                      key={key}
                      data-key={key}
                      data-c={c}
                      data-r={r}
                      onMouseDown={(e) => onCellMouseDown(e, { c, r })}
                      onDoubleClick={() => { if (!readOnly) startEdit(key) }}
                      className={cx('relative border-b border-r border-border border-t border-l border-t-transparent border-l-transparent px-1.5 align-middle', inSel && 'bg-accent-soft/60', edges, isActive && 'z-[1] shadow-[inset_0_0_0_2px_var(--accent)]', inFill && 'bg-accent-soft/30 shadow-[inset_0_0_0_1px_var(--accent)]', numeric ? 'text-right tabular-nums' : 'text-left', isError(v) && 'text-danger', raw?.startsWith('=') && !isError(v) && !isEditing && 'text-accent', formulaMode && 'cursor-cell')}
                      style={{ height: ROW_H }}
                    >
                      {isEditing && edit.where === 'cell' ? (
                        <input ref={cellInputRef} value={edit.draft} spellCheck={false} autoComplete="off"
                          onChange={(e) => { refInsert.current = null; setEdit({ key, draft: e.target.value, where: 'cell' }); trackCaret(e.target) }}
                          onSelect={(e) => trackCaret(e.currentTarget)} onClick={(e) => trackCaret(e.currentTarget)}
                          onBlur={() => { if (drag.current?.kind === 'ref') return; requestAnimationFrame(() => { if (latest.current.edit?.key === key && latest.current.edit.where === 'cell' && document.activeElement !== cellInputRef.current && !formulaMode) finishEdit(true) }) }}
                          onKeyDown={onEditKey}
                          className="absolute inset-0 z-[2] h-full w-full min-w-[160px] bg-surface px-1.5 font-mono text-[12.5px] text-fg outline-none shadow-[inset_0_0_0_2px_var(--accent)]" style={{ width: Math.max(widthOf(c), 160) }} />
                      ) : (
                        <span className={cx('block truncate', edit?.key === key && 'font-mono text-[12.5px]')} title={raw && raw !== text ? raw : undefined}>{text}</span>
                      )}
                      {isHandle && !isEditing ? <span onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); drag.current = { kind: 'fill' }; setFillPreview(rect) }} className="absolute -bottom-[4px] -right-[4px] z-[3] h-[8px] w-[8px] cursor-crosshair border border-surface bg-accent" title="Drag to fill" /> : null}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      {!readOnly ? (
        <div className="sticky left-0 flex items-center gap-1 px-1 py-1 text-[11.5px] text-fg-3">
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={act.addRow} className="rounded px-1.5 py-0.5 hover:bg-surface-2 hover:text-fg"><Plus className="inline h-3 w-3" /> row</button>
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={act.addCol} className="rounded px-1.5 py-0.5 hover:bg-surface-2 hover:text-fg"><Plus className="inline h-3 w-3" /> column</button>
        </div>
      ) : null}
    </div>
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-2.5 py-1.5 text-[12.5px]">
      <Table2 className="h-3.5 w-3.5 shrink-0 text-fg-3" />
      <input value={sheet.title ?? ''} onChange={(e) => commit({ ...sheet, title: e.target.value }, { history: false })} onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' || e.key === 'Escape') (e.target as HTMLInputElement).blur() }} placeholder="Sheet title" readOnly={readOnly} className="h-7 min-w-[120px] flex-1 rounded-md bg-transparent px-1 font-medium outline-none placeholder:text-fg-3 focus:bg-surface-2" />
      {!readOnly ? (
        <>
          <ToolButton onClick={undo} title="Undo (⌘Z)" disabled={!history.current.past.length}><Undo2 className="h-3.5 w-3.5" /></ToolButton>
          <ToolButton onClick={redo} title="Redo (⌘⇧Z)" disabled={!history.current.future.length}><Redo2 className="h-3.5 w-3.5" /></ToolButton>
          <span className="mx-0.5 h-4 w-px bg-border" />
          <select value={selFormat} disabled={!rect} onMouseDown={(e) => e.stopPropagation()} onChange={(e) => act.format(e.target.value as CellFormat)} className="h-7 rounded-md border border-border bg-surface px-1.5 text-[12px] disabled:opacity-50" title="Number format for the selected columns">{FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}</select>
          <Dropdown label={<><Rows3 className="h-3.5 w-3.5" /> Rows <ChevronDown className="h-3 w-3" /></>} disabled={!rect} items={[{ label: 'Insert row above', onSelect: act.insertRowAbove }, { label: 'Insert row below', onSelect: act.insertRowBelow }, { label: rect && rectHeight(rect) > 1 ? `Delete ${rectHeight(rect)} rows` : 'Delete row', onSelect: act.deleteRows, danger: true }, { label: 'Sort A → Z', onSelect: () => act.sort('asc') }, { label: 'Sort Z → A', onSelect: () => act.sort('desc') }]} />
          <Dropdown label={<><Columns3 className="h-3.5 w-3.5" /> Columns <ChevronDown className="h-3 w-3" /></>} disabled={!rect} items={[{ label: 'Insert column left', onSelect: act.insertColLeft }, { label: 'Insert column right', onSelect: act.insertColRight }, { label: rect && rectWidth(rect) > 1 ? `Delete ${rectWidth(rect)} columns` : 'Delete column', onSelect: act.deleteCols, danger: true }, { label: 'Reset width', onSelect: () => withRect((r, s) => { const widths = { ...(s.widths ?? {}) }; for (let c = r.c1; c <= r.c2; c++) delete widths[colToLetter(c)]; return { ...s, widths } }) }]} />
          <span className="mx-0.5 h-4 w-px bg-border" />
          {CHART_TYPES.map((t) => <ToolButton key={t.id} title={multi ? `${t.label} chart from the selection` : `${t.label} chart from the whole sheet`} onClick={() => addChart(t.id)}><t.icon className="h-3.5 w-3.5" /></ToolButton>)}
          <span className="mx-0.5 h-4 w-px bg-border" />
        </>
      ) : null}
      <ToolButton onClick={() => { const r = usedRect(sheet.cells); if (!r) return; navigator.clipboard?.writeText(gridToTsv(displayRect(sheet, values, r))).catch(() => undefined) }} title="Copy the whole sheet as tab-separated text"><Copy className="h-3.5 w-3.5" /></ToolButton>
      <ToolButton onClick={() => setFull((f) => !f)} title={full ? 'Exit full screen (Esc)' : 'Full screen'}>{full ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}</ToolButton>
      {!readOnly && onRemove ? <ToolButton onClick={() => { if (confirm('Remove this sheet from the note?')) onRemove() }} title="Remove sheet" danger><Trash2 className="h-3.5 w-3.5" /></ToolButton> : null}
    </div>
  )

  const formulaBar = !readOnly ? (
    <div className="flex items-center gap-2 border-b border-border px-2.5 py-1 text-[12.5px]">
      <span className="w-[72px] shrink-0 truncate rounded bg-surface-2 px-1.5 py-0.5 text-center font-mono text-[11.5px] text-fg-2">{rect ? rectToA1(rect) : '—'}</span>
      <Sigma className="h-3.5 w-3.5 shrink-0 text-fg-3" />
      <input
        ref={barInputRef}
        value={barValue}
        spellCheck={false}
        autoComplete="off"
        onFocus={() => { if (activeKey && !latest.current.edit) startEdit(activeKey, undefined, 'bar') }}
        onChange={(e) => { refInsert.current = null; if (latest.current.edit) setEdit({ ...latest.current.edit, draft: e.target.value }); trackCaret(e.target) }}
        onSelect={(e) => trackCaret(e.currentTarget)} onClick={(e) => trackCaret(e.currentTarget)}
        onBlur={() => { if (drag.current?.kind === 'ref') return; requestAnimationFrame(() => { if (latest.current.edit?.where === 'bar' && document.activeElement !== barInputRef.current) finishEdit(true) }) }}
        onKeyDown={onEditKey}
        placeholder={rect ? 'Type a value or a formula like =SUM(A1:A5)' : 'Select a cell'}
        disabled={!rect}
        className="h-7 min-w-0 flex-1 bg-transparent font-mono text-[12.5px] outline-none placeholder:text-fg-3"
      />
      {activeKey && isError(activeValue) ? <span className="shrink-0 text-[11.5px] text-danger">{activeValue.error}{activeValue.detail ? ` · ${activeValue.detail}` : ''}</span> : null}
    </div>
  ) : null

  const statusBar = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-border px-2.5 py-1 text-[11px] text-fg-3">
      {stats ? <span className="tabular-nums text-fg-2">{stats.n ? <>Sum <b className="font-medium">{formatValue(stats.sum)}</b> · Avg <b className="font-medium">{formatValue(stats.sum / stats.n)}</b> · </> : null}Count {stats.count}</span> : null}
      <span className="ml-auto hidden sm:inline">{readOnly ? `${sheet.rows} × ${sheet.cols}` : 'Type to edit · Enter to edit or confirm · drag the corner to fill · right-click for rows and columns · ⌘Z undo'}</span>
    </div>
  )

  const charts = (sheet.charts ?? []).length ? (
    <div className="grid gap-4 border-t border-border p-3 md:grid-cols-2">
      {(sheet.charts ?? []).map((ch) => (
        <div key={ch.id} className="rounded-lg border border-border p-2.5">
          {!readOnly ? (
            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[12px]">
              <select value={ch.type} onChange={(e) => updateChart(ch.id, { type: e.target.value as ChartType })} className="h-6 rounded-md border border-border bg-surface px-1 text-[12px]">{CHART_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
              <input value={ch.range} onChange={(e) => updateChart(ch.id, { range: e.target.value.toUpperCase() })} onKeyDown={(e) => e.stopPropagation()} className="h-6 w-24 rounded-md border border-border bg-surface px-1.5 font-mono text-[12px]" placeholder="A1:C6" />
              <input value={ch.title ?? ''} onChange={(e) => updateChart(ch.id, { title: e.target.value })} onKeyDown={(e) => e.stopPropagation()} className="h-6 min-w-0 flex-1 rounded-md border border-border bg-surface px-1.5 text-[12px]" placeholder="Chart title" />
              {rect && multi ? <button type="button" onClick={() => updateChart(ch.id, { range: rectToA1(rect) })} className="rounded-md border border-border px-1.5 py-0.5 text-[11.5px] hover:bg-surface-2" title="Use the selected cells">Use selection</button> : null}
              <button type="button" onClick={() => removeChart(ch.id)} className="rounded-md p-1 text-fg-3 hover:text-danger" title="Remove chart"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : null}
          <Chart type={ch.type} data={chartDataFromRange(sheet, ch.range, values)} title={ch.title || undefined} height={full ? 260 : 220} compact />
        </div>
      ))}
    </div>
  ) : null

  const contextMenu = menu && mounted ? createPortal(
    <div className="fixed z-[120] min-w-[200px] rounded-xl border border-border bg-surface p-1 shadow-pop" style={{ left: Math.min(menu.x, window.innerWidth - 220), top: Math.min(menu.y, window.innerHeight - 420) }} onMouseDown={(e) => e.stopPropagation()} role="menu">
      {menuItems.map((it, i) => (
        <React.Fragment key={i}>
          {it.sep ? <div className="my-1 h-px bg-border" /> : null}
          <button type="button" role="menuitem" className={cx('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-2', it.danger && 'text-danger')} onClick={() => { setMenu(null); it.onSelect(); focusGrid() }}>{it.icon}{it.label}</button>
        </React.Fragment>
      ))}
    </div>,
    document.body,
  ) : null

  const body = (
    <div className={cx('flex flex-col bg-surface', full ? 'h-full min-h-0 rounded-xl border border-border shadow-pop' : cx('rounded-xl border', selected ? 'border-accent' : 'border-border'))}>
      {toolbar}
      {formulaBar}
      {grid}
      {statusBar}
      {charts}
      {contextMenu}
    </div>
  )

  if (full && mounted) {
    return (
      <>
        <div className="my-4 rounded-xl border border-dashed border-border px-3 py-6 text-center text-[12.5px] text-fg-3">Sheet is open full screen.</div>
        {createPortal(<div className="fixed inset-0 z-[110] flex flex-col bg-black/40 p-3 backdrop-blur-[2px] sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setFull(false) }}>{body}</div>, document.body)}
      </>
    )
  }
  return body
}

function looksLikeHeader(s: SheetData, r: Rect): boolean {
  const { values } = evaluateSheet(s.cells)
  let text = 0, total = 0
  for (let c = r.c1; c <= r.c2; c++) { const v = values[cellKey(c, r.r1)]; if (v === undefined || v === null) continue; total++; if (typeof v === 'string') text++ }
  return total > 0 && text === total
}

function ToolButton({ children, onClick, title, disabled, danger }: { children: React.ReactNode; onClick: () => void; title: string; disabled?: boolean; danger?: boolean }) {
  return <button type="button" title={title} aria-label={title} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick} className={cx('rounded-md border border-border p-1 text-fg-2 hover:bg-surface-2 hover:text-fg disabled:opacity-40', danger && 'hover:border-danger/40 hover:text-danger')}>{children}</button>
}

function Dropdown({ label, items, disabled }: { label: React.ReactNode; items: { label: string; onSelect: () => void; danger?: boolean }[]; disabled?: boolean }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={() => setOpen((o) => !o)} className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-[12px] text-fg-2 hover:bg-surface-2 hover:text-fg disabled:opacity-40">{label}</button>
      {open ? (
        <div className="absolute left-0 top-full z-40 mt-1 min-w-[190px] rounded-xl border border-border bg-surface p-1 shadow-pop" role="menu">
          {items.map((it, i) => <button key={i} type="button" role="menuitem" onMouseDown={(e) => e.preventDefault()} onClick={() => { setOpen(false); it.onSelect() }} className={cx('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-2', it.danger && 'text-danger')}>{it.label}</button>)}
        </div>
      ) : null}
    </div>
  )
}

export type { CellValue }
