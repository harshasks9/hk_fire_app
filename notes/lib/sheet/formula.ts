/*
  A small spreadsheet engine: Excel-style formulas over a grid of cells.

  - Cells are addressed A1-style; a cell's raw text is either a literal or a
    formula starting with "=".
  - evaluateSheet() computes every cell with memoisation and cycle detection.
  - Roughly sixty functions: math, statistics, text, logic, lookups, criteria
    (SUMIF/COUNTIF/AVERAGEIF) and the finance set (PMT, FV, PV, NPV, IRR, NPER, CAGR).
  No dates as a type: dates are text unless you compute with them.
*/

export type CellValue = number | string | boolean | null | CellError
export interface CellError { error: '#DIV/0!' | '#REF!' | '#NAME?' | '#VALUE!' | '#CYCLE!' | '#N/A' | '#NUM!'; detail?: string }
export type Cells = Record<string, string>

export const isError = (v: unknown): v is CellError => typeof v === 'object' && v !== null && 'error' in v
const err = (error: CellError['error'], detail?: string): CellError => ({ error, detail })

/* ------------------------------------------------------------- addresses */

export function colToLetter(col: number): string {
  let s = ''
  let n = col + 1
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
export function letterToCol(letters: string): number {
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}
export function cellKey(col: number, row: number): string {
  return `${colToLetter(col)}${row + 1}`
}
export function parseKey(key: string): { col: number; row: number } | null {
  const m = /^\$?([A-Z]+)\$?(\d+)$/i.exec(key.trim())
  if (!m) return null
  return { col: letterToCol(m[1]!), row: Number(m[2]) - 1 }
}
export function parseRange(range: string): { c1: number; r1: number; c2: number; r2: number } | null {
  const [a, b] = range.split(':')
  const p = parseKey(a ?? '')
  if (!p) return null
  const q = b ? parseKey(b) : p
  if (!q) return null
  return { c1: Math.min(p.col, q.col), r1: Math.min(p.row, q.row), c2: Math.max(p.col, q.col), r2: Math.max(p.row, q.row) }
}
export function rangeKeys(range: string): string[][] {
  const r = parseRange(range)
  if (!r) return []
  const out: string[][] = []
  for (let row = r.r1; row <= r.r2; row++) {
    const line: string[] = []
    for (let col = r.c1; col <= r.c2; col++) line.push(cellKey(col, row))
    out.push(line)
  }
  return out
}

/* ------------------------------------------------------------- literals */

/** What a non-formula cell means: numbers (incl. 1,200 / $3.5M / 12%) become numbers, TRUE/FALSE booleans, else text. */
export function parseLiteral(raw: string): CellValue {
  const s = raw.trim()
  if (s === '') return null
  if (/^(true|false)$/i.test(s)) return s.toLowerCase() === 'true'
  const num = parseNumberish(s)
  if (num !== null) return num
  return s
}
export function parseNumberish(s: string): number | null {
  let t = s.trim().replace(/^\$|€|£|¥/g, '').replace(/,/g, '').replace(/\s/g, '')
  let mult = 1
  if (/%$/.test(t)) { mult = 0.01; t = t.slice(0, -1) }
  else if (/[kK]$/.test(t)) { mult = 1e3; t = t.slice(0, -1) }
  else if (/[mM]$/.test(t)) { mult = 1e6; t = t.slice(0, -1) }
  else if (/[bB]$/.test(t)) { mult = 1e9; t = t.slice(0, -1) }
  if (/^\(.*\)$/.test(t)) { t = '-' + t.slice(1, -1) }
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return null
  const n = Number(t) * mult
  return Number.isFinite(n) ? n : null
}

/* ------------------------------------------------------------- tokenizer */

type Tok = { t: 'num'; v: number } | { t: 'str'; v: string } | { t: 'id'; v: string } | { t: 'ref'; v: string } | { t: 'op'; v: string } | { t: 'lp' } | { t: 'rp' } | { t: 'sep' } | { t: 'end' }

function tokenize(src: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  const s = src
  while (i < s.length) {
    const ch = s[i]!
    if (/\s/.test(ch)) { i++; continue }
    if (ch === '"') {
      let j = i + 1
      let v = ''
      while (j < s.length) {
        if (s[j] === '"') { if (s[j + 1] === '"') { v += '"'; j += 2; continue } break }
        v += s[j]; j++
      }
      out.push({ t: 'str', v }); i = j + 1; continue
    }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?%?/.exec(s.slice(i))!
      const raw = m[0]
      const pct = raw.endsWith('%')
      out.push({ t: 'num', v: Number(pct ? raw.slice(0, -1) : raw) * (pct ? 0.01 : 1) }); i += raw.length; continue
    }
    const ref = /^\$?[A-Za-z]{1,3}\$?\d{1,7}(:\$?[A-Za-z]{1,3}\$?\d{1,7})?/.exec(s.slice(i))
    if (ref && !/^[A-Za-z_][A-Za-z0-9_.]*\s*\(/.test(s.slice(i))) { out.push({ t: 'ref', v: ref[0].replace(/\$/g, '').toUpperCase() }); i += ref[0].length; continue }
    const id = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(s.slice(i))
    if (id) { out.push({ t: 'id', v: id[0].toUpperCase() }); i += id[0].length; continue }
    if (ch === '(') { out.push({ t: 'lp' }); i++; continue }
    if (ch === ')') { out.push({ t: 'rp' }); i++; continue }
    if (ch === ',' || ch === ';') { out.push({ t: 'sep' }); i++; continue }
    const two = s.slice(i, i + 2)
    if (['<=', '>=', '<>'].includes(two)) { out.push({ t: 'op', v: two }); i += 2; continue }
    if ('+-*/^&=<>%'.includes(ch)) { out.push({ t: 'op', v: ch }); i++; continue }
    throw err('#VALUE!', `Unexpected "${ch}"`)
  }
  out.push({ t: 'end' })
  return out
}

/* ------------------------------------------------------------- parser */

type Ast =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'bool'; v: boolean }
  | { k: 'ref'; v: string }
  | { k: 'range'; v: string }
  | { k: 'call'; name: string; args: Ast[] }
  | { k: 'bin'; op: string; l: Ast; r: Ast }
  | { k: 'neg'; e: Ast }
  | { k: 'pct'; e: Ast }

