/* Turn "Friday", "next week", "Sep 18", "EOD" into a due date relative to when the note was written. */
const DOW = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

export function parseDueHint(hint: string | undefined, from: Date): Date | undefined {
  if (!hint) return undefined
  const h = hint.toLowerCase().trim()
  const base = new Date(from)
  base.setHours(17, 0, 0, 0)
  const iso = h.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 17)
  if (/\b(today|eod)\b/.test(h)) return base
  if (/\btomorrow\b/.test(h)) return add(base, 1)
  if (/\b(eow|end of (the )?week|this week)\b/.test(h)) return add(base, (5 - base.getDay() + 7) % 7 || 7)
  if (/\bnext week\b/.test(h)) return add(base, ((1 - base.getDay() + 7) % 7 || 7) + 4)
  if (/\b(eom|end of (the )?month|this month)\b/.test(h)) return new Date(base.getFullYear(), base.getMonth() + 1, 0, 17)
  if (/\bnext month\b/.test(h)) return new Date(base.getFullYear(), base.getMonth() + 2, 0, 17)
  if (/\b(eoq|end of (the )?quarter)\b/.test(h)) return new Date(base.getFullYear(), Math.floor(base.getMonth() / 3) * 3 + 3, 0, 17)
  if (/\b(eoy|end of (the )?year)\b/.test(h)) return new Date(base.getFullYear(), 11, 31, 17)
  const q = h.match(/\bq([1-4])\b/)
  if (q) return new Date(base.getFullYear() + (Number(q[1]) * 3 - 1 < base.getMonth() ? 1 : 0), Number(q[1]) * 3, 0, 17)
  for (let i = 0; i < 7; i++) {
    if (new RegExp(`\\b${DOW[i]}|\\b${DOW[i]!.slice(0, 3)}\\b`).test(h)) {
      let diff = (i - base.getDay() + 7) % 7 || 7
      if (/\bnext\b/.test(h) && diff < 7) diff += 7
      return add(base, diff)
    }
  }
  const md = h.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*(\d{1,2})?/)
  if (md) {
    const m = MONTHS.indexOf(md[1]!)
    const day = md[2] ? Number(md[2]) : 0
    let year = base.getFullYear()
    const candidate = new Date(year, m, day || 28, 17)
    if (candidate < add(base, -45)) year++
    return day ? new Date(year, m, day, 17) : new Date(year, m + 1, 0, 17)
  }
  const slash = h.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (slash) {
    const y = slash[3] ? (slash[3].length === 2 ? 2000 + Number(slash[3]) : Number(slash[3])) : base.getFullYear()
    return new Date(y, Number(slash[1]) - 1, Number(slash[2]), 17)
  }
  return undefined
}

function add(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}
