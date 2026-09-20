import { describe, expect, it } from 'vitest'
import { suggestedDelayMs } from '@/lib/ai/gemini-retry'

const res = (headers: Record<string, string> = {}) => new Response(null, { status: 429, headers })

describe('suggestedDelayMs', () => {
  it('honours Retry-After', () => {
    expect(suggestedDelayMs(res({ 'retry-after': '7' }), '', 0)).toBe(7000)
  })
  it('reads retryDelay from the Gemini error body', () => {
    expect(suggestedDelayMs(res(), '{"error":{"details":[{"retryDelay":"23s"}]}}', 0)).toBe(23_500)
  })
  it('backs off exponentially otherwise', () => {
    expect(suggestedDelayMs(res(), '', 0)).toBe(1500)
    expect(suggestedDelayMs(res(), '', 1)).toBe(4000)
    expect(suggestedDelayMs(res(), '', 9)).toBe(20_000)
  })
})

import { quotaKind } from '@/lib/ai/gemini-retry'

describe('quotaKind', () => {
  const daily = '{"error":{"code":429,"message":"You exceeded your current quota","details":[{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaValue":"20"}]}]}}'
  const minute = '{"error":{"code":429,"details":[{"violations":[{"quotaId":"GenerateRequestsPerMinutePerProjectPerModel-FreeTier"}]},{"retryDelay":"12s"}]}}'
  it('tells a daily cap from a per-minute one', () => {
    expect(quotaKind(429, daily)).toBe('daily')
    expect(quotaKind(429, minute)).toBe('minute')
    expect(quotaKind(503, daily)).toBeNull()
  })
})