class Parser {
  i = 0
  constructor(readonly toks: Tok[]) {}
  peek() { return this.toks[this.i]! }
  next() { return this.toks[this.i++]! }
  parse(): Ast {
    const e = this.comparison()
    if (this.peek().t !== 'end') throw err('#VALUE!', 'Unexpected input')
    return e
  }
  comparison(): Ast {
    let l = this.concat()
    while (this.peek().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes((this.peek() as { v: string }).v)) {
      const op = (this.next() as { v: string }).v
      l = { k: 'bin', op, l, r: this.concat() }
    }
    return l
  }
  concat(): Ast {
    let l = this.additive()
    while (this.peek().t === 'op' && (this.peek() as { v: string }).v === '&') { this.next(); l = { k: 'bin', op: '&', l, r: this.additive() } }
    return l
  }
  additive(): Ast {
    let l = this.term()
    while (this.peek().t === 'op' && ['+', '-'].includes((this.peek() as { v: string }).v)) { const op = (this.next() as { v: string }).v; l = { k: 'bin', op, l, r: this.term() } }
    return l
  }
  term(): Ast {
    let l = this.power()
    while (this.peek().t === 'op' && ['*', '/'].includes((this.peek() as { v: string }).v)) { const op = (this.next() as { v: string }).v; l = { k: 'bin', op, l, r: this.power() } }
    return l
  }
  power(): Ast {
    const base = this.unary()
    if (this.peek().t === 'op' && (this.peek() as { v: string }).v === '^') { this.next(); return { k: 'bin', op: '^', l: base, r: this.power() } }
    return base
  }
  unary(): Ast {
    if (this.peek().t === 'op' && (this.peek() as { v: string }).v === '-') { this.next(); return { k: 'neg', e: this.unary() } }
    if (this.peek().t === 'op' && (this.peek() as { v: string }).v === '+') { this.next(); return this.unary() }
    let e = this.primary()
    while (this.peek().t === 'op' && (this.peek() as { v: string }).v === '%') { this.next(); e = { k: 'pct', e } }
    return e
  }
  primary(): Ast {
    const t = this.next()
    if (t.t === 'num') return { k: 'num', v: t.v }
    if (t.t === 'str') return { k: 'str', v: t.v }
    if (t.t === 'ref') return t.v.includes(':') ? { k: 'range', v: t.v } : { k: 'ref', v: t.v }
    if (t.t === 'lp') { const e = this.comparison(); if (this.next().t !== 'rp') throw err('#VALUE!', 'Missing )'); return e }
    if (t.t === 'id') {
      if (t.v === 'TRUE') return { k: 'bool', v: true }
      if (t.v === 'FALSE') return { k: 'bool', v: false }
      if (t.v === 'PI') { if (this.peek().t === 'lp') { this.next(); this.next() } return { k: 'num', v: Math.PI } }
      if (this.peek().t !== 'lp') throw err('#NAME?', t.v)
      this.next()
      const args: Ast[] = []
      if (this.peek().t !== 'rp') {
        args.push(this.comparison())
        while (this.peek().t === 'sep') { this.next(); args.push(this.comparison()) }
      }
      if (this.next().t !== 'rp') throw err('#VALUE!', 'Missing )')
      return { k: 'call', name: t.v, args }
    }
    throw err('#VALUE!', 'Unexpected token')
  }
}

