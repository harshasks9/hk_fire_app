import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword, encryptSecret, decryptSecret, maskSecret, temporaryPassword, sha256 } from '@/lib/crypto'
import { createSessionToken, readSessionToken } from '@/lib/auth'
import { renderTemplateString, renderTemplate, BUILT_IN_TEMPLATES, builtInBody } from '@/lib/templates'
import { parseFrontMatter, parseMarkdownFile, parseExportJson } from '@/lib/import'
import { weekKey, weekStartOf, parseWeekKey } from '@/lib/review'

describe('passwords', () => {
  it('hashes with a random salt and verifies', () => {
    const h = hashPassword('correct horse')
    expect(h.startsWith('scrypt$')).toBe(true)
    expect(verifyPassword('correct horse', h)).toBe(true)
    expect(verifyPassword('wrong', h)).toBe(false)
    expect(hashPassword('correct horse')).not.toBe(h)
  })
  it('rejects malformed hashes without throwing', () => {
    expect(verifyPassword('x', 'garbage')).toBe(false)
    expect(verifyPassword('x', null)).toBe(false)
  })
  it('generates readable temporary passwords', () => {
    expect(temporaryPassword()).toMatch(/^[a-z]+-[a-z]+-[a-z]+-\d{2}$/)
  })
})

describe('secrets at rest', () => {
  it('round-trips and masks', () => {
    const enc = encryptSecret('sk-ant-1234abcd')
    expect(enc.startsWith('v1.')).toBe(true)
    expect(enc).not.toContain('sk-ant')
    expect(decryptSecret(enc)).toBe('sk-ant-1234abcd')
    expect(maskSecret('sk-ant-1234abcd')).toBe('••••abcd')
    expect(decryptSecret('v1.notreallybase64')).toBeNull()
    expect(sha256('a')).toHaveLength(64)
  })
})

describe('session tokens', () => {
  it('carry user, notebook and role, and reject tampering and expiry', async () => {
    const t = await createSessionToken({ u: 'user_1', n: 'nb_1', r: 'owner' })
    const p = await readSessionToken(t)
    expect(p).toMatchObject({ u: 'user_1', n: 'nb_1', r: 'owner' })
    const [body, mac] = t.split('.')
    expect(await readSessionToken(`${body}x.${mac}`)).toBeNull()
    expect(await readSessionToken(t, Date.now() + 31 * 86400 * 1000)).toBeNull()
    expect(await readSessionToken(undefined)).toBeNull()
  })
})

describe('templates', () => {
  const date = new Date(2026, 8, 12, 9, 30)
  it('fills placeholders and trims dangling separators', () => {
    expect(renderTemplateString('{{title}} — {{date}}', { date, title: 'Nissan' })).toBe('Nissan — Sep 12, 2026')
    expect(renderTemplateString('{{title}} — {{date}}', { date })).toBe('Sep 12, 2026')
    expect(renderTemplateString('{{weekday}}, {{date}} at {{time}}', { date })).toBe('Saturday, Sep 12, 2026 at 9:30 AM')
  })
  it('renders every built-in without losing structure', () => {
    for (const t of BUILT_IN_TEMPLATES) {
      const r = renderTemplate(builtInBody(t.id)!, { date, notebook: 'Primary', name: 'Harsha', title: 'Acme' })
      expect(r.doc.type).toBe('doc')
      expect(r.doc.content?.length).toBeGreaterThan(2)
      expect(JSON.stringify(r.doc)).not.toContain('{{')
    }
  })
})

describe('import parsing', () => {
  it('reads front matter and strips it', () => {
    const { data, body } = parseFrontMatter('---\ntitle: Board prep\ndate: 2026-03-04\n---\n# Heading\nbody')
    expect(data.title).toBe('Board prep')
    expect(body.startsWith('# Heading')).toBe(true)
  })
  it('derives title from heading, then filename, and date from front matter or mtime', () => {
    const a = parseMarkdownFile({ name: 'x.md', text: '# Meeting with Kavya\n\nNotes here' })
    expect(a.title).toBe('Meeting with Kavya')
    expect(a.markdown).toBe('Notes here')
    const b = parseMarkdownFile({ name: 'weekly-plan_2026.md', text: 'plain text', lastModified: Date.UTC(2026, 0, 2) })
    expect(b.title).toBe('weekly plan 2026')
    expect(b.createdAt?.getUTCFullYear()).toBe(2026)
    const c = parseMarkdownFile({ name: 'c.md', text: '---\ncreated: 2025-12-31T10:00:00Z\ncontext: finance\n---\nbody' })
    expect(c.createdAt?.toISOString()).toBe('2025-12-31T10:00:00.000Z')
    expect(c.contextSlug).toBe('finance')
  })
  it('reads the app export format and maps context ids to slugs', () => {
    const notes = parseExportJson(JSON.stringify({ contexts: [{ id: 'ctx_work', slug: 'work' }], notes: [{ title: 'A', markdown: 'b', createdAt: '2026-01-01T00:00:00Z', contextId: 'ctx_work' }] }))
    expect(notes).toHaveLength(1)
    expect(notes[0]!.contextSlug).toBe('work')
  })
})

describe('weeks', () => {
  it('starts on Monday and round-trips keys', () => {
    const wed = new Date(2026, 8, 9)
    expect(weekStartOf(wed).getDay()).toBe(1)
    expect(weekKey(wed)).toBe('2026-09-07')
    expect(weekKey(parseWeekKey('2026-09-07'))).toBe('2026-09-07')
    expect(weekKey(parseWeekKey('garbage'))).toBe(weekKey(new Date()))
  })
})
