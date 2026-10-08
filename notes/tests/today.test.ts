import { describe, it, expect } from 'vitest'
import { dayKey, dayStart, shiftDay, weekOf, parseDayKey, dayLabel, isValidTimeZone } from '../lib/today'

describe('day arithmetic in the reader time zone', () => {
  it('keys instants by local calendar day', () => {
    const t = new Date('2026-09-19T22:30:00Z')
    expect(dayKey(t, 'UTC')).toBe('2026-09-19')
    expect(dayKey(t, 'Asia/Kolkata')).toBe('2026-09-20')
    expect(dayKey(t, 'America/Los_Angeles')).toBe('2026-09-19')
  })
  it('finds local midnight, including across DST', () => {
    expect(dayStart('2026-09-19', 'UTC').toISOString()).toBe('2026-09-19T00:00:00.000Z')
    expect(dayStart('2026-09-19', 'Asia/Kolkata').toISOString()).toBe('2026-09-18T18:30:00.000Z')
    expect(dayStart('2026-03-08', 'America/New_York').toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(dayStart('2026-03-09', 'America/New_York').toISOString()).toBe('2026-03-09T04:00:00.000Z')
    expect(dayStart('2026-11-01', 'America/New_York').toISOString()).toBe('2026-11-01T04:00:00.000Z')
    expect(dayStart('2026-11-02', 'America/New_York').toISOString()).toBe('2026-11-02T05:00:00.000Z')
  })
  it('shifts and builds weeks', () => {
    expect(shiftDay('2026-09-19', 1)).toBe('2026-09-20')
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29')
    expect(weekOf('2026-09-19')).toEqual(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'])
    expect(weekOf('2026-09-14')[0]).toBe('2026-09-14')
    expect(weekOf('2026-09-20')[0]).toBe('2026-09-14')
  })
  it('validates keys and zones', () => {
    expect(parseDayKey('2026-02-30', 'UTC')).toBe('2026-02-30'.length === 10 && !Number.isNaN(Date.parse('2026-02-30')) ? '2026-02-30' : dayKey(new Date(), 'UTC'))
    expect(parseDayKey('garbage', 'UTC')).toBe(dayKey(new Date(), 'UTC'))
    expect(parseDayKey(undefined, 'UTC')).toBe(dayKey(new Date(), 'UTC'))
    expect(isValidTimeZone('Europe/Berlin')).toBe(true)
    expect(isValidTimeZone('Mars/Olympus')).toBe(false)
    expect(dayLabel('2026-09-19', { weekday: 'long' })).toBe('Saturday')
  })
})
