/*
  Structural edits on a sheet: selections as rectangles, moving cells when
  rows or columns are inserted or deleted (with every formula reference
  rewritten to follow), translating formulas on copy/paste and fill, and
  reading a block of cells back out as text.
*/
import { cellKey, colToLetter, letterToCol, parseRange, formatValue, isError, type Cells, type CellValue, type CellFormat } from './formula'
import type { SheetData } from './model'

export interface Pos { c: number; r: number }
export interface Rect { c1: number; r1: number; c2: number; r2: number }

export const MAX_ROWS = 1000
export const MAX_COLS = 104

export function rectOf(a: Pos, b: Pos = a): Rect {
  return { c1: Math.min(a.c, b.c), r1: Math.min(a.r, b.r), c2: Math.max(a.c, b.c), r2: Math.max(a.r, b.r) }
}
export const inRect = (p: Pos, r: Rect) => p.c >= r.c1 && p.c <= r.c2 && p.r >= r.r1 && p.r <= r.r2
export const rectWidth = (r: Rect) => r.c2 - r.c1 + 1
export const rectHeight = (r: Rect) => r.r2 - r.r1 + 1
export const rectToA1 = (r: Rect) => (r.c1 === r.c2 && r.r1 === r.r2 ? cellKey(r.c1, r.r1) : `${cellKey(r.c1, r.r1)}:${cellKey(r.c2, r.r2)}`)
export const a1ToRect = (s: string): Rect | null => parseRange(s)

/** The smallest rectangle holding every non-empty cell, or null for an empty sheet. */
export function usedRect(cells: Cells): Rect | null {
  let c1 = Infinity, r1 = Infinity, c2 = -1, r2 = -1
  for (const [k, v] of Object.entries(cells)) {
    if (v === '') continue
    const m = /^([A-Z]+)(\d+)$/.exec(k)
    if (!m) continue
    const c = letterToCol(m[1]!), r = Number(m[2]) - 1
    c1 = Math.min(c1, c); r1 = Math.min(r1, r); c2 = Math.max(c2, c); r2 = Math.max(r2, r)
  }
  return c2 < 0 ? null : { c1, r1, c2, r2 }
}

/* ------------------------------------------------------------- formula references */

const REF_RE = /("(?:[^"]|"")*")|(?<![A-Za-z0-9_$.])(\$?)([A-Z]{1,3})(\$?)(\d{1,7})(?::(\$?)([A-Z]{1,3})(\$?)(\d{1,7}))?(?![A-Za-z0-9_(])/g

export interface RefPart { col: number; row: number; absCol: boolean; absRow: boolean }
/** Rewrite every reference in a formula (given without the leading "=") through `fn`. Returning null makes the reference #REF!. Strings are left alone. */
export function mapRefs(src: string, fn: (a: RefPart, b: RefPart | null) => [RefPart, RefPart | null] | null): string {
  return src.replace(REF_RE, (m, str: string | undefined, ac: string, al: string, ar: string, an: string, bc?: string, bl?: string, br?: string, bn?: string) => {
    if (str !== undefined) return str
    const a: RefPart = { col: letterToCol(al), row: Number(an) - 1, absCol: ac === '$', absRow: ar === '$' }
    const b: RefPart | null = bl ? { col: letterToCol(bl), row: Number(bn) - 1, absCol: bc === '$', absRow: br === '$' } : null
    const out = fn(a, b)
    if (!out) return '#REF!'
    const fmt = (p: RefPart) => `${p.absCol ? '$' : ''}${colToLetter(p.col)}${p.absRow ? '$' : ''}${p.row + 1}`
    return out[1] ? `${fmt(out[0])}:${fmt(out[1])}` : fmt(out[0])
  })
}

