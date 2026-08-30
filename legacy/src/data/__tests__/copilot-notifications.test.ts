import { describe, it, expect } from 'vitest'
import { COPILOT_INTENTS, matchIntent } from '@/app/copilotEngine'
import { buildNotifications } from '@/app/notifications'
import { SUGGESTIONS } from '@/data/suggestions'

describe('copilot engine', () => {
  it('matches natural phrasings to intents', () => {
    expect(matchIntent('what changed this month?', 'simple')?.id).toBe('changed')
    expect(matchIntent('where am I overexposed', 'simple')?.id).toBe('overexposed')
    expect(matchIntent('show the tax impact of selling nvda', 'pro')?.id).toBe('tax-sell')
  })

  it('refuses to answer what it cannot ground in records', () => {
    expect(matchIntent('xyzzy quux plugh', 'simple')).toBeNull()
  })

  it('every intent answers with a headline, at least one fact, and citations — never invented values', () => {
    for (const intent of COPILOT_INTENTS) {
      for (const c of ['USD', 'INR'] as const) {
        const a = intent.answer(c)
        expect(a.headline.length, intent.id).toBeGreaterThan(10)
        expect(a.facts.length, intent.id).toBeGreaterThan(0)
        expect(a.citations.length, intent.id).toBeGreaterThan(0)
      }
    }
  })

  it('estimates are separated from facts where models are involved', () => {
    const changed = COPILOT_INTENTS.find((i) => i.id === 'changed')!.answer('USD')
    expect(changed.estimates?.length).toBeGreaterThan(0)
    const taxSell = COPILOT_INTENTS.find((i) => i.id === 'tax-sell')!.answer('USD')
    expect(taxSell.assumptions?.length).toBeGreaterThan(0)
    expect(taxSell.missing?.length).toBeGreaterThan(0)
  })
})

describe('notification centre', () => {
  const notifs = buildNotifications()

  it('surfaces open alerts, high-priority data issues and near-term obligations', () => {
    expect(notifs.length).toBeGreaterThan(5)
    expect(notifs.some((n) => n.title.includes('AAPL covered call'))).toBe(true)
    expect(notifs.some((n) => n.id === 'n-doc-fid-jul')).toBe(true)
  })

  it('every notification is actionable — it must navigate somewhere', () => {
    for (const n of notifs) {
      expect(n.to.startsWith('/')).toBe(true)
      expect(n.title.length).toBeGreaterThan(0)
    }
  })
})

describe('suggestion quality gates', () => {
  it('the four categories are all represented and never blurred', () => {
    const cats = new Set(SUGGESTIONS.map((s) => s.category))
    expect(cats).toEqual(new Set(['observation', 'alert', 'opportunity', 'recommendation']))
  })

  it('every suggestion explains itself: what, why, confidence and supporting records', () => {
    for (const s of SUGGESTIONS) {
      expect(s.what.length, s.id).toBeGreaterThan(20)
      expect(s.why.length, s.id).toBeGreaterThan(20)
      expect(s.confidence).toBeGreaterThan(0)
      expect(s.confidence).toBeLessThanOrEqual(1)
      expect(s.supportingRecords.length, s.id).toBeGreaterThan(0)
    }
  })

  it('recommendations with materially incomplete data are flagged as such', () => {
    const harvest = SUGGESTIONS.find((s) => s.id === 'sug-2')!
    expect(harvest.missingData?.length).toBeGreaterThan(0)
  })
})
