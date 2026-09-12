import { describe, expect, it } from 'vitest'
import { rankGenerationModels, rankEmbeddingModels } from '@/lib/ai/gemini-models'

// The list a real key returned from ListModels on 2026-09-12.
const GENERATION = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts', 'gemma-4-26b-a4b-it', 'gemma-4-31b-it', 'gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-pro-latest', 'gemini-2.5-flash-lite', 'gemini-2.5-flash-image', 'gemini-3-flash-preview', 'gemini-3.1-pro-preview', 'gemini-3.1-pro-preview-customtools', 'gemini-3.1-flash-lite-preview', 'gemini-3.1-flash-lite', 'gemini-3-pro-image-preview', 'gemini-3-pro-image', 'nano-banana-pro-preview', 'gemini-3.1-flash-image-preview', 'gemini-3.1-flash-image', 'gemini-3.1-flash-lite-image', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-omni-flash-preview', 'gemini-omni-1.1-flash', 'gemini-3.5-transcribe', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash', 'lyria-3-clip-preview', 'lyria-3.5', 'gemini-3.1-flash-tts-preview', 'gemini-robotics-er-2-preview', 'gemini-2.5-computer-use-preview-10-2025', 'antigravity-preview-05-2026', 'deep-research-preview-04-2026']
const EMBEDDING = ['gemini-embedding-001', 'gemini-embedding-2-preview', 'gemini-embedding-2']

describe('rankGenerationModels', () => {
  it('prefers the newest stable Flash model, then aliases, then lite and pro', () => {
    const ranked = rankGenerationModels(GENERATION)
    expect(ranked.slice(0, 5)).toEqual(['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-2.5-flash'])
    expect(ranked.indexOf('gemini-flash-latest')).toBeLessThan(ranked.indexOf('gemini-3.5-flash-lite'))
    expect(ranked.indexOf('gemini-3.5-flash-lite')).toBeLessThan(ranked.indexOf('gemini-2.5-pro'))
  })
  it('never picks media, tts, transcription or non-Gemini models ahead of a text model', () => {
    const ranked = rankGenerationModels(GENERATION)
    for (const bad of ['gemini-2.5-flash-image', 'gemini-3.5-transcribe', 'gemma-4-31b-it', 'lyria-3.5', 'nano-banana-pro-preview', 'gemini-2.5-flash-preview-tts']) expect(ranked).not.toContain(bad)
  })
  it('honours an env override first', () => {
    expect(rankGenerationModels(GENERATION, 'gemini-3.6-flash')[0]).toBe('gemini-3.6-flash')
  })
})

describe('rankEmbeddingModels', () => {
  it('keeps gemini-embedding-001 first so stored vectors stay comparable, previews last', () => {
    expect(rankEmbeddingModels(EMBEDDING)).toEqual(['gemini-embedding-001', 'gemini-embedding-2', 'gemini-embedding-2-preview'])
  })
})