export function parseFormula(src: string): Ast {
  return new Parser(tokenize(src)).parse()
}

/* ------------------------------------------------------------- evaluation */

type Resolver = (key: string) => CellValue
type Arg = CellValue | CellValue[][]

const num = (v: CellValue): number => {
  if (typeof v === 'number') return v
  if (v === null || v === '') return 0
  if (typeof v === 'boolean') return v ? 1 : 0
  if (isError(v)) throw v
  const n = parseNumberish(v)
  if (n === null) throw err('#VALUE!', `"${v}" is not a number`)
  return n
}
const str = (v: CellValue): string => {
  if (v === null) return ''
  if (isError(v)) throw v
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  return String(v)
}
const bool = (v: CellValue): boolean => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (v === null || v === '') return false
  if (isError(v)) throw v
  if (/^true$/i.test(v)) return true
  if (/^false$/i.test(v)) return false
  return true
}
const flat = (args: Arg[]): CellValue[] => args.flatMap((a) => (Array.isArray(a) ? a.flat() : [a]))
/** Numbers only, the way SUM/AVERAGE treat ranges (text and blanks in ranges are skipped; errors propagate). */
const nums = (args: Arg[]): number[] => {
  const out: number[] = []
  for (const a of args) {
    if (Array.isArray(a)) {
      for (const v of a.flat()) {
        if (isError(v)) throw v
        if (typeof v === 'number') out.push(v)
        else if (typeof v === 'boolean') continue
        else if (typeof v === 'string' && v.trim() !== '') { const n = parseNumberish(v); if (n !== null) out.push(n) }
      }
    } else if (a !== null && a !== '') out.push(num(a))
  }
  return out
}
const scalar = (a: Arg): CellValue => (Array.isArray(a) ? (a[0]?.[0] ?? null) : a)

