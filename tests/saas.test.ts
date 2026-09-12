import { describe, expect, it } from 'vitest'
import { createHmac } from 'node:crypto'
import { PLANS, effectivePlan, quotaLines, monthStart, UNLIMITED, isPlanId } from '@/lib/plans'
import { normalizePlatformSettings, DEFAULT_PLATFORM_SETTINGS } from '@/lib/platform'
import { createSessionToken, readSessionToken } from '@/lib/auth'
import { validatePassword, validateEmail } from '@/lib/signup'
import { verifyStripeSignature } from '@/lib/billing'
import { textToHtml, verifyEmailMessage, resetPasswordMessage, inviteMessage } from '@/lib/email'

describe('plans', () => {
  it('lapsed paid plans count as free, others as stored', () => {
    const past = new Date(Date.now() - 1000)
    const future = new Date(Date.now() + 86400_000)
    expect(effectivePlan({ plan: 'pro', planExpiresAt: past })).toBe('free')
    expect(effectivePlan({ plan: 'pro', planExpiresAt: future })).toBe('pro')
    expect(effectivePlan({ plan: 'team', planExpiresAt: null })).toBe('team')
    expect(effectivePlan({ plan: 'free', planExpiresAt: past })).toBe('free')
    expect(effectivePlan({ plan: 'bogus' as 'free', planExpiresAt: null })).toBe('free')
  })
  it('quota lines carry percentages and unlimited is null', () => {
    const u = { notes: 250, aiCallsMonth: 300, storageBytes: 50 * 1048576, members: 1, recordingsMonth: 0, monthStart: '' }
    const free = quotaLines('free', u)
    expect(free.find((l) => l.kind === 'notes')?.pct).toBe(50)
    expect(free.find((l) => l.kind === 'aiCallsMonth')?.pct).toBe(100)
    expect(free.find((l) => l.kind === 'storageMB')?.used).toBe(50)
    const team = quotaLines('team', u)
    expect(team.find((l) => l.kind === 'notes')?.pct).toBeNull()
    expect(PLANS.team.notes).toBe(UNLIMITED)
    expect(isPlanId('pro')).toBe(true)
    expect(isPlanId('enterprise')).toBe(false)
  })
  it('month start is the first of the UTC month', () => {
    expect(monthStart(new Date('2026-09-12T15:00:00Z')).toISOString()).toBe('2026-09-01T00:00:00.000Z')
  })
})

describe('platform settings', () => {
  it('fills defaults and drops bad values', () => {
    expect(normalizePlatformSettings(undefined)).toEqual(DEFAULT_PLATFORM_SETTINGS)
    const s = normalizePlatformSettings({ signupMode: 'invite', defaultPlan: 'gold', requireEmailVerification: 'yes', announcement: 'x'.repeat(400), productName: '  ' })
    expect(s.signupMode).toBe('invite')
    expect(s.defaultPlan).toBe('free')
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

describe('stripe webhook signature', () => {
  it('accepts a correctly signed body within tolerance and rejects otherwise', () => {
    const secret = 'whsec_test'
    const body = '{"id":"evt_1"}'
    const t = Math.floor(Date.now() / 1000)
    const v1 = createHmac('sha256', secret).update(`${t}.${body}`).digest('hex')
    expect(verifyStripeSignature(body, `t=${t},v1=${v1}`, secret)).toBe(true)
    expect(verifyStripeSignature(body + ' ', `t=${t},v1=${v1}`, secret)).toBe(false)
    expect(verifyStripeSignature(body, `t=${t - 1000},v1=${v1}`, secret)).toBe(false)
    expect(verifyStripeSignature(body, null, secret)).toBe(false)
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
