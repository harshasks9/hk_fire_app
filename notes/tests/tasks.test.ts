import { describe, expect, it } from 'vitest'
import { detailsFromText } from '@/lib/tasks'
import { docToText } from '@/lib/markdown'

describe('task details', () => {
  it('turns typed text into a document and back', () => {
    const doc = detailsFromText('Call the bank about the loan.\n\n- bring the statement\n- ask about the rate')
    expect(doc?.type).toBe('doc')
    const text = docToText(doc)
    expect(text).toContain('Call the bank about the loan.')
    expect(text).toContain('- bring the statement')
    expect(text).toContain('- ask about the rate')
  })
  it('keeps empty details empty', () => {
    expect(detailsFromText('   \n ')).toBeNull()
  })
})