function criterion(c: CellValue): (v: CellValue) => boolean {
  const s = str(c).trim()
  const m = /^(<>|<=|>=|<|>|=)?\s*(.*)$/.exec(s)!
  const op = m[1] ?? '='
  const rhsRaw = m[2] ?? ''
  const rhsNum = parseNumberish(rhsRaw)
  return (v) => {
    if (isError(v)) return false
    if (rhsNum !== null && (typeof v === 'number' || (typeof v === 'string' && parseNumberish(v) !== null))) {
      const n = typeof v === 'number' ? v : parseNumberish(v as string)!
      switch (op) { case '<>': return n !== rhsNum; case '<': return n < rhsNum; case '>': return n > rhsNum; case '<=': return n <= rhsNum; case '>=': return n >= rhsNum; default: return n === rhsNum }
    }
    const a = str(v).toLowerCase(), b = rhsRaw.toLowerCase()
    if (op === '<>') return a !== b
    if (op === '=') {
      if (b.includes('*') || b.includes('?')) return new RegExp('^' + b.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$').test(a)
      return a === b
    }
    return false
  }
}

const round = (x: number, d: number, mode: 'nearest' | 'up' | 'down' = 'nearest') => {
  const f = Math.pow(10, d)
  const y = x * f
  const r = mode === 'up' ? (y >= 0 ? Math.ceil(y - 1e-12) : Math.floor(y + 1e-12)) : mode === 'down' ? (y >= 0 ? Math.floor(y + 1e-12) : Math.ceil(y - 1e-12)) : Math.round(y)
  return r / f
}
const pmt = (rate: number, nper: number, pv: number, fv = 0, type = 0) => {
  if (rate === 0) return -(pv + fv) / nper
  const p = Math.pow(1 + rate, nper)
  return -(rate * (pv * p + fv)) / ((1 + rate * type) * (p - 1))
}
const fv = (rate: number, nper: number, pmtv: number, pv = 0, type = 0) => {
  if (rate === 0) return -(pv + pmtv * nper)
  const p = Math.pow(1 + rate, nper)
  return -(pv * p + (pmtv * (1 + rate * type) * (p - 1)) / rate)
}
const pvf = (rate: number, nper: number, pmtv: number, fvv = 0, type = 0) => {
  if (rate === 0) return -(fvv + pmtv * nper)
  const p = Math.pow(1 + rate, nper)
  return -(fvv + (pmtv * (1 + rate * type) * (p - 1)) / rate) / p
}
const npv = (rate: number, flows: number[]) => flows.reduce((acc, f, i) => acc + f / Math.pow(1 + rate, i + 1), 0)
const irr = (flows: number[], guess = 0.1) => {
  let r = guess
  for (let i = 0; i < 100; i++) {
    let f = 0, df = 0
    for (let t = 0; t < flows.length; t++) { f += flows[t]! / Math.pow(1 + r, t); df -= (t * flows[t]!) / Math.pow(1 + r, t + 1) }
    if (Math.abs(df) < 1e-12) break
    const nr = r - f / df
    if (!Number.isFinite(nr)) break
    if (Math.abs(nr - r) < 1e-10) return nr
    r = nr
  }
  throw err('#NUM!', 'IRR did not converge')
}
const stdev = (xs: number[], sample = true) => {
  if (xs.length < (sample ? 2 : 1)) throw err('#DIV/0!')
  const m = xs.reduce((a, b) => a + b, 0) / xs.length
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - (sample ? 1 : 0)))
}

function textFormat(v: number, fmt: string): string {
  const f = fmt.trim()
  if (/%$/.test(f)) { const d = (f.split('.')[1] ?? '').replace('%', '').length; return (v * 100).toFixed(d) + '%' }
  const grouping = f.includes(',')
  const d = (f.split('.')[1] ?? '').length
  const prefix = /^[$€£¥]/.test(f) ? f[0] : ''
  const s = grouping ? v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : v.toFixed(d)
  return prefix + s
}

