import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Dashboard customization', () => {
  test('modules can be removed, the layout persists across reloads, and reset restores', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/')
    await expect(page.getByText('Performance vs benchmark')).toBeVisible()
    await page.getByRole('button', { name: 'Customize' }).click()
    // turn off the Sector exposure module
    await page
      .locator('div', { hasText: /^Sector exposure/ })
      .getByRole('switch')
      .first()
      .click()
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByText('Which sectors dominate my equities?')).toHaveCount(0)
    // persisted
    await page.reload()
    await expect(page.getByText('Performance vs benchmark')).toBeVisible()
    await expect(page.getByText('Which sectors dominate my equities?')).toHaveCount(0)
    // reset
    await page.getByRole('button', { name: 'Customize' }).click()
    await page.getByRole('button', { name: 'Reset layout' }).click()
    await page.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByText('Which sectors dominate my equities?')).toBeVisible()
  })

  test('overview exports a holdings CSV', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/')
    const dl = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export' }).click()
    expect((await dl).suggestedFilename()).toBe('meridian-overview.csv')
  })
})

test.describe('Mobile experience', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('bottom navigation with center upload; More sheet reaches secondary pages', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await expect(page.getByRole('navigation', { name: 'Mobile' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Upload a document' })).toBeVisible()
    await page.getByRole('button', { name: 'More' }).click()
    await page.getByRole('link', { name: 'Plan' }).click()
    await expect(page.getByText('Financial independence').first()).toBeVisible()
  })

  test('document capture is ≤ 3 taps: upload FAB → take photo → processing', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await page.getByRole('button', { name: 'Upload a document' }).click() // tap 1
    await page.getByRole('button', { name: 'Take photo' }).click() // tap 2
    await expect(page.getByText('Camera_Capture.jpg')).toBeVisible() // capture in flight
  })

  test('critical financial information stays visible on a phone', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await expect(page.getByText(/\$2,5\d{2},\d{3}/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Needs your attention')).toBeVisible()
  })
})

test.describe('Settings & theming', () => {
  test('dark mode toggles and applies instantly', async ({ page }) => {
    await boot(page)
    await go(page, '/settings')
    await page.getByRole('tab', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await page.getByRole('tab', { name: 'Light' }).click()
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })

  test('privacy section states plain facts and offers no fake security', async ({ page }) => {
    await boot(page)
    await go(page, '/settings')
    await expect(page.getByText('Your data & privacy')).toBeVisible()
    await expect(page.getByText(/stored in this browser only/)).toBeVisible()
    await expect(page.getByText(/convenience gate for this device, not account security/)).toBeVisible()
    // The old theater is gone
    await expect(page.getByText('Two-factor authentication')).toHaveCount(0)
    await expect(page.getByText('Active sessions')).toHaveCount(0)
    await expect(page.getByText('Data encryption')).toHaveCount(0)
  })

  test('lock app returns to the device-lock screen', async ({ page }) => {
    await boot(page)
    await go(page, '/settings')
    await page.getByRole('button', { name: 'Lock app' }).click()
    await expect(page).toHaveURL(/#\/auth/)
    await expect(page.getByText('Device lock only — data stays in this browser')).toBeVisible()
  })
})