/** Shift relative references by (dc, dr): what copy/paste and fill do. Absolute ($) parts stay. */
export function translateFormula(raw: string, dc: number, dr: number): string {
  if (!raw.startsWith('=') || (dc === 0 && dr === 0)) return raw
  const move = (p: RefPart): RefPart | null => {
    const col = p.absCol ? p.col : p.col + dc
    const row = p.absRow ? p.row : p.row + dr
    return col < 0 || row < 0 ? null : { ...p, col, row }
  }
  return '=' + mapRefs(raw.slice(1), (a, b) => {
    const na = move(a)
    if (!na) return null
    if (!b) return [na, null]
    const nb = move(b)
    return nb ? [na, nb] : null
  })
}

type Axis = 'row' | 'col'
/** How an index on `axis` moves when `n` lines are inserted at `at`. */
const insertMap = (at: number, n: number) => (i: number) => (i >= at ? i + n : i)
/** How an index moves when lines [at, at+n) are deleted; null means it was deleted. */
const deleteMap = (at: number, n: number) => (i: number): number | null => (i < at ? i : i >= at + n ? i - n : null)

function rewriteForStructure(raw: string, axis: Axis, kind: 'insert' | 'delete', at: number, n: number): string {
  if (!raw.startsWith('=')) return raw
  const get = (p: RefPart) => (axis === 'row' ? p.row : p.col)
  const set = (p: RefPart, v: number): RefPart => (axis === 'row' ? { ...p, row: v } : { ...p, col: v })
  return '=' + mapRefs(raw.slice(1), (a, b) => {
    if (kind === 'insert') {
      const f = insertMap(at, n)
      return [set(a, f(get(a))), b ? set(b, f(get(b))) : null]
    }
    const f = deleteMap(at, n)
    if (!b) { const v = f(get(a)); return v === null ? null : [set(a, v), null] }
    // A range shrinks when part of it is deleted and dies only when all of it is.
    const s = get(a), e = get(b)
    const ns = s < at ? s : s >= at + n ? s - n : at
    const ne = e < at ? e : e >= at + n ? e - n : at - 1
    return ne < ns ? null : [set(a, ns), set(b, ne)]
  })
}

function remapSheet(sheet: SheetData, axis: Axis, map: (i: number) => number | null, rewrite: (raw: string) => string): SheetData {
  const cells: Cells = {}
  for (const [k, v] of Object.entries(sheet.cells)) {
    const m = /^([A-Z]+)(\d+)$/.exec(k)
    if (!m) continue
    let c = letterToCol(m[1]!), r = Number(m[2]) - 1
    if (axis === 'row') { const nr = map(r); if (nr === null) continue; r = nr } else { const nc = map(c); if (nc === null) continue; c = nc }
    cells[cellKey(c, r)] = rewrite(v)
  }
  const perCol = (src: Record<string, unknown> | undefined) => {
    if (axis === 'row' || !src) return src
    const out: Record<string, unknown> = {}
    for (const [letter, v] of Object.entries(src)) { const nc = map(letterToCol(letter)); if (nc !== null) out[colToLetter(nc)] = v }
    return out
  }
  const charts = (sheet.charts ?? []).map((ch) => ({ ...ch, range: rewrite('=' + ch.range).slice(1) })).filter((ch) => !ch.range.includes('#REF!'))
  return { ...sheet, cells, formats: perCol(sheet.formats) as SheetData['formats'], widths: perCol(sheet.widths) as SheetData['widths'], charts }
}

export function insertRows(sheet: SheetData, at: number, n = 1): SheetData {
  const next = remapSheet(sheet, 'row', insertMap(at, n), (raw) => rewriteForStructure(raw, 'row', 'insert', at, n))
  return { ...next, rows: Math.min(MAX_ROWS, sheet.rows + n) }
}
export function deleteRows(sheet: SheetData, at: number, n = 1): SheetData {
  n = Math.min(n, sheet.rows - at)
  if (n <= 0 || sheet.rows - n < 1) return sheet
  const next = remapSheet(sheet, 'row', deleteMap(at, n), (raw) => rewriteForStructure(raw, 'row', 'delete', at, n))
  return { ...next, rows: sheet.rows - n }
}
export function insertCols(sheet: SheetData, at: number, n = 1): SheetData {
  const next = remapSheet(sheet, 'col', insertMap(at, n), (raw) => rewriteForStructure(raw, 'col', 'insert', at, n))
  return { ...next, cols: Math.min(MAX_COLS, sheet.cols + n) }
}
export function deleteCols(sheet: SheetData, at: number, n = 1): SheetData {
  n = Math.min(n, sheet.cols - at)
  if (n <= 0 || sheet.cols - n < 1) return sheet
  const next = remapSheet(sheet, 'col', deleteMap(at, n), (raw) => rewriteForStructure(raw, 'col', 'delete', at, n))
  return { ...next, cols: sheet.cols - n }
}

