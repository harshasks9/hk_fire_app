import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Simple Mode home', () => {
  test('answers the four questions: position, change, attention, actions', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    // Where do I stand
    await expect(page.getByText('Net worth', { exact: false }).first()).toBeVisible()
    await expect(page.getByText(/\$2,5\d{2},\d{3}/)).toBeVisible({ timeout: 10_000 })
    // What changed — plain language
    await expect(page.getByText('Why it changed:')).toBeVisible()
    // What needs attention — hard cap of five
    await expect(page.getByText('Needs your attention')).toBeVisible()
    const attentionCard = page.locator('section').filter({ hasText: 'never more than five' }).last()
    const items = attentionCard.locator('a').filter({ hasNotText: 'All →' })
    expect(await items.count()).toBeLessThanOrEqual(5)
    expect(await items.count()).toBeGreaterThan(0)
    // What to consider — max three cards
    await expect(page.getByText('Consider doing')).toBeVisible()
    expect(await page.getByRole('button', { name: 'Accept' }).count()).toBeLessThanOrEqual(3)
  })

  test('mode switch flips the same page to the Pro overview without losing data', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await expect(page.getByText('Why it changed:')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('tab', { name: 'Pro' }).first().click()
    await expect(page.getByText('Performance vs benchmark')).toBeVisible()
    await expect(page.getByText('This month, explained')).toBeVisible()
    // same underlying record: net worth module shows the same magnitude
    await expect(page.getByText('$2.56M').first()).toBeVisible()
  })

  test('currency switcher re-denominates the entire page into INR', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await expect(page.getByText(/\$2,5\d{2},\d{3}/)).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^USD/ }).click()
    await page.getByRole('menuitem', { name: /Indian Rupee/ }).click()
    await expect(page.getByText(/₹/).first()).toBeVisible()
  })

  test('household switcher filters to a single member', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await expect(page.getByText('Why it changed:')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /All/ }).first().click()
    await page.getByRole('menuitem', { name: 'Meera' }).click()
    await expect(page.getByText('Filtered')).toBeVisible()
  })
})

test.describe('Global systems', () => {
  test('search finds a holding and navigates to its detail page', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/')
    await page.getByRole('button', { name: /Search anything/ }).click()
    await page.getByPlaceholder(/Search positions/).fill('NVDA')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#\/position\/NVDA/)
    await expect(page.getByRole('heading', { name: 'NVIDIA Corp.' })).toBeVisible()
  })

  test('notification centre lists unread items and navigates on click', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await page.getByRole('button', { name: /Notifications/ }).click()
    const drawer = page.getByRole('dialog')
    await expect(drawer.getByText(/\d+ new/)).toBeVisible()
    await drawer.getByText('AAPL covered call is in the money').first().click()
    await expect(page).toHaveURL(/#\/inbox/)
  })

  test('copilot answers from records with citations, facts and follow-ups', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await page.getByRole('button', { name: 'Financial copilot' }).click()
    await expect(page.getByText('Answers from your records')).toBeVisible()
    await page.getByRole('button', { name: 'What changed this month?' }).click()
    await expect(page.getByText('Facts — from records')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('Estimates & forecasts')).toBeVisible()
    await expect(page.getByRole('link', { name: /June net-worth attribution/ })).toBeVisible()
  })

  test('copilot declines questions it cannot ground', async ({ page }) => {
    await boot(page)
    await go(page, '/')
    await page.getByRole('button', { name: 'Financial copilot' }).click()
    await page.getByPlaceholder(/What changed/).fill('xyzzy quux plugh')
    await page.getByRole('button', { name: 'Ask' }).click()
    await expect(page.getByText(/couldn’t match that question to your records/)).toBeVisible({ timeout: 5_000 })
  })
})
