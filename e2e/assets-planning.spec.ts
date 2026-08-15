import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Real estate & private investments', () => {
  test('property detail tells the investment story with verified underwriting', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/real-estate')
    await expect(page.getByRole('heading', { name: 'Direct properties' })).toBeVisible()
    await page.getByRole('link', { name: /Mueller District Duplex/ }).first().click()
    await expect(page.getByText('The story of this investment')).toBeVisible()
    await expect(page.getByText('Underwriting')).toBeVisible()
    await expect(page.getByText('DSCR')).toBeVisible()
    await expect(page.getByText('Hold vs sell vs refinance')).toBeVisible()
    // linked mortgage cross-navigation
    await expect(page.getByText('Austin Duplex Mortgage')).toBeVisible()
  })

  test('stale valuations are called out loudly, not hidden', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/real-estate/prop-blr')
    await expect(page.getByText(/broker estimate from January 15, 2024/)).toBeVisible()
    // No dead "request valuation" button — the honest path is stated instead
    await expect(page.getByText(/refresh it by adding a newer valuation record/)).toBeVisible()
  })

  test('syndication shows capital account, waterfall and NAV honesty note', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/private')
    await expect(page.getByText(/Private values come from/)).toBeVisible()
    await expect(page.getByText('Cedar Bend Multifamily LP')).toBeVisible()
    await expect(page.getByText(/8% pref/)).toBeVisible()
    await expect(page.getByText('Underwritten vs actual')).toBeVisible()
    await expect(page.getByText(/Capital call #4/)).toBeVisible()
  })
})

test.describe('Liabilities & insurance', () => {
  test('liability detail links collateral and warns on margin covenants', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/liabilities')
    await expect(page.getByText('Pledged Asset Line')).toBeVisible()
    await page.getByRole('button', { name: /Pledged Asset Line/ }).click()
    await expect(page.getByText(/Margin monitor/)).toBeVisible()
    await expect(page.getByText(/Maintain collateral LTV below 50%/)).toBeVisible()
    await expect(page.getByText('Prepayment scenario')).toBeVisible()
  })

  test('insurance surfaces lapse risk and the umbrella coverage gap', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/insurance')
    await expect(page.getByText(/LIC endowment premium of ₹48,000 due Aug 5/)).toBeVisible()
    await expect(page.getByText('Coverage vs exposures')).toBeVisible()
    await expect(page.getByText('Gap', { exact: true })).toBeVisible()
  })
})

test.describe('Tax, planning, scenarios, reports', () => {
  test('tax page separates jurisdictions and labels everything an estimate', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/tax')
    await expect(page.getByText(/All figures are estimates/)).toBeVisible()
    await expect(page.getByText('Tax-loss harvesting candidates')).toBeVisible()
    await page.getByRole('tab', { name: /India/ }).click()
    await expect(page.getByText(/NRI status safe/)).toBeVisible()
  })

  test('sale-scenario sandbox recomputes tax as inputs change', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/tax')
    await expect(page.getByText('Sale scenario sandbox')).toBeVisible()
    await expect(page.getByText(/Sell \d+ shares/)).toBeVisible()
    await page.getByLabel('Position to model').selectOption('AAPL')
    await expect(page.getByText(/Sell 44 shares at \$232.14/)).toBeVisible()
  })

  test('plan: goals with on-track status and an adjustable projection', async ({ page }) => {
    await boot(page)
    await go(page, '/plan')
    await expect(page.getByText('Financial independence').first()).toBeVisible()
    await expect(page.getByText('At risk').first()).toBeVisible() // college goal honesty
    await expect(page.getByText('Suggested adjustment:')).toBeVisible()
    await expect(page.getByText('Financial principles')).toBeVisible()
  })

  test('scenarios: assumptions drive the projection; Monte Carlo reports success odds', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/scenarios')
    await expect(page.getByText('Wealth trajectory')).toBeVisible()
    await page.getByRole('button', { name: 'Run simulation' }).click()
    await expect(page.getByText(/paths sustain spending to age/)).toBeVisible()
    await expect(page.getByText('Median ending wealth')).toBeVisible()
  })

  test('reports generate real CSV downloads from live records', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/reports')
    const dl = page.waitForEvent('download')
    await page
      .locator('section', { hasText: 'Tax lots' })
      .getByRole('button', { name: 'Generate' })
      .first()
      .click()
    const download = await dl
    expect(download.suggestedFilename()).toBe('meridian-lots.csv')
  })

  test('memory timeline compares two dates with attribution', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/timeline')
    await expect(page.getByText('Compare two dates')).toBeVisible()
    await expect(page.getByText('Market movement')).toBeVisible()
    await page.getByRole('button', { name: 'Valuation' }).click()
    await expect(page.getByText('Seattle home revalued to $1.18M')).toBeVisible()
    await expect(page.getByText('Cedar Bend distribution received')).toHaveCount(0)
  })
})
