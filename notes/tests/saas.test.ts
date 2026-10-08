import { describe, expect, it } from 'vitest'
import { normalizePlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '@/lib/platform'
import { createSessionToken, readSessionToken } from '@/lib/auth'
import { validatePassword, validateEmail } from '@/lib/signup'
import { textToHtml, verifyEmailMessage, resetPasswordMessage, inviteMessage } from '@/lib/email'

describe('platform settings', () => {
  it('fills defaults and drops bad values', () => {
    expect(normalizePlatformSettings(undefined)).toEqual(DEFAULT_PLATFORM_SETTINGS)
    const s = normalizePlatformSettings({ signupMode: 'invite', requireEmailVerification: 'yes', announcement: 'x'.repeat(400), productName: '  ' })
    expect(s.signupMode).toBe('invite')
    expect(s.requireEmailVerification).toBe(false)
    expect(s.announcement).toHaveLength(300)
    expect(s.productName).toBe('Notes')
  })
})

describe('sessions and token versions', () => {
  it('carry the token version so "sign out everywhere" can invalidate cookies', async () => {
    const t = await createSessionToken({ u: 'user_1', n: 'nb_1', r: 'owner', v: 3 })
    expect((await readSessionToken(t))?.v).toBe(3)
    const legacy = await createSessionToken({ u: 'user_1', n: 'nb_1', r: 'owner' })
    expect((await readSessionToken(legacy))?.v).toBeUndefined()
  })
})

describe('sign-up validation', () => {
  it('rejects weak passwords and bad emails', () => {
    expect(validatePassword('short')).toBeTruthy()
    expect(validatePassword('aaaaaaaa')).toBeTruthy()
    expect(validatePassword('password')).toBeTruthy()
    expect(validatePassword('correct horse battery')).toBeNull()
    expect(validateEmail('nope')).toBeTruthy()
    expect(validateEmail(null)).toBeTruthy()
    expect(validateEmail('ada@example.com')).toBeNull()
  })
})

describe('emails', () => {
  it('render links and escape html', () => {
    const m = verifyEmailMessage({ to: 'a@b.co', name: 'Ada', link: 'https://x.test/api/auth/verify?token=abc', productName: 'Notes' })
    expect(m.subject).toContain('Notes')
    expect(m.text).toContain('https://x.test/api/auth/verify?token=abc')
    const html = textToHtml('Hi <b>\n\nhttps://x.test/a?b=1')
    expect(html).toContain('&lt;b&gt;')
    expect(html).toContain('<a href="https://x.test/a?b=1">')
    expect(resetPasswordMessage({ to: 'a@b.co', name: 'Ada', link: 'L', productName: 'P' }).text).toContain('one hour')
    expect(inviteMessage({ to: 'a@b.co', inviter: 'Bo', notebook: 'NB', link: 'L', productName: 'P', role: 'owner' }).text).toContain('an owner')
  })
})
