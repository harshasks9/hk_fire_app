import { describe, expect, it, vi } from 'vitest'
import { markGeminiModelUnavailable, rankGenerationModels } from '@/lib/ai/gemini-models'

describe('markGeminiModelUnavailable', () => {
  it('skips a model with a spent daily quota until the skip window passes, and a retired one for good', () => {
    vi.useFakeTimers()
    const names = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash']
    markGeminiModelUnavailable('gemini-3.8-flash', 60_000)
    markGeminiModelUnavailable('gemini-3.7-flash')
    expect(rankGenerationModels(names)[0]).toBe('gemini-3.6-flash')
    vi.advanceTimersByTime(61_000)
    expect(rankGenerationModels(names)).toEqual(['gemini-3.8-flash', 'gemini-3.6-flash'])
    vi.useRealTimers()
  })
})
