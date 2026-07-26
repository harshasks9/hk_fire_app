import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Income', () => {
  test('calendar navigates months and focuses a payment day', async ({ page }) => {
    await boot(page)
    await go(page, '/income')
    await expect(page.getByText('Income calendar')).toBeVisible()
    await expect(page.getByText('Jul 2026')).toBeVisible()
    await page.getByRole('button', { name: 'Next month' }).click()
    await expect(page.getByText('Aug 2026')).toBeVisible()
    await page.getByRole('button', { name: 'Previous month' }).click()
    // Focus July 1 (rent day) — list narrows to that day's events
    await page.getByRole('button', { name: /2026-07-01/ }).click()
    await expect(page.getByText('Mueller District Duplex').first()).toBeVisible()
    await expect(page.getByText('NVDA covered call (Aug)')).toHaveCount(0)
  })

  test('Pro adds stream analytics: yield-on-cost, growth, tax treatment', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/income')
    await expect(page.getByText('Stream analytics')).toBeVisible()
    await expect(page.locator('th', { hasText: 'Yield on cost' })).toBeVisible()
    await expect(page.getByText('Qualified').first()).toBeVisible()
  })
})

test.describe('Watchlist', () => {
  test('shows target distance and converts an item into a position without re-entry', async ({ page }) => {
    await boot(page)
    await go(page, '/watchlist')
    await expect(page.getByText('AMD').first()).toBeVisible()
    await page.getByRole('button', { name: 'I bought it' }).first().click()
    await expect(page.getByRole('heading', { name: 'Add AMD to your portfolio' })).toBeVisible()
    await expect(page.getByText(/thesis, entry criteria and notes transfer automatically/)).toBeVisible()
    await page.getByRole('button', { name: 'Add position' }).click()
    await expect(page.getByText('In portfolio')).toBeVisible()
  })

  test('Pro expands to valuation, criteria and overlap analysis', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/watchlist')
    await page.getByRole('button', { name: 'Details' }).first().click()
    await expect(page.getByText('Entry criteria')).toBeVisible()
    await expect(page.getByText('Exit criteria')).toBeVisible()
    await expect(page.getByText(/Overlaps NVDA/)).toBeVisible()
  })
})

test.describe('Options', () => {
  test('urgent assignment risk is visible in Simple Mode too', async ({ page }) => {
    await boot(page, { mode: 'simple' })
    await go(page, '/options')
    await expect(page.getByText(/AAPL covered call expires in 4 days/)).toBeVisible()
    await expect(page.getByText('Assignment likely')).toBeVisible()
  })

  test('imported Moomoo trade log renders with statement figures and honest gaps', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/options')
    await expect(page.getByText(/Your imported trades — Moomoo SG/)).toBeVisible()
    // broker-verbatim numbers
    await expect(page.getByText('$3,000.20')).toBeVisible() // net premium
    await expect(page.getByText('5 of 6')).toBeVisible() // expired worthless
    await expect(page.getByRole('cell', { name: /NVDA \$205 PUT/ })).toBeVisible()
    // honest unknowns
    await page.getByRole('button', { name: /data gaps/ }).click()
    await expect(page.getByText(/Jul 2026 statement not uploaded/)).toBeVisible()
    // real vs demo separation is explicit
    await expect(page.getByText('Demo dataset below')).toBeVisible()
    // LEAPS holdings with unknown basis
    await expect(page.getByText(/\+10× OWL \$10 CALL/)).toBeVisible()
  })

  test('Pro exposes legs, greeks, breakeven and the payoff diagram', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/options')
    // the risky AAPL strategy is expanded by default
    await expect(page.getByText('Legs', { exact: true })).toBeVisible()
    await expect(page.getByText('θ/day')).toBeVisible()
    await expect(page.getByText('Payoff at expiry')).toBeVisible()
    await expect(page.getByText('Expiry scenarios:')).toBeVisible()
    await expect(page.getByText('Roll history')).toBeVisible()
  })
})