function call(name: string, args: Arg[], raw: Ast[], ev: (a: Ast) => Arg): CellValue {
  const a = args
  const n = (i: number, d?: number) => (a[i] === undefined ? (d !== undefined ? d : (() => { throw err('#VALUE!', `${name} needs more arguments`) })()) : num(scalar(a[i]!)))
  const s = (i: number, d = '') => (a[i] === undefined ? d : str(scalar(a[i]!)))
  switch (name) {
    case 'SUM': return nums(a).reduce((x, y) => x + y, 0)
    case 'AVERAGE': case 'AVG': { const xs = nums(a); if (!xs.length) throw err('#DIV/0!'); return xs.reduce((x, y) => x + y, 0) / xs.length }
    case 'MIN': { const xs = nums(a); return xs.length ? Math.min(...xs) : 0 }
    case 'MAX': { const xs = nums(a); return xs.length ? Math.max(...xs) : 0 }
    case 'COUNT': return nums(a).length
    case 'COUNTA': return flat(a).filter((v) => v !== null && v !== '').length
    case 'COUNTBLANK': return flat(a).filter((v) => v === null || v === '').length
    case 'PRODUCT': return nums(a).reduce((x, y) => x * y, 1)
    case 'MEDIAN': { const xs = nums(a).sort((x, y) => x - y); if (!xs.length) throw err('#DIV/0!'); const m = xs.length >> 1; return xs.length % 2 ? xs[m]! : (xs[m - 1]! + xs[m]!) / 2 }
    case 'STDEV': case 'STDEV.S': return stdev(nums(a))
    case 'STDEV.P': case 'STDEVP': return stdev(nums(a), false)
    case 'VAR': case 'VAR.S': return stdev(nums(a)) ** 2
    case 'LARGE': { const xs = nums([a[0]!]).sort((x, y) => y - x); const k = n(1); if (k < 1 || k > xs.length) throw err('#NUM!'); return xs[k - 1]! }
    case 'SMALL': { const xs = nums([a[0]!]).sort((x, y) => x - y); const k = n(1); if (k < 1 || k > xs.length) throw err('#NUM!'); return xs[k - 1]! }
    case 'RANK': { const v = n(0); const xs = nums([a[1]!]); const asc = a[2] !== undefined && bool(scalar(a[2]!)); const sorted = [...xs].sort((x, y) => (asc ? x - y : y - x)); const i = sorted.indexOf(v); if (i < 0) throw err('#N/A'); return i + 1 }
    case 'ABS': return Math.abs(n(0))
    case 'ROUND': return round(n(0), n(1, 0))
    case 'ROUNDUP': return round(n(0), n(1, 0), 'up')
    case 'ROUNDDOWN': case 'TRUNC': return round(n(0), n(1, 0), 'down')
    case 'INT': return Math.floor(n(0))
    case 'FLOOR': { const m = n(1, 1); return m === 0 ? 0 : Math.floor(n(0) / m) * m }
    case 'CEILING': { const m = n(1, 1); return m === 0 ? 0 : Math.ceil(n(0) / m) * m }
    case 'MOD': { const d = n(1); if (d === 0) throw err('#DIV/0!'); return n(0) - d * Math.floor(n(0) / d) }
    case 'POWER': return Math.pow(n(0), n(1))
    case 'SQRT': { const x = n(0); if (x < 0) throw err('#NUM!'); return Math.sqrt(x) }
    case 'EXP': return Math.exp(n(0))
    case 'LN': { const x = n(0); if (x <= 0) throw err('#NUM!'); return Math.log(x) }
    case 'LOG': { const x = n(0); const b = n(1, 10); if (x <= 0 || b <= 0) throw err('#NUM!'); return Math.log(x) / Math.log(b) }
    case 'LOG10': { const x = n(0); if (x <= 0) throw err('#NUM!'); return Math.log10(x) }
    case 'SIGN': return Math.sign(n(0))
    case 'IF': { const c = bool(scalar(a[0] ?? null)); const branch = c ? raw[1] : raw[2]; return branch ? scalar(ev(branch)) : c }
    case 'IFS': { for (let i = 0; i + 1 < raw.length; i += 2) if (bool(scalar(ev(raw[i]!)))) return scalar(ev(raw[i + 1]!)); throw err('#N/A') }
    case 'IFERROR': { try { const v = scalar(ev(raw[0]!)); if (isError(v)) throw v; return v } catch { return raw[1] ? scalar(ev(raw[1])) : null } }
    case 'AND': return flat(a).every((v) => bool(v))
    case 'OR': return flat(a).some((v) => bool(v))
    case 'NOT': return !bool(scalar(a[0] ?? null))
    case 'XOR': return flat(a).filter((v) => bool(v)).length % 2 === 1
    case 'ISBLANK': { const v = scalar(a[0] ?? null); return v === null || v === '' }
    case 'ISNUMBER': return typeof scalar(a[0] ?? null) === 'number'
    case 'ISTEXT': return typeof scalar(a[0] ?? null) === 'string'
    case 'ISERROR': return isError(scalar(a[0] ?? null))
    case 'SUMIF': case 'AVERAGEIF': case 'COUNTIF': case 'MAXIFS_1': {
      const range = Array.isArray(a[0]) ? a[0] : [[a[0] ?? null]]
      const test = criterion(scalar(a[1] ?? null))
      const sumRange = name === 'COUNTIF' ? range : Array.isArray(a[2]) ? a[2] : range
      const picked: number[] = []
      let count = 0
      range.forEach((row, ri) => row.forEach((v, ci) => {
        if (!test(v)) return
        count++
        const sv = sumRange[ri]?.[ci]
        if (typeof sv === 'number') picked.push(sv)
        else if (typeof sv === 'string' && parseNumberish(sv) !== null) picked.push(parseNumberish(sv)!)
      }))
      if (name === 'COUNTIF') return count
      if (name === 'SUMIF') return picked.reduce((x, y) => x + y, 0)
      if (!picked.length) throw err('#DIV/0!')
      return picked.reduce((x, y) => x + y, 0) / picked.length
    }
    case 'SUMIFS': case 'COUNTIFS': case 'AVERAGEIFS': {
      const isCount = name === 'COUNTIFS'
      const sumRange = isCount ? null : (Array.isArray(a[0]) ? a[0] : [[a[0] ?? null]])
      const pairs: { range: CellValue[][]; test: (v: CellValue) => boolean }[] = []
      for (let i = isCount ? 0 : 1; i + 1 < a.length; i += 2) pairs.push({ range: Array.isArray(a[i]) ? (a[i] as CellValue[][]) : [[a[i] as CellValue]], test: criterion(scalar(a[i + 1]!)) })
      const base = sumRange ?? pairs[0]?.range ?? []
      const picked: number[] = []
      let count = 0
      base.forEach((row, ri) => row.forEach((_, ci) => {
        if (!pairs.every((p) => p.test(p.range[ri]?.[ci] ?? null))) return
        count++
        const sv = sumRange?.[ri]?.[ci]
        if (typeof sv === 'number') picked.push(sv)
      }))
      if (isCount) return count
      if (name === 'SUMIFS') return picked.reduce((x, y) => x + y, 0)
      if (!picked.length) throw err('#DIV/0!')
      return picked.reduce((x, y) => x + y, 0) / picked.length
    }
    case 'SUMPRODUCT': {
      const rs = a.map((x) => (Array.isArray(x) ? x.flat() : [x]))
      const len = rs[0]?.length ?? 0
      let total = 0
      for (let i = 0; i < len; i++) total += rs.reduce((p, r) => p * (typeof r[i] === 'number' ? (r[i] as number) : 0), 1)
      return total
    }
    case 'LEN': return s(0).length
    case 'UPPER': return s(0).toUpperCase()
    case 'LOWER': return s(0).toLowerCase()
    case 'PROPER': return s(0).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    case 'TRIM': return s(0).trim().replace(/\s+/g, ' ')
    case 'LEFT': return s(0).slice(0, n(1, 1))
    case 'RIGHT': { const k = n(1, 1); return k === 0 ? '' : s(0).slice(-k) }
    case 'MID': return s(0).substr(Math.max(0, n(1) - 1), n(2))
    case 'CONCAT': case 'CONCATENATE': return flat(a).map((v) => str(v)).join('')
    case 'TEXTJOIN': { const d = s(0); const skip = bool(scalar(a[1] ?? true)); return flat(a.slice(2)).filter((v) => !skip || (v !== null && v !== '')).map((v) => str(v)).join(d) }
    case 'REPT': return s(0).repeat(Math.max(0, n(1)))
    case 'SUBSTITUTE': return s(0).split(s(1)).join(s(2))
    case 'FIND': { const i = s(1).indexOf(s(0)); if (i < 0) throw err('#VALUE!'); return i + 1 }
    case 'TEXT': return textFormat(n(0), s(1))
    case 'VALUE': return num(scalar(a[0] ?? null))
    case 'N': { const v = scalar(a[0] ?? null); return typeof v === 'number' ? v : typeof v === 'boolean' ? (v ? 1 : 0) : 0 }
    case 'PMT': return pmt(n(0), n(1), n(2), n(3, 0), n(4, 0))
    case 'FV': return fv(n(0), n(1), n(2), n(3, 0), n(4, 0))
    case 'PV': return pvf(n(0), n(1), n(2), n(3, 0), n(4, 0))
    case 'NPER': { const r = n(0), p = n(1), pv = n(2), f = n(3, 0); if (r === 0) return -(pv + f) / p; return Math.log((p - f * r) / (p + pv * r)) / Math.log(1 + r) }
    case 'NPV': return npv(n(0), nums(a.slice(1)))
    case 'IRR': return irr(nums([a[0]!]), n(1, 0.1))
    case 'CAGR': { const b = n(0), e = n(1), y = n(2); if (b <= 0 || y <= 0) throw err('#NUM!'); return Math.pow(e / b, 1 / y) - 1 }
    case 'PCT': case 'PCTCHANGE': case 'CHANGE': { const oldV = n(1); if (oldV === 0) throw err('#DIV/0!'); return (n(0) - oldV) / Math.abs(oldV) }
    case 'GROWTH_RATE': { const oldV = n(0); if (oldV === 0) throw err('#DIV/0!'); return (n(1) - oldV) / Math.abs(oldV) }
    case 'VLOOKUP': {
      const key = scalar(a[0] ?? null)
      const table = Array.isArray(a[1]) ? a[1] : [[a[1] ?? null]]
      const col = n(2) - 1
      const exact = a[3] === undefined ? false : !bool(scalar(a[3]!))
      const norm = (v: CellValue) => (typeof v === 'string' ? v.toLowerCase() : v)
      let row = table.find((r) => norm(r[0] ?? null) === norm(key))
      if (!row && !exact && typeof key === 'number') { let best: CellValue[] | undefined; for (const r of table) if (typeof r[0] === 'number' && r[0] <= key) best = r; row = best }
      if (!row) throw err('#N/A')
      return row[col] ?? null
    }
    case 'HLOOKUP': {
      const key = scalar(a[0] ?? null)
      const table = Array.isArray(a[1]) ? a[1] : [[a[1] ?? null]]
      const rowIdx = n(2) - 1
      const norm = (v: CellValue) => (typeof v === 'string' ? v.toLowerCase() : v)
      const ci = (table[0] ?? []).findIndex((v) => norm(v) === norm(key))
      if (ci < 0) throw err('#N/A')
      return table[rowIdx]?.[ci] ?? null
    }
    case 'INDEX': { const table = Array.isArray(a[0]) ? a[0] : [[a[0] ?? null]]; const r = n(1); const c = n(2, 1); const v = table[r - 1]?.[c - 1]; if (v === undefined) throw err('#REF!'); return v }
    case 'MATCH': { const key = scalar(a[0] ?? null); const list = flat([a[1] ?? null]); const norm = (v: CellValue) => (typeof v === 'string' ? v.toLowerCase() : v); const i = list.findIndex((v) => norm(v) === norm(key)); if (i < 0) throw err('#N/A'); return i + 1 }
    case 'CHOOSE': { const i = n(0); const v = raw[i]; if (!v) throw err('#VALUE!'); return scalar(ev(v)) }
    case 'ROWS': return Array.isArray(a[0]) ? a[0].length : 1
    case 'COLUMNS': return Array.isArray(a[0]) ? (a[0][0]?.length ?? 0) : 1
    case 'TODAY': return new Date().toISOString().slice(0, 10)
    case 'NOW': return new Date().toISOString().slice(0, 16).replace('T', ' ')
    case 'YEAR': case 'MONTH': case 'DAY': { const d = new Date(s(0)); if (Number.isNaN(d.getTime())) throw err('#VALUE!'); return name === 'YEAR' ? d.getUTCFullYear() : name === 'MONTH' ? d.getUTCMonth() + 1 : d.getUTCDate() }
    case 'DAYS': { const a1 = new Date(s(0)), b1 = new Date(s(1)); if (Number.isNaN(a1.getTime()) || Number.isNaN(b1.getTime())) throw err('#VALUE!'); return Math.round((a1.getTime() - b1.getTime()) / 86400000) }
    case 'RAND': return Math.random()
    default: throw err('#NAME?', name)
  }
}

