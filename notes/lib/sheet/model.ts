/* The shape of a sheet block stored in a note, and the helpers that turn a range into chart data. */
import { evaluateSheet, formatValue, parseRange, cellKey, type CellFormat, type CellValue, type Cells, isError } from './formula'

export type ChartType = 'bar' | 'line' | 'area' | 'pie'
export interface SheetChart { id: string; type: ChartType; range: string; title?: string }
export interface SheetData {
  title?: string
  rows: number
  cols: number
  cells: Cells
  /** Column letter → display format. */
  formats?: Record<string, CellFormat>
  /** Column letter → width in px (unset columns use the default). */
  widths?: Record<string, number>
  charts?: SheetChart[]
}

export const DEFAULT_SHEET: SheetData = { rows: 8, cols: 5, cells: {}, formats: {}, charts: [] }

export function normalizeSheet(raw: unknown): SheetData {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Partial<SheetData>
  const rows = Math.max(1, Math.min(1000, Number(o.rows) || DEFAULT_SHEET.rows))
  const cols = Math.max(1, Math.min(104, Number(o.cols) || DEFAULT_SHEET.cols))
  const cells: Cells = {}
  for (const [k, v] of Object.entries(o.cells ?? {})) if (typeof v === 'string' && v !== '') cells[k.toUpperCase()] = v
  const widths: Record<string, number> = {}
  for (const [k, v] of Object.entries(o.widths ?? {})) if (typeof v === 'number' && v >= 40 && v <= 800) widths[k.toUpperCase()] = Math.round(v)
  return { title: typeof o.title === 'string' ? o.title : undefined, rows, cols, cells, formats: (o.formats ?? {}) as Record<string, CellFormat>, widths, charts: Array.isArray(o.charts) ? (o.charts as SheetChart[]).filter((c) => c && typeof c.range === 'string') : [] }
}

export interface Series { name: string; values: (number | null)[] }
export interface ChartData { labels: string[]; series: Series[] }

/** A range → labels (first column, when it is text) + one series per remaining column (header row when the first row is text). */
export function chartDataFromRange(sheet: SheetData, range: string, values?: Record<string, CellValue>): ChartData {
  const r = parseRange(range)
  if (!r) return { labels: [], series: [] }
  const vals = values ?? evaluateSheet(sheet.cells).values
  const at = (c: number, row: number): CellValue => vals[cellKey(c, row)] ?? null
  const isNum = (v: CellValue) => typeof v === 'number'
  const width = r.c2 - r.c1 + 1
  const firstRowText = Array.from({ length: width }, (_, i) => at(r.c1 + i, r.r1)).some((v) => typeof v === 'string' && v.trim() !== '') && !Array.from({ length: width }, (_, i) => at(r.c1 + i, r.r1)).every(isNum)
  const dataStart = firstRowText ? r.r1 + 1 : r.r1
  const firstColLabels = Array.from({ length: r.r2 - dataStart + 1 }, (_, i) => at(r.c1, dataStart + i)).some((v) => typeof v === 'string') || width > 1
  const labels: string[] = []
  for (let row = dataStart; row <= r.r2; row++) labels.push(firstColLabels ? formatValue(at(r.c1, row)) || `Row ${row + 1}` : `Row ${row + 1}`)
  const series: Series[] = []
  const firstDataCol = firstColLabels ? r.c1 + 1 : r.c1
  for (let c = firstDataCol; c <= r.c2; c++) {
    const header = firstRowText ? formatValue(at(c, r.r1)) : ''
    const vs: (number | null)[] = []
    for (let row = dataStart; row <= r.r2; row++) {
      const v = at(c, row)
      vs.push(isNum(v) ? (v as number) : typeof v === 'string' && !Number.isNaN(Number(v.replace(/[,$%]/g, ''))) && v.trim() !== '' ? Number(v.replace(/[,$%]/g, '')) : null)
    }
    if (vs.some((v) => v !== null)) series.push({ name: header || colToName(c), values: vs })
  }
  return { labels, series }
}

function colToName(c: number): string {
  return cellKey(c, 0).replace(/\d+$/, '')
}

/** The computed grid as strings, for text/markdown projections and the read-only view. */
export function sheetToGrid(sheet: SheetData): { header: string[]; rows: string[][] } {
  const { values } = evaluateSheet(sheet.cells)
  const header = Array.from({ length: sheet.cols }, (_, c) => colToName(c))
  const rows: string[][] = []
  for (let r = 0; r < sheet.rows; r++) {
    const line: string[] = []
    for (let c = 0; c < sheet.cols; c++) {
      const v = values[cellKey(c, r)]
      line.push(v === undefined ? '' : formatValue(v, sheet.formats?.[colToName(c)] ?? 'auto'))
    }
    rows.push(line)
  }
  // Drop trailing empty rows so projections stay short.
  while (rows.length && rows[rows.length - 1]!.every((x) => x === '')) rows.pop()
  return { header, rows }
}

export function sheetToText(sheet: SheetData): string {
  const { rows } = sheetToGrid(sheet)
  const lines = rows.map((r) => r.join(' | ').replace(/(\s\|\s)+$/, ''))
  return [sheet.title ? `Sheet: ${sheet.title}` : 'Sheet', ...lines].join('\n')
}

export function sheetToMarkdown(sheet: SheetData): string {
  const { header, rows } = sheetToGrid(sheet)
  if (!rows.length) return sheet.title ? `**${sheet.title}** (empty sheet)\n\n` : ''
  const width = Math.max(1, ...rows.map((r) => r.findLastIndex((x) => x !== '') + 1))
  const h = header.slice(0, width)
  const md = [`| ${h.join(' | ')} |`, `| ${h.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.slice(0, width).map((x) => x.replace(/\|/g, '\\|')).join(' | ')} |`)].join('\n')
  return `${sheet.title ? `**${sheet.title}**\n\n` : ''}${md}\n\n`
}

export { isError }
