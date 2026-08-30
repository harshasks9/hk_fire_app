import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Portfolio', () => {
  test('Simple view groups by symbol and filters by asset class', async ({ page }) => {
    await boot(page)
    await go(page, '/portfolio')
    await expect(page.getByText('Investments', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /NVIDIA Corp/ })).toBeVisible()
    await page.getByRole('button', { name: 'India Stocks' }).click()
    await expect(page.getByRole('link', { name: /Reliance Industries/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /NVIDIA Corp/ })).toHaveCount(0)
  })

  test('Pro table: account filter narrows rows; sort by day change flips order', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/portfolio')
    await expect(page.getByText('Concentration')).toBeVisible()
    await page.getByLabel('All accounts').selectOption({ label: 'Zerodha — Demat — Kite' })
    await expect(page.getByText('RELIANCE').first()).toBeVisible()
    await expect(page.getByText(/Total · 4 positions/)).toBeVisible()
  })

  test('Pro table: column chooser adds realized-gains column', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/portfolio')
    await page.getByRole('button', { name: 'Columns' }).click()
    await page.getByText('Realized YTD').click()
    await expect(page.locator('th', { hasText: 'Realized YTD' })).toBeVisible()
  })

  test('position detail: lots, provenance, linked options and income', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/position/NVDA')
    await expect(page.getByRole('heading', { name: 'NVIDIA Corp.' })).toBeVisible()
    await expect(page.getByText('Tax lots')).toBeVisible()
    await expect(page.getByText('Long-term').first()).toBeVisible()
    await expect(page.getByText('Linked option strategies')).toBeVisible()
    await expect(page.getByText('Sources & update history')).toBeVisible()
    // Position held at two brokers — both provenance rows render
    await expect(page.getByText('Fidelity Individual Brokerage')).toBeVisible()
    await expect(page.getByText('Interactive Brokers Margin / Options')).toBeVisible()
  })

  test('unknown symbol shows a graceful not-found state', async ({ page }) => {
    await boot(page)
    await go(page, '/position/ZZZZ')
    await expect(page.getByText('Position not found')).toBeVisible()
    await page.getByRole('button', { name: 'Back to portfolio' }).click()
    await expect(page).toHaveURL(/#\/portfolio/)
  })
})