export interface EvalResult { values: Record<string, CellValue>; formulas: Set<string> }

/** Compute every cell. `cells` maps A1 keys to raw text. */
export function evaluateSheet(cells: Cells): EvalResult {
  const memo = new Map<string, CellValue>()
  const visiting = new Set<string>()
  const formulas = new Set<string>()
  const resolve: Resolver = (key) => {
    const k = key.toUpperCase()
    if (memo.has(k)) return memo.get(k)!
    const raw = cells[k] ?? ''
    if (!raw.startsWith('=')) {
      const v = parseLiteral(raw)
      memo.set(k, v)
      return v
    }
    formulas.add(k)
    if (visiting.has(k)) return err('#CYCLE!')
    visiting.add(k)
    let v: CellValue
    try {
      v = evalAst(parseFormula(raw.slice(1)), resolve)
    } catch (e) {
      v = isError(e) ? e : err('#VALUE!', String((e as Error).message ?? e))
    }
    visiting.delete(k)
    memo.set(k, v)
    return v
  }
  const values: Record<string, CellValue> = {}
  for (const k of Object.keys(cells)) values[k.toUpperCase()] = resolve(k)
  return { values, formulas }
}

/** Evaluate one formula (without the leading "=") against a resolver. */
export function evaluateFormula(src: string, resolve: Resolver): CellValue {
  try {
    return evalAst(parseFormula(src), resolve)
  } catch (e) {
    return isError(e) ? e : err('#VALUE!', String((e as Error).message ?? e))
  }
}

