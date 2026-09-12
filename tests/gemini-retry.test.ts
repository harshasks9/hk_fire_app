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
