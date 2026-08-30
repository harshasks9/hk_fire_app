import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Device lock (honest auth)', () => {
  test('unauthenticated visitors are redirected to the lock screen', async ({ page }) => {
    await boot(page, { auth: false })
    await go(page, '/')
    await expect(page).toHaveURL(/#\/auth/)
    // A fresh device gets the setup form, and the screen says exactly what it is
    await expect(page.getByRole('heading', { name: 'Set up this device' })).toBeVisible()
    await expect(page.getByText('Device lock only — data stays in this browser')).toBeVisible()
  })

  test('first-run setup requires a name, stores it, and skips the demo tour', async ({ page }) => {
    await boot(page, { auth: false, onboarded: false, dataMode: 'personal' })
    await go(page, '/auth')
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page.getByText('Enter a name — it only labels this space.')).toBeVisible()
    await page.getByLabel(/Your name/i).fill('Harsha')
    await page.getByRole('button', { name: 'Start' }).click()
    // Straight to the personal dashboard — no fictional onboarding steps
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByText(/Welcome, Harsha/)).toBeVisible()
  })

  test('a passcode set at setup is actually enforced on the next unlock', async ({ page }) => {
    await boot(page, { auth: false, onboarded: false, dataMode: 'personal' })
    await go(page, '/auth')
    await page.getByLabel(/Your name/i).fill('Harsha')
    await page.locator('input[type="password"]').first().fill('meridian1')
    await page.locator('input[type="password"]').nth(1).fill('meridian1')
    await page.getByRole('button', { name: 'Start' }).click()
    await expect(page).toHaveURL(/#\/$/)

    // Lock again from Settings, then verify the wrong passcode is rejected
    await go(page, '/settings')
    await page.getByRole('button', { name: 'Lock app' }).click()
    await expect(page).toHaveURL(/#\/auth/)
    await page.getByPlaceholder('Passcode').fill('wrong')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page.getByText('That’s not the passcode set on this device.')).toBeVisible()
    await page.getByPlaceholder('Passcode').fill('meridian1')
    await page.getByRole('button', { name: 'Unlock' }).click()
    await expect(page).toHaveURL(/#\/$/)
  })

  test('there are no fake security affordances on the lock screen', async ({ page }) => {
    await boot(page, { auth: false })
    await go(page, '/auth')
    await expect(page.getByText(/passkey/i)).toHaveCount(0)
    await expect(page.getByText(/two-factor|MFA/i)).toHaveCount(0)
    await expect(page.getByText(/SOC 2|encrypted at rest/i)).toHaveCount(0)
  })
})

test.describe('Onboarding (three real choices)', () => {
  test('every choice takes effect: dataset, mode, currency', async ({ page }) => {
    await boot(page, { auth: true, onboarded: false })
    await go(page, '/onboarding')
    await expect(page.getByRole('heading', { name: 'Welcome to Meridian' })).toBeVisible()

    await page.getByRole('button', { name: /Demo household/ }).click()
    await page.getByRole('button', { name: /^Pro/ }).click()
    await page.getByRole('button', { name: /Indian Rupee/ }).click()
    await page.getByRole('button', { name: 'Explore the demo' }).click()

    await expect(page).toHaveURL(/#\/$/)
    // Demo banner proves the dataset choice landed; INR symbol proves currency did
    await expect(page.getByText('Demo data — every number on screen belongs to a fictional household')).toBeVisible()
    await expect(page.getByText('₹').first()).toBeVisible()
  })

  test('choosing "My data" starts the empty personal workspace', async ({ page }) => {
    await boot(page, { auth: true, onboarded: false })
    await go(page, '/onboarding')
    await page.getByRole('button', { name: /^My data/ }).click()
    await page.getByRole('button', { name: 'Start with my data' }).click()
    await expect(page).toHaveURL(/#\/$/)
    await expect(page.getByText('This space is empty on purpose.')).toBeVisible()
  })
})
