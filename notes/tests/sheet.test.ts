import { describe, expect, it } from 'vitest'
import { evaluateSheet, evaluateFormula, formatValue, parseGrid, parseLiteral, cellKey, parseRange, colToLetter, letterToCol, isError, type CellValue } from '@/lib/sheet/formula'

const sheet = (cells: Record<string, string>) => evaluateSheet(cells).values
const f = (src: string, cells: Record<string, string> = {}) => evaluateFormula(src, (k) => (cells[k] ? parseLiteral(cells[k]!) : null))

describe('addresses', () => {
  it('converts columns and keys', () => {
    expect(colToLetter(0)).toBe('A')
    expect(colToLetter(25)).toBe('Z')
    expect(colToLetter(26)).toBe('AA')
    expect(letterToCol('AA')).toBe(26)
    expect(cellKey(2, 4)).toBe('C5')
    expect(parseRange('B2:A1')).toEqual({ c1: 0, r1: 0, c2: 1, r2: 1 })
  })
})

describe('literals', () => {
  it('reads numbers the way people type them', () => {
    expect(parseLiteral('1,200')).toBe(1200)
    expect(parseLiteral('$3.5M')).toBe(3500000)
    expect(parseLiteral('12%')).toBeCloseTo(0.12)
    expect(parseLiteral('(40)')).toBe(-40)
    expect(parseLiteral('TRUE')).toBe(true)
    expect(parseLiteral('Nissan')).toBe('Nissan')
    expect(parseLiteral('')).toBeNull()
  })
})

describe('formulas', () => {
  it('does arithmetic with precedence, percent and text join', () => {
    expect(f('1+2*3')).toBe(7)
    expect(f('(1+2)*3')).toBe(9)
    expect(f('2^3^2')).toBe(512)
    expect(f('-2^2')).toBe(4)
    expect(f('10%')).toBeCloseTo(0.1)
    expect(f('50*10%')).toBeCloseTo(5)
    expect(f('"a"&"b"&1')).toBe('ab1')
    expect(f('1=1')).toBe(true)
    expect(f('"a"<>"A"')).toBe(false)
  })
  it('references cells and ranges', () => {
    const v = sheet({ A1: '10', A2: '20', A3: 'x', A4: '=SUM(A1:A3)', A5: '=AVERAGE(A1:A2)', B1: '=A1*2', B2: '=A1+B1', B3: '=MAX(A1:A2,B1:B2)', B4: '=COUNT(A1:A4)', B5: '=COUNTA(A1:A4)' })
    expect(v.A4).toBe(30)
    expect(v.A5).toBe(15)
    expect(v.B2).toBe(30)
    expect(v.B3).toBe(30)
    expect(v.B4).toBe(3)
    expect(v.B5).toBe(4)
  })
  it('handles IF, nested functions and errors', () => {
    expect(f('IF(1>2,"yes","no")')).toBe('no')
    expect(f('IF(A1>5,A1*2,0)', { A1: '7' })).toBe(14)
    expect(f('ROUND(2.345,2)')).toBe(2.35)
    expect(f('ROUNDUP(2.301,1)')).toBe(2.4)
    expect(f('ROUNDDOWN(-2.39,1)')).toBe(-2.3)
    expect(f('MOD(-7,3)')).toBe(2)
    expect(f('IFERROR(1/0,"n/a")')).toBe('n/a')
    const d = f('1/0')
    expect(isError(d) && d.error).toBe('#DIV/0!')
    const n = f('FOO(1)')
    expect(isError(n) && n.error).toBe('#NAME?')
  })
  it('detects cycles', () => {
    const v = sheet({ A1: '=B1+1', B1: '=A1+1' })
    expect(isError(v.A1) && v.A1.error).toBe('#CYCLE!')
  })
  it('supports criteria functions and lookups', () => {
    const cells = { A1: 'Nissan', B1: '100', A2: 'TCS', B2: '250', A3: 'Nissan', B3: '50', A4: 'Samsung', B4: '400' }
    expect(f('SUMIF(A1:A4,"Nissan",B1:B4)', cells)).toBe(150)
    expect(f('COUNTIF(B1:B4,">99")', cells)).toBe(3)
    expect(f('AVERAGEIF(A1:A4,"nissan",B1:B4)', cells)).toBe(75)
    expect(f('SUMIFS(B1:B4,A1:A4,"Nissan",B1:B4,">60")', cells)).toBe(100)
    expect(f('COUNTIF(A1:A4,"S*")', cells)).toBe(1)
    expect(f('VLOOKUP("TCS",A1:B4,2,FALSE)', cells)).toBe(250)
    expect(f('INDEX(A1:B4,4,2)', cells)).toBe(400)
    expect(f('MATCH("Samsung",A1:A4,0)', cells)).toBe(4)
    expect(f('SUMPRODUCT(B1:B4,B1:B4)', cells)).toBe(100 * 100 + 250 * 250 + 50 * 50 + 400 * 400)
    expect(f('LARGE(B1:B4,2)', cells)).toBe(250)
    expect(f('RANK(250,B1:B4)', cells)).toBe(2)
  })
  it('does finance', () => {
    expect(f('PMT(0.05/12,360,300000)')).toBeCloseTo(-1610.46, 1)
    expect(f('FV(0.07/12,120,-500)')).toBeCloseTo(86542.4, 0)
    expect(f('PV(0.06,10,-1000)')).toBeCloseTo(7360.09, 1)
    expect(f('NPV(0.1,100,100,100)')).toBeCloseTo(248.69, 1)
    expect(f('IRR(A1:A4)', { A1: '-1000', A2: '400', A3: '400', A4: '400' })).toBeCloseTo(0.0970, 3)
    expect(f('CAGR(100,200,5)')).toBeCloseTo(0.1487, 3)
    expect(f('NPER(0.05,-1000,5000)')).toBeCloseTo(5.9, 1)
  })
  it('does text and stats', () => {
    expect(f('UPPER(LEFT("nissan",3))')).toBe('NIS')
    expect(f('TEXT(0.256,"0.0%")')).toBe('25.6%')
    expect(f('TEXT(1234.5,"#,##0.00")')).toBe('1,234.50')
    expect(f('CONCAT("a",1,TRUE)')).toBe('a1TRUE')
    expect(f('MEDIAN(1,5,3)')).toBe(3)
    expect(f('STDEV(2,4,4,4,5,5,7,9)')).toBeCloseTo(2.138, 2)
    expect(f('LEN(TRIM("  hi  there "))')).toBe(8)
  })
})

describe('display and clipboard', () => {
  it('formats values', () => {
    expect(formatValue(1234567)).toBe('1,234,567')
    expect(formatValue(1234.567)).toBe('1,234.6')
    expect(formatValue(0.1234)).toBe('0.1234')
    expect(formatValue(0.256, 'percent')).toBe('25.6%')
    expect(formatValue(-42.5, 'currency')).toBe('-$42.50')
    expect(formatValue(null)).toBe('')
    expect(formatValue({ error: '#REF!' } as CellValue)).toBe('#REF!')
  })
  it('parses pasted grids', () => {
    expect(parseGrid('a\tb\n1\t2\n')).toEqual([['a', 'b'], ['1', '2']])
    expect(parseGrid('name,amount\n"Smith, J",12\n')).toEqual([['name', 'amount'], ['Smith, J', '12']])
  })
})
