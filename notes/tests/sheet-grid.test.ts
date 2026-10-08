import { describe, expect, it } from 'vitest'
import { translateFormula, insertRows, deleteRows, insertCols, deleteCols, fillRect, fillTarget, extendSeries, writeGrid, tileGrid, clearRect, usedRect, rectToA1, rectOf, sortRect, mapRefs } from '@/lib/sheet/grid'
import { evaluateSheet } from '@/lib/sheet/formula'
import { normalizeSheet } from '@/lib/sheet/model'

const mk = (cells: Record<string, string>, extra: Record<string, unknown> = {}) => normalizeSheet({ rows: 10, cols: 6, cells, ...extra })

describe('formula references', () => {
  it('translates relative refs and keeps absolute ones', () => {
    expect(translateFormula('=A1+B1', 0, 1)).toBe('=A2+B2')
    expect(translateFormula('=SUM(A1:A5)*$C$1', 1, 2)).toBe('=SUM(B3:B7)*$C$1')
    expect(translateFormula('=A$1+$A1', 1, 1)).toBe('=B$1+$A2')
    expect(translateFormula('="A1 text"&A1', 0, 1)).toBe('="A1 text"&A2')
    expect(translateFormula('=LOG10(A1)', 0, 1)).toBe('=LOG10(A2)')
    expect(translateFormula('=A1', -1, 0)).toBe('=#REF!')
    expect(translateFormula('plain A1', 0, 1)).toBe('plain A1')
  })
  it('leaves function names and numbers alone', () => {
    expect(mapRefs('ROUND(1.5,0)+B2', () => null)).toBe('ROUND(1.5,0)+#REF!')
  })
})

describe('rows and columns', () => {
  it('inserting rows moves cells and formulas below the insertion point', () => {
    const s = insertRows(mk({ A1: 'x', A2: '1', A3: '=A2*2', B1: '=SUM(A2:A3)' }), 1, 2)
    expect(s.rows).toBe(12)
    expect(s.cells).toEqual({ A1: 'x', A4: '1', A5: '=A4*2', B1: '=SUM(A4:A5)' })
  })
  it('deleting rows drops the cells, shrinks ranges and breaks single refs', () => {
    const s = deleteRows(mk({ A1: '1', A2: '2', A3: '3', A4: '=SUM(A1:A3)', B1: '=A2' }), 1, 1)
    expect(s.rows).toBe(9)
    expect(s.cells).toEqual({ A1: '1', A2: '3', A3: '=SUM(A1:A2)', B1: '=#REF!' })
    expect(evaluateSheet(s.cells).values.A3).toBe(4)
  })
  it('deleting a whole range makes it #REF!', () => {
    const s = deleteRows(mk({ A1: '1', A2: '2', A5: '=SUM(A1:A2)' }), 0, 2)
    expect(s.cells).toEqual({ A3: '=SUM(#REF!)' })
  })
  it('column edits also move formats, widths and chart ranges', () => {
    const base = mk({ A1: 'a', B1: '=A1', C1: '3' }, { formats: { B: 'currency' }, widths: { B: 200 }, charts: [{ id: 'c', type: 'bar', range: 'A1:C3' }] })
    const s = insertCols(base, 1, 1)
    expect(s.cells).toEqual({ A1: 'a', C1: '=A1', D1: '3' })
    expect(s.formats).toEqual({ C: 'currency' })
    expect(s.widths).toEqual({ C: 200 })
    expect(s.charts?.[0]?.range).toBe('A1:D3')
    const d = deleteCols(s, 0, 1)
    expect(d.cells).toEqual({ B1: '=#REF!', C1: '3' })
    expect(d.charts?.[0]?.range).toBe('A1:C3')
  })
  it('never deletes the last row or column', () => {
    const s = mk({}, { rows: 1, cols: 1 })
    expect(deleteRows(s, 0, 1)).toBe(s)
    expect(deleteCols(s, 0, 1)).toBe(s)
  })
})

