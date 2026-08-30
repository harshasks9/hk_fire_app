/*
  Week arithmetic for the loop. The programme runs on Fridays, New York time.
  Week numbers are ISO-ish: year × 100 + week index where week 1's Friday is
  the first Friday of the year (2026-01-02).
*/

const FIRST_FRIDAY_2026 = Date.UTC(2026, 0, 2)
const WEEK_MS = 7 * 24 * 3600 * 1000

/** Date parts in America/New_York for a given instant. */
export function nyParts(now: Date): { y: number; m: number; d: number; dow: number; iso: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = fmt.formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const y = Number(get('year'))
  const m = Number(get('month'))
  const d = Number(get('day'))
  const dows = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dow = dows.indexOf(get('weekday'))
  return { y, m, d, dow, iso: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}` }
}

export function isFridayNY(now: Date): boolean {
  return nyParts(now).dow === 5
}

/** The Friday (ISO date) of the week containing `now`, NY time. Weeks run Sat→Fri. */
export function fridayOfCurrentWeek(now: Date): string {
  const { iso, dow } = nyParts(now)
  const base = new Date(iso + 'T00:00:00Z')
  // days until Friday: Sat(6)→6, Sun(0)→5, Mon→4 … Fri→0
  const ahead = dow === 6 ? 6 : 5 - dow
  base.setUTCDate(base.getUTCDate() + ahead)
  return base.toISOString().slice(0, 10)
}

/** Week number for a Friday date string. */
export function weekNumberForFriday(fridayIso: string): number {
  const t = Date.UTC(
    Number(fridayIso.slice(0, 4)),
    Number(fridayIso.slice(5, 7)) - 1,
    Number(fridayIso.slice(8, 10)),
  )
  const idx = Math.round((t - FIRST_FRIDAY_2026) / WEEK_MS)
  return 202600 + idx + 1 // week 1 = 2026-01-02; extends naturally past year end
}

/** Friday ISO date for a 2026-era week number. */
export function fridayForWeekNumber(weekNumber: number): string {
  const idx = weekNumber - 202601
  return new Date(FIRST_FRIDAY_2026 + idx * WEEK_MS).toISOString().slice(0, 10)
}

/** Next Friday strictly after `now` (or today if it is Friday), NY time. */
export function upcomingFriday(now: Date): string {
  return fridayOfCurrentWeek(now)
}

/** Calendar days between two ISO dates. */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round(
    (Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / (24 * 3600 * 1000),
  )
}