/* ------------------------------------------------------------- blocks of cells */

export function clearRect(sheet: SheetData, r: Rect): SheetData {
  const cells = { ...sheet.cells }
  for (let row = r.r1; row <= r.r2; row++) for (let c = r.c1; c <= r.c2; c++) delete cells[cellKey(c, row)]
  return { ...sheet, cells }
}

/** The raw text of every cell in the rectangle, row by row. */
export function readRect(cells: Cells, r: Rect): string[][] {
  const out: string[][] = []
  for (let row = r.r1; row <= r.r2; row++) { const line: string[] = []; for (let c = r.c1; c <= r.c2; c++) line.push(cells[cellKey(c, row)] ?? ''); out.push(line) }
  return out
}

/** The displayed text of every cell in the rectangle (what a copy puts on the clipboard). */
export function displayRect(sheet: SheetData, values: Record<string, CellValue>, r: Rect): string[][] {
  const out: string[][] = []
  for (let row = r.r1; row <= r.r2; row++) {
    const line: string[] = []
    for (let c = r.c1; c <= r.c2; c++) {
      const v = values[cellKey(c, row)]
      line.push(v === undefined ? '' : formatValue(v, sheet.formats?.[colToLetter(c)] ?? 'auto'))
    }
    out.push(line)
  }
  return out
}

/**
 * Write a block of raw cell text with its top-left at `at`, growing the sheet if needed.
 * With `from`, formulas are translated as if the block had been copied from there
 * (so =A1+B1 pasted one row down becomes =A2+B2).
 */
export function writeGrid(sheet: SheetData, grid: string[][], at: Pos, from?: Pos): SheetData {
  const cells = { ...sheet.cells }
  let rows = sheet.rows, cols = sheet.cols
  const dc = from ? at.c - from.c : 0, dr = from ? at.r - from.r : 0
  grid.forEach((line, ri) => line.forEach((raw, ci) => {
    const c = at.c + ci, r = at.r + ri
    if (c >= MAX_COLS || r >= MAX_ROWS) return
    rows = Math.max(rows, r + 1); cols = Math.max(cols, c + 1)
    const key = cellKey(c, r)
    const v = from ? translateFormula(raw, dc, dr) : raw
    if (v.trim() === '') delete cells[key]
    else cells[key] = v
  }))
  return { ...sheet, cells, rows, cols }
}