describe('blocks', () => {
  it('writes a pasted block, growing the sheet, and translates formulas when told where they came from', () => {
    const s = writeGrid(mk({}), [['1', '2'], ['=A1+B1', '']], { c: 4, r: 8 })
    expect(s.rows).toBe(10); expect(s.cols).toBe(6)
    expect(s.cells).toEqual({ E9: '1', F9: '2', E10: '=A1+B1' })
    const t = writeGrid(mk({}), [['=A1+B1']], { c: 0, r: 5 }, { c: 0, r: 1 })
    expect(t.cells).toEqual({ A6: '=A5+B5' })
  })
  it('tiles one value over a range', () => {
    const s = tileGrid(mk({}), [['x']], { c: 0, r: 0 }, rectOf({ c: 0, r: 0 }, { c: 1, r: 1 }))
    expect(s.cells).toEqual({ A1: 'x', B1: 'x', A2: 'x', B2: 'x' })
  })
  it('clears and measures', () => {
    const s = clearRect(mk({ A1: '1', B2: '2', C3: '3' }), rectOf({ c: 0, r: 0 }, { c: 1, r: 1 }))
    expect(s.cells).toEqual({ C3: '3' })
    expect(usedRect(s.cells)).toEqual({ c1: 2, r1: 2, c2: 2, r2: 2 })
    expect(usedRect({})).toBeNull()
    expect(rectToA1(rectOf({ c: 0, r: 0 }))).toBe('A1')
    expect(rectToA1(rectOf({ c: 2, r: 2 }, { c: 0, r: 0 }))).toBe('A1:C3')
  })
  it('sorts rows by a column', () => {
    const s = mk({ A1: 'b', B1: '2', A2: 'a', B2: '3', A3: 'c', B3: '1' })
    const sorted = sortRect(s, rectOf({ c: 0, r: 0 }, { c: 1, r: 2 }), 1, 'asc', evaluateSheet(s.cells).values)
    expect([sorted.cells.A1, sorted.cells.A2, sorted.cells.A3]).toEqual(['c', 'b', 'a'])
  })
})

describe('fill', () => {
  it('extends number series, labels with numbers, months and days', () => {
    expect(extendSeries(['1', '2'], 3)).toEqual(['3', '4', '5'])
    expect(extendSeries(['10', '20'], 2)).toEqual(['30', '40'])
    expect(extendSeries(['5'], 2)).toEqual(['6', '7'])
    expect(extendSeries(['1.5'], 2)).toEqual(['1.5', '1.5'])
    expect(extendSeries(['Q1'], 4)).toEqual(['Q2', 'Q3', 'Q4', 'Q5'])
    expect(extendSeries(['Week 1', 'Week 3'], 2)).toEqual(['Week 5', 'Week 7'])
    expect(extendSeries(['Jan'], 3)).toEqual(['Feb', 'Mar', 'Apr'])
    expect(extendSeries(['November', 'December'], 2)).toEqual(['January', 'February'])
    expect(extendSeries(['MON'], 2)).toEqual(['TUE', 'WED'])
    expect(extendSeries(['x', 'y'], 3)).toEqual(['x', 'y', 'x'])
  })
  it('drags formulas down with translated references and picks one direction', () => {
    const s = fillRect(mk({ A1: '1', A2: '2', A3: '3', B1: '=A1*2' }), rectOf({ c: 1, r: 0 }), rectOf({ c: 1, r: 0 }, { c: 1, r: 2 }))
    expect(s.cells.B2).toBe('=A2*2'); expect(s.cells.B3).toBe('=A3*2')
    expect(fillTarget(rectOf({ c: 1, r: 0 }), { c: 3, r: 1 })).toEqual({ c1: 1, r1: 0, c2: 3, r2: 0 })
    expect(fillTarget(rectOf({ c: 1, r: 0 }), { c: 1, r: 4 })).toEqual({ c1: 1, r1: 0, c2: 1, r2: 4 })
    const up = fillRect(mk({ A5: '10', A6: '20' }), rectOf({ c: 0, r: 4 }, { c: 0, r: 5 }), rectOf({ c: 0, r: 2 }, { c: 0, r: 5 }))
    expect(up.cells.A4).toBe('0'); expect(up.cells.A3).toBe('-10')
    const right = fillRect(mk({ A1: 'Jan' }), rectOf({ c: 0, r: 0 }), rectOf({ c: 0, r: 0 }, { c: 2, r: 0 }))
    expect(right.cells.B1).toBe('Feb'); expect(right.cells.C1).toBe('Mar')
  })
})