function evalAst(ast: Ast, resolve: Resolver): CellValue {
  const ev = (a: Ast): Arg => {
    switch (a.k) {
      case 'num': return a.v
      case 'str': return a.v
      case 'bool': return a.v
      case 'ref': return resolve(a.v)
      case 'range': return rangeKeys(a.v).map((row) => row.map((k) => resolve(k)))
      case 'neg': return -num(scalar(ev(a.e)))
      case 'pct': return num(scalar(ev(a.e))) / 100
      case 'call': {
        const lazy = ['IF', 'IFS', 'IFERROR', 'CHOOSE'].includes(a.name)
        const args = lazy ? a.args.map((x, i) => (a.name === 'IF' && i === 0) || (a.name === 'CHOOSE' && i === 0) ? ev(x) : (null as Arg)) : a.args.map(ev)
        return call(a.name, args, a.args, ev)
      }
      case 'bin': {
        const l = scalar(ev(a.l)), r = scalar(ev(a.r))
        if (isError(l)) throw l
        if (isError(r)) throw r
        switch (a.op) {
          case '+': return num(l) + num(r)
          case '-': return num(l) - num(r)
          case '*': return num(l) * num(r)
          case '/': { const d = num(r); if (d === 0) throw err('#DIV/0!'); return num(l) / d }
          case '^': return Math.pow(num(l), num(r))
          case '&': return str(l) + str(r)
          case '=': return eq(l, r)
          case '<>': return !eq(l, r)
          case '<': return cmp(l, r) < 0
          case '>': return cmp(l, r) > 0
          case '<=': return cmp(l, r) <= 0
          case '>=': return cmp(l, r) >= 0
        }
        throw err('#VALUE!')
      }
    }
  }
  const v = ev(ast)
  return scalar(v)
}
const eq = (l: CellValue, r: CellValue) => (typeof l === 'string' && typeof r === 'string' ? l.toLowerCase() === r.toLowerCase() : (l ?? '') === (r ?? '') || (typeof l === 'number' && typeof r === 'string' && parseNumberish(r) === l) || (typeof r === 'number' && typeof l === 'string' && parseNumberish(l) === r))
const cmp = (l: CellValue, r: CellValue) => {
  if (typeof l === 'number' || typeof r === 'number') return num(l) - num(r)
  return str(l).toLowerCase().localeCompare(str(r).toLowerCase())
}

