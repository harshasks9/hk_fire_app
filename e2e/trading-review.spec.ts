import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Trading Review (imported Fidelity history)', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page, { mode: 'pro' })
  })

  test('renders headline figures that reconcile to the imported dataset', async ({ page }) => {
    await go(page, '/trading-review')
    await expect(page.getByText('Trading review — Fidelity — Individual (•••9001)')).toBeVisible()
    await expect(page.getByText('Imported · 3,634 transactions')).toBeVisible()
    // Realized stock P&L and settled options cash
    await expect(page.getByText('−$35,462').first()).toBeVisible()
    await expect(page.getByText('+$161,240').first()).toBeVisible()
    // Live book deployment
    await expect(page.getByText('−$315,990').first()).toBeVisible()
  })

  test('shows the verdict and both finding columns', async ({ page }) => {
    await go(page, '/trading-review')
    await expect(page.getByRole('heading', { name: 'The verdict' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Strengths' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Weaknesses' })).toBeVisible()
    await expect(page.getByText('Directional stock trading is the leak')).toBeVisible()
    await expect(page.getByText('The short-premium engine genuinely makes money')).toBeVisible()
  })

  test('finding cards expand to show evidence', async ({ page }) => {
    await go(page, '/trading-review')
    const card = page.getByRole('button').filter({ hasText: 'Losers are held almost twice as long as winners' })
    await card.click()
    await expect(page.getByText('Median hold 63d (winners) vs 116d (losers)')).toBeVisible()
  })

  test('round-trip table lists all 24 trips and sorts by P&L', async ({ page }) => {
    await go(page, '/trading-review')
    const table = page.locator('table').first()
    await expect(table.locator('tbody tr')).toHaveCount(24)
    await page.getByRole('button', { name: 'By P&L' }).click()
    // Worst trade first after sorting
    const firstRow = table.locator('tbody tr').first()
    await expect(firstRow).toContainText('MSFT')
    await expect(firstRow).toContainText('−$22,441.42')
  })

  test('options program table shows settled vs live split with totals', async ({ page }) => {
    await go(page, '/trading-review')
    await expect(page.getByRole('heading', { name: 'Options program by underlying' })).toBeVisible()
    const foot = page.locator('tfoot').first()
    await expect(foot).toContainText('1,903')
    await expect(foot).toContainText('$161,239.98')
    await expect(foot).toContainText('−$315,990.22')
  })

  test('live structures identify the OWL outright call stack and risk reversals', async ({ page }) => {
    await go(page, '/trading-review')
    await expect(page.getByText('Long calls (outright)').first()).toBeVisible()
    await expect(page.getByText('Risk reversal (long calls financed by short puts)').first()).toBeVisible()
    await expect(page.getByText('+100× $5 C')).toBeVisible()
  })

  test('correlation and dividend sections render computed figures', async ({ page }) => {
    await go(page, '/trading-review')
    await expect(page.getByText('DEA + OWL')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'The dividend machine' })).toBeVisible()
    await expect(page.getByText('$228,897 collected')).toBeVisible()
  })

  test('method notes disclose data gaps honestly', async ({ page }) => {
    await go(page, '/trading-review')
    await page.getByRole('button', { name: '4 method notes' }).click()
    await expect(page.getByText(/71 sells matched no in-window buy/)).toBeVisible()
  })

  test('is reachable from Pro nav and the Options page cross-link', async ({ page }) => {
    await go(page, '/options')
    await page.getByRole('link', { name: 'Fidelity trading review →' }).click()
    await expect(page.getByRole('heading', { name: 'The verdict' })).toBeVisible()
  })
})