/** Repeat a block over a target rectangle (paste of one cell into a range, fill of a pattern). */
export function tileGrid(sheet: SheetData, grid: string[][], from: Pos, target: Rect): SheetData {
  const h = grid.length, w = Math.max(...grid.map((l) => l.length), 0)
  if (!h || !w) return sheet
  const cells = { ...sheet.cells }
  for (let r = target.r1; r <= target.r2; r++) for (let c = target.c1; c <= target.c2; c++) {
    const gi = ((r - target.r1) % h + h) % h, gj = ((c - target.c1) % w + w) % w
    const raw = grid[gi]![gj] ?? ''
    const v = translateFormula(raw, c - (from.c + gj), r - (from.r + gi))
    const key = cellKey(c, r)
    if (v.trim() === '') delete cells[key]; else cells[key] = v
  }
  return { ...sheet, cells, rows: Math.max(sheet.rows, target.r2 + 1), cols: Math.max(sheet.cols, target.c2 + 1) }
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const MONTHS_LONG = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const DAYS_LONG = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const matchCase = (sample: string, word: string) => (sample === sample.toUpperCase() ? word.toUpperCase() : sample[0] === sample[0]!.toUpperCase() ? word[0]!.toUpperCase() + word.slice(1) : word)

/**
 * The n-th continuation of a one-dimensional series, the way a fill handle extends it:
 * numbers continue their step, "Q1"/"Week 3"/"Jan"/"Mon" count on, anything else repeats.
 */
export function extendSeries(source: string[], n: number): string[] {
  const src = source.filter((s) => s !== undefined)
  if (!src.length) return []
  const out: string[] = []
  const nums = src.map((s) => (s.startsWith('=') || s.trim() === '' ? NaN : Number(s.replace(/[,$%\s]/g, ''))))
  const allNum = nums.every((x) => Number.isFinite(x))
  const trailing = src.map((s) => /^(.*?)(\d+)$/.exec(s))
  const allTrailing = !allNum && trailing.every((m) => m) && new Set(trailing.map((m) => m![1])).size === 1
  const monthIdx = (s: string) => { const t = s.toLowerCase(); const i = MONTHS.indexOf(t); if (i >= 0) return { i, list: MONTHS }; const j = MONTHS_LONG.indexOf(t); return j >= 0 ? { i: j, list: MONTHS_LONG } : null }
  const dayIdx = (s: string) => { const t = s.toLowerCase(); const i = DAYS.indexOf(t); if (i >= 0) return { i, list: DAYS }; const j = DAYS_LONG.indexOf(t); return j >= 0 ? { i: j, list: DAYS_LONG } : null }
  const cal = src.length && !allNum ? (src.every((s) => monthIdx(s)) ? src.map((s) => monthIdx(s)!) : src.every((s) => dayIdx(s)) ? src.map((s) => dayIdx(s)!) : null) : null
  for (let k = 1; k <= n; k++) {
    if (allNum && src.length >= 1) {
      const step = src.length >= 2 ? nums[nums.length - 1]! - nums[nums.length - 2]! : src.length === 1 && Number.isInteger(nums[0]) ? 1 : 0
      const v = nums[nums.length - 1]! + step * k
      out.push(String(Number(v.toFixed(10))))
    } else if (allTrailing) {
      const prefix = trailing[0]![1]!
      const last = Number(trailing[trailing.length - 1]![2])
      const step = trailing.length >= 2 ? last - Number(trailing[trailing.length - 2]![2]) : 1
      out.push(`${prefix}${last + step * k}`)
    } else if (cal) {
      const last = cal[cal.length - 1]!
      const step = cal.length >= 2 ? last.i - cal[cal.length - 2]!.i || 1 : 1
      const len = last.list.length
      out.push(matchCase(src[src.length - 1]!, last.list[(((last.i + step * k) % len) + len) % len]!))
    } else {
      out.push(src[(k - 1) % src.length]!)
    }
  }
  return out
}

/** Drag the fill handle from `source` to cover `target` (which contains source, extended in one direction). */
export function fillRect(sheet: SheetData, source: Rect, target: Rect): SheetData {
  const grid = readRect(sheet.cells, source)
  const down = target.r2 > source.r2, up = target.r1 < source.r1, right = target.c2 > source.c2, left = target.c1 < source.c1
  const cells = { ...sheet.cells }
  const put = (c: number, r: number, v: string) => { const key = cellKey(c, r); if (v.trim() === '') delete cells[key]; else cells[key] = v }
  const isFormula = (s: string) => s.startsWith('=')
  if (down || up) {
    for (let c = source.c1; c <= source.c2; c++) {
      const col = grid.map((line) => line[c - source.c1] ?? '')
      if (col.every(isFormula) || col.some(isFormula)) {
        // Formulas (and mixed columns) repeat the block with translated references.
        if (down) for (let r = source.r2 + 1; r <= target.r2; r++) { const i = (r - source.r1) % col.length; put(c, r, translateFormula(col[i]!, 0, r - (source.r1 + i))) }
        if (up) for (let r = source.r1 - 1; r >= target.r1; r--) { const i = (((r - source.r1) % col.length) + col.length) % col.length; put(c, r, translateFormula(col[i]!, 0, r - (source.r1 + i))) }
      } else {
        if (down) { const ext = extendSeries(col, target.r2 - source.r2); ext.forEach((v, k) => put(c, source.r2 + 1 + k, v)) }
        if (up) { const ext = extendSeries([...col].reverse(), source.r1 - target.r1); ext.forEach((v, k) => put(c, source.r1 - 1 - k, v)) }
      }
    }
  } else if (right || left) {
    for (let r = source.r1; r <= source.r2; r++) {
      const row = grid[r - source.r1] ?? []
      if (row.some(isFormula)) {
        if (right) for (let c = source.c2 + 1; c <= target.c2; c++) { const i = (c - source.c1) % row.length; put(c, r, translateFormula(row[i]!, c - (source.c1 + i), 0)) }
        if (left) for (let c = source.c1 - 1; c >= target.c1; c--) { const i = (((c - source.c1) % row.length) + row.length) % row.length; put(c, r, translateFormula(row[i]!, c - (source.c1 + i), 0)) }
      } else {
        if (right) { const ext = extendSeries(row, target.c2 - source.c2); ext.forEach((v, k) => put(source.c2 + 1 + k, r, v)) }
        if (left) { const ext = extendSeries([...row].reverse(), source.c1 - target.c1); ext.forEach((v, k) => put(source.c1 - 1 - k, r, v)) }
      }
    }
  }
  return { ...sheet, cells, rows: Math.max(sheet.rows, target.r2 + 1), cols: Math.max(sheet.cols, target.c2 + 1) }
}

/** Where a drag from the fill handle at `source` to the pointer cell `p` lands: extend in the dominant direction only. */
export function fillTarget(source: Rect, p: Pos): Rect {
  const dDown = p.r - source.r2, dUp = source.r1 - p.r, dRight = p.c - source.c2, dLeft = source.c1 - p.c
  const best = Math.max(dDown, dUp, dRight, dLeft)
  if (best <= 0) return source
  if (best === dDown) return { ...source, r2: p.r }
  if (best === dUp) return { ...source, r1: p.r }
  if (best === dRight) return { ...source, c2: p.c }
  return { ...source, c1: p.c }
}

/** Sort the rows of a rectangle by one of its columns (numbers before text; blanks last). */
export function sortRect(sheet: SheetData, r: Rect, byCol: number, dir: 'asc' | 'desc', values: Record<string, CellValue>): SheetData {
  const rows = readRect(sheet.cells, r).map((line, i) => ({ line, key: values[cellKey(byCol, r.r1 + i)] ?? null }))
  const rank = (v: CellValue) => (v === null || v === '' ? 2 : typeof v === 'number' ? 0 : 1)
  rows.sort((a, b) => {
    const ra = rank(a.key), rb = rank(b.key)
    if (ra !== rb) return ra - rb
    if (ra === 2) return 0
    const cmp = typeof a.key === 'number' && typeof b.key === 'number' ? a.key - b.key : String(isError(a.key) ? a.key.error : a.key).localeCompare(String(isError(b.key) ? b.key.error : b.key), undefined, { numeric: true, sensitivity: 'base' })
    return dir === 'asc' ? cmp : -cmp
  })
  return writeGrid(sheet, rows.map((x) => x.line), { c: r.c1, r: r.r1 })
}

export function setColumnFormat(sheet: SheetData, cols: number[], fmt: CellFormat): SheetData {
  const formats = { ...(sheet.formats ?? {}) }
  for (const c of cols) { if (fmt === 'auto') delete formats[colToLetter(c)]; else formats[colToLetter(c)] = fmt }
  return { ...sheet, formats }
}
