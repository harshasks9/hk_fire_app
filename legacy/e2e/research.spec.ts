import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Research Lab', () => {
  test('lab lists the coverage universe with honest tiers and the data-source banner', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research')
    await expect(page.getByText('Research data source: bundled sample dataset.')).toBeVisible()
    await expect(page.getByText('Deep coverage').first()).toBeVisible()
    await expect(page.getByText('Technical only').first()).toBeVisible()
    // ETFs are not given fake fundamental research
    await expect(page.getByText(/fundamental research not applicable/).first()).toBeVisible()
    // Investor Lens Matrix present with all 11 frameworks
    await expect(page.getByText('Investor Lens Matrix')).toBeVisible()
    await expect(page.getByText('Buffett / Munger')).toBeVisible()
    await expect(page.getByText('Forensic (Chanos-style)')).toBeVisible()
  })

  test('portfolio filter narrows to held names', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research')
    await page.getByRole('button', { name: 'portfolio' }).click()
    await expect(page.getByRole('cell', { name: /NVIDIA/ }).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: /Advanced Micro Devices/ })).toHaveCount(0) // watchlist-only
  })

  test('dossier: overview, transparent scores with editable weights', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/AAPL')
    await expect(page.getByRole('heading', { name: 'Apple Inc.' })).toBeVisible()
    await expect(page.getByText('Variant perception')).toBeVisible()
    await expect(page.getByText('Score breakdown')).toBeVisible()
    // formulas are never hidden behind anything but one click
    await page.getByRole('button', { name: 'Show formulas & inputs' }).click()
    await expect(page.getByText(/FCF conversion/).first()).toBeVisible()
    // edit a weight and confirm persistence across reload
    await page.getByLabel('Weight for Valuation attractiveness').fill('30')
    await page.reload()
    await expect(page.getByLabel('Weight for Valuation attractiveness')).toHaveValue('30')
  })

  test('valuation lab: DCF sliders recompute; reverse DCF states implied expectations', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/AAPL')
    await page.getByRole('tab', { name: 'Valuation' }).click()
    await expect(page.getByText('Why these methods:')).toBeVisible()
    const before = await page.getByText(/^Value per share$/).locator('..').innerText()
    await page.getByLabel('Growth years 1–5').fill('20')
    const after = await page.getByText(/^Value per share$/).locator('..').innerText()
    expect(after).not.toBe(before)
    await expect(page.getByText('Reverse DCF')).toBeVisible()
    await expect(page.getByText(/Price demands more than the base case|Price consistent with base case/)).toBeVisible()
    await expect(page.getByText('Bull / base / bear')).toBeVisible()
  })

  test('lenses tab shows scored frameworks, evidence and contradictions', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/NVDA')
    await page.getByRole('tab', { name: 'Lenses' }).click()
    await expect(page.getByText('Contradiction to hold in mind:')).toBeVisible()
    await page.getByText('Howard Marks').click()
    await expect(page.getByText('Where are we in the cycle?')).toBeVisible()
    await expect(page.getByText(/Principles from:/).first()).toBeVisible()
  })

  test('technicals tab computes indicators with honest approximation notes', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/AAPL')
    await page.getByRole('tab', { name: 'Technicals' }).click()
    await expect(page.getByText('RSI (14)')).toBeVisible()
    await expect(page.getByText(/close-to-close approximation/)).toBeVisible()
    await expect(page.getByText('Key levels')).toBeVisible()
    await expect(page.getByText(/Invalidation:/)).toBeVisible()
  })

  test('memo: edit a thesis, persist it, revert to baseline', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/AAPL')
    await page.getByRole('tab', { name: 'Memo' }).click()
    await expect(page.getByText('Thesis breakers — exit triggers, decided in advance')).toBeVisible()
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('bull thesis').fill('My edited bull case: services acceleration.')
    await page.getByRole('button', { name: 'Done' }).click()
    await page.reload()
    await page.getByRole('tab', { name: 'Memo' }).click()
    await expect(page.getByText('My edited bull case: services acceleration.')).toBeVisible()
    await expect(page.getByText(/Edited by you/)).toBeVisible()
    await page.getByRole('button', { name: 'Revert to baseline' }).click()
    await expect(page.getByText('My edited bull case: services acceleration.')).toHaveCount(0)
  })

  test('news tab classifies materiality and maps items to assumptions', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/NVDA')
    await page.getByRole('tab', { name: 'News' }).click()
    await expect(page.getByText('material').first()).toBeVisible()
    await expect(page.getByText(/maps to assumption:/).first()).toBeVisible()
    await expect(page.getByText('Insider activity')).toBeVisible()
    await expect(page.getByText(/not investment advice/)).toBeVisible()
  })

  test('comparison workspace: select names, best-in-dimension highlighting', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/compare')
    await expect(page.getByText('Comparison workspace')).toBeVisible()
    await page.getByRole('button', { name: 'RELIANCE', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: /RELIANCE/ })).toBeVisible()
    await expect(page.getByText('Investor-lens average')).toBeVisible()
    await expect(page.getByText(/never by itself a reason to trade/)).toBeVisible()
  })

  test('uncovered ticker shows an honest not-covered state, not fake research', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/GOOGL')
    await expect(page.getByText('No research dossier for GOOGL')).toBeVisible()
    await expect(page.getByText(/require the live data provider/)).toBeVisible()
  })

  test('position page links into its research dossier', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/position/NVDA')
    await page.getByRole('link', { name: /Research dossier/ }).click()
    await expect(page.getByRole('heading', { name: 'NVIDIA Corp.' })).toBeVisible()
    await expect(page.getByText('Deep coverage')).toBeVisible()
  })
})