/* ------------------------------------------------------------- display */

export type CellFormat = 'auto' | 'number' | 'integer' | 'currency' | 'percent' | 'text'

export function formatValue(v: CellValue, fmt: CellFormat = 'auto', currency = '$'): string {
  if (v === null || v === undefined) return ''
  if (isError(v)) return v.error
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
  if (typeof v === 'string') return v
  if (!Number.isFinite(v)) return '#NUM!'
  switch (fmt) {
    case 'integer': return Math.round(v).toLocaleString('en-US')
    case 'currency': return (v < 0 ? '-' : '') + currency + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    case 'percent': return (v * 100).toLocaleString('en-US', { maximumFractionDigits: 1 }) + '%'
    case 'text': return String(v)
    case 'number': return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default: {
      if (Number.isInteger(v)) return v.toLocaleString('en-US')
      const abs = Math.abs(v)
      return v.toLocaleString('en-US', { maximumFractionDigits: abs >= 100 ? 1 : abs >= 1 ? 2 : 4 })
    }
  }
}

/* ------------------------------------------------------------- clipboard */

/** Rows and columns from pasted text: tab-separated (Excel, Numbers, Sheets) or CSV with quotes. */
export function parseGrid(text: string): string[][] {
  const t = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (!t.trim()) return []
  if (t.includes('\t')) return t.split('\n').map((line) => line.split('\t'))
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]!
    if (quoted) {
      if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++ } else quoted = false }
      else cell += ch
      continue
    }
    if (ch === '"') { quoted = true; continue }
    if (ch === ',') { row.push(cell); cell = ''; continue }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue }
    cell += ch
  }
  row.push(cell)
  rows.push(row)
  return rows
}

export function gridToTsv(values: string[][]): string {
  return values.map((r) => r.join('\t')).join('\n')
}
