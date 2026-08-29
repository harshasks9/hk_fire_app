import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Authentication', () => {
  test('unauthenticated visitors are redirected to sign-in', async ({ page }) => {
    await boot(page, { auth: false })
    await go(page, '/')
    await expect(page).toHaveURL(/#\/auth/)
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  })

  test('access key: empty and wrong keys are rejected inline, the right key signs in', async ({ page }) => {
    await boot(page, { auth: false, onboarded: true })
    await go(page, '/auth')

    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('alert')).toContainText('access key')

    // A wrong key must not open the workspace — the gate is weak, but it is a gate.
    await page.getByLabel('Access key').fill('123456')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('alert')).toContainText('not right')
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

    await page.getByLabel('Access key').fill('888888')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByText('Net worth', { exact: false }).first()).toBeVisible()
  })

  test('a new user signing in with the access key lands in onboarding', async ({ page }) => {
    await boot(page, { auth: false, onboarded: false })
    await go(page, '/auth')
    await page.getByLabel('Access key').fill('888888')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: "Let's build your financial picture" })).toBeVisible()
  })
})

test.describe('Onboarding', () => {
  test('full Simple-mode walk: one question per screen, ends on the dashboard', async ({ page }) => {
    await boot(page, { auth: true, onboarded: false })
    await go(page, '/onboarding')

    await expect(page.getByRole('heading', { name: "Let's build your financial picture" })).toBeVisible()
    await page.getByRole('button', { name: 'Get started' }).click()

    await expect(page.getByRole('heading', { name: 'Who is this workspace for?' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: "What's your base currency?" })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Where do you have financial ties?' })).toBeVisible()
    await expect(page.getByText('NRI residency days')).toBeVisible() // US+IN combo callout
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'What are you working toward?' })).toBeVisible()
    await page.getByRole('button', { name: "Children's education" }).click()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'How do you think about risk?' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Any personal rules?' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Choose your experience' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    // Simple mode skips the Pro setup step entirely
    await expect(page.getByRole('heading', { name: 'Where do you invest?' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Add your first statement' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Do you own property?' })).toBeVisible()
    await page.getByRole('button', { name: 'Continue' }).click()

    await expect(page.getByRole('heading', { name: 'Your workspace is ready' })).toBeVisible()
    await page.getByRole('button', { name: 'Open my dashboard' }).click()

    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByText('Why it changed:')).toBeVisible({ timeout: 10_000 })
  })

  test('choosing Pro exposes the optional precision-setup step', async ({ page }) => {
    await boot(page, { auth: true, onboarded: false })
    await go(page, '/onboarding')
    await page.getByRole('button', { name: 'Get started' }).click()
    for (let i = 0; i < 6; i++) await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Choose your experience' })).toBeVisible()
    await page.getByRole('button', { name: /^Pro/ }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Pro setup' })).toBeVisible()
    await expect(page.getByText('Cost-basis method')).toBeVisible()
    await expect(page.getByText('Source precedence')).toBeVisible()
  })
})
