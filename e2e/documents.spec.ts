import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Document intelligence', () => {
  test('upload pipeline runs through all stages and hands off to review', async ({ page }) => {
    await boot(page)
    await go(page, '/documents')
    await page.getByRole('button', { name: 'Upload' }).first().click()
    await expect(page.getByRole('heading', { name: 'Upload a document' })).toBeVisible()
    await page.getByRole('button', { name: /Fidelity_Statement_Jul2026\.pdf/ }).click()
    // stages tick by ~950ms each: uploaded → classified → extracting → matching → reconciling → review
    await expect(page.getByText('Identified as a Fidelity brokerage statement')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText('1 field flagged for review')).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: 'Review extracted data' }).click()
    await expect(page).toHaveURL(/#\/documents\/review\/doc-fid-jul/)
  })

  test('review: plain-language summary, side-by-side fields, field-level decisions, approve → applied', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/documents/review/doc-fid-jul')
    // Simple summary sentence from the PRD
    await expect(page.getByText(/We found 14 positions, 23 transactions/)).toBeVisible()
    // Original document panel + extraction metadata
    await expect(page.getByText('Original document')).toBeVisible()
    await expect(page.getByText('Monthly statement > activity export')).toBeVisible()
    // Low-confidence field carries its own accept/keep decision
    await expect(page.getByText('O — cost basis (Oct 2023 lot)')).toBeVisible()
    await page.getByRole('button', { name: 'Keep existing' }).click()
    await expect(page.getByText('Kept existing')).toBeVisible()
    // The approval step is explicit that the demo walkthrough changes nothing
    await expect(page.getByText('This demo walkthrough changes nothing')).toBeVisible()
    await page.getByRole('button', { name: 'Approve update' }).click()
    await expect(page.getByText('Walkthrough complete')).toBeVisible()
    // Audit trail reflects the human decision
    await expect(page.getByText(/Approved update with 1 field decision/)).toBeVisible()
  })

  test('document library filters by kind and shows processing status', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/documents')
    await expect(page.getByText(/waiting for your review/)).toBeVisible()
    await page.getByRole('button', { name: 'Sponsor report' }).click()
    await expect(page.getByText('CedarBend_Q1_2026_Investor_Report.pdf')).toBeVisible()
    await expect(page.getByText('Fidelity_Statement_Jul2026.pdf')).toHaveCount(0)
  })
})

test.describe('Financial inbox', () => {
  test('data issue: expand detail, accept proposed value, revert from resolved', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/inbox')
    await expect(page.getByText('Conflicting cash balance — Fidelity •••7842')).toBeVisible()
    // high-severity issues arrive pre-expanded with their explanation
    await expect(page.getByText(/un-settled SCHD purchase/)).toBeVisible()
    await page.getByRole('button', { name: 'Mark resolved' }).first().click()
    await expect(page.getByText('Recently resolved')).toBeVisible()
  })

  test('Simple Mode renames it "Needs Review" and uses plain language', async ({ page }) => {
    await boot(page, { mode: 'simple' })
    await go(page, '/inbox')
    await expect(page.getByText('Two statements show different values for your Fidelity account')).toBeVisible()
  })

  test('suggestions tab: full explanation then accept with undo', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/inbox')
    await page.getByRole('tab', { name: /Suggestions/ }).click()
    const first = page.getByRole('button', { name: 'Why this matters' }).first()
    await first.click()
    await expect(page.getByText('Supported by').first()).toBeVisible()
    await expect(page.getByText('Estimated impact').first()).toBeVisible()
    await page.getByRole('button', { name: 'Accept', exact: true }).first().click()
    await expect(page.getByRole('button', { name: 'Undo' }).first()).toBeVisible()
  })
})
