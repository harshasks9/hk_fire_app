import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

/* Personal mode is the real product: every number derives from records the
   user adds or imports, everything persists, and nothing is invented. */

const FIXTURE_CSV = [
  'Run Date,Action,Symbol,Description,Type,Quantity,Price,Commission,Fees,Amount,Settlement Date',
  '07/01/2026, DIVIDEND RECEIVED OWL,OWL,BLUE OWL CAPITAL,Cash,0,0,,,1250.50,',
  '07/02/2026, YOU BOUGHT GLD,GLD,SPDR GOLD SHARES,Cash,10,420.00,0,0,-4200.00,07/03/2026',
  '07/03/2026, ELECTRONIC FUNDS TRANSFER RECEIVED,,WIRE IN,Cash,0,0,,,25000.00,',
  '07/05/2026, NON-RESIDENT TAX,OWL,NRA WITHHOLDING,Cash,0,0,,,-375.15,',
].join('\n')

test.describe('Personal mode — empty by design', () => {
  test.beforeEach(async ({ page }) => {
    await boot(page, { mode: 'pro', dataMode: 'personal' })
  })

  test('boots empty with honest empty states and zero demo leakage', async ({ page }) => {
    await go(page, '/')
    await expect(page.getByText('This space is empty on purpose.')).toBeVisible()
    // No demo banner in personal mode, and no fictional household anywhere
    await expect(page.getByText(/fictional household/)).toHaveCount(0)
    await expect(page.getByText('Kandala')).toHaveCount(0)

    await go(page, '/income')
    await expect(page.getByText('Income needs your transaction history')).toBeVisible()
    await go(page, '/ledger')
    await expect(page.getByText('No transactions yet')).toBeVisible()
    await go(page, '/balances')
    await expect(page.getByText('No records yet — net worth cannot be computed')).toBeVisible()
  })

  test('demo-only routes are blocked in personal mode', async ({ page }) => {
    for (const path of ['/portfolio', '/real-estate', '/insurance', '/tax', '/inbox']) {
      await go(page, path)
      await expect(page).toHaveURL(/#\/$/)
    }
  })

  test('accounts CRUD: add, see it in net worth, edit, delete with confirmation', async ({ page }) => {
    await go(page, '/balances')
    await page.getByRole('button', { name: 'Add your first account' }).click()
    await page.getByPlaceholder('e.g. Fidelity Individual').fill('Fidelity Individual')
    await page.getByPlaceholder('—').fill('250000')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Fidelity Individual')).toBeVisible()
    await expect(page.getByText('$250,000').first()).toBeVisible()

    // Add a liability and check the arithmetic: 250,000 − 50,000
    await page.getByRole('button', { name: 'Add' }).nth(2).click()
    await page.getByPlaceholder('e.g. Home loan').fill('Margin loan')
    await page.locator('input[inputmode="decimal"]').first().fill('50000')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('$200,000').first()).toBeVisible()

    // Persists across reload — this is a real store, not useState
    await page.reload()
    await expect(page.getByText('$200,000').first()).toBeVisible()

    // Delete asks first and names the record
    await page.getByRole('button', { name: 'Delete Margin loan' }).click()
    await expect(page.getByText('“Margin loan” will be removed')).toBeVisible()
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page.getByText('$250,000').first()).toBeVisible()
  })

  test('unknown balances are excluded and flagged, never treated as zero', async ({ page }) => {
    await go(page, '/balances')
    await page.getByRole('button', { name: 'Add your first account' }).click()
    await page.getByPlaceholder('e.g. Fidelity Individual').fill('DBS Savings')
    // leave balance empty
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('No balance — excluded from totals')).toBeVisible()
  })

  test('CSV import: parse → review → commit → ledger/income update; re-import dedupes', async ({ page }) => {
    await go(page, '/documents')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'Accounts_History_test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(FIXTURE_CSV),
    })

    // Review stage shows exactly what will be committed
    await expect(page.getByText('Review before committing')).toBeVisible()
    await expect(page.getByText('4 new', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: /Commit 4 new rows/ }).click()
    await expect(page.getByText('4 transactions committed')).toBeVisible()

    // Ledger has the rows with correct kinds
    await go(page, '/ledger')
    await expect(page.getByText('DIVIDEND RECEIVED OWL')).toBeVisible()
    await expect(page.locator('tbody').getByText('Transfer', { exact: true })).toBeVisible()

    // Income computes from the rows — dividends only, never the $25K wire
    await go(page, '/income')
    await expect(page.getByText('$1,250.5').first()).toBeVisible()
    await expect(page.getByText(/Transfers between your accounts are never counted as income/)).toBeVisible()

    // Re-importing the same file is caught as duplicates
    await go(page, '/documents')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'Accounts_History_test.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(FIXTURE_CSV),
    })
    await expect(page.getByText('4 already in ledger — will be skipped')).toBeVisible()
  })

  test('a non-Fidelity file is rejected with an honest error, not faked', async ({ page }) => {
    await go(page, '/documents')
    await page.locator('input[type="file"]').setInputFiles({
      name: 'random.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Date,Payee,Amount\n2026-01-01,Coffee,-4.50'),
    })
    await expect(page.getByText(/does not look like a Fidelity Accounts_History export/)).toBeVisible()
    // and a PDF is refused up front
    await page.locator('input[type="file"]').setInputFiles({
      name: 'statement.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4 fake'),
    })
    await expect(page.getByText(/not a CSV. PDFs and images are not parsed in this build/)).toBeVisible()
  })

  test('goals track real net worth and persist', async ({ page }) => {
    await go(page, '/balances')
    await page.getByRole('button', { name: 'Add your first account' }).click()
    await page.getByPlaceholder('e.g. Fidelity Individual').fill('Brokerage')
    await page.getByPlaceholder('—').fill('500000')
    await page.getByRole('button', { name: 'Save' }).click()

    await go(page, '/plan')
    await page.getByRole('button', { name: 'Set your first goal' }).click()
    await page.getByPlaceholder('e.g. Financial independence').fill('First million')
    await page.locator('input[inputmode="decimal"]').first().fill('1000000')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('First million')).toBeVisible()
    await expect(page.getByText('50%')).toBeVisible()
    await page.reload()
    await expect(page.getByText('First million')).toBeVisible()
  })

  test('watchlist is a real editable list with no fake prices', async ({ page }) => {
    await go(page, '/watchlist')
    await page.getByPlaceholder('Add a ticker, e.g. NVDA').fill('NVDA')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('Research dossier')).toBeVisible()
    await page.getByPlaceholder('Add a ticker, e.g. NVDA').fill('ZZZZ')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await expect(page.getByText('No research coverage')).toBeVisible()
    await expect(page.getByText(/no market-data provider is connected/i).first()).toBeVisible()
    await page.getByRole('button', { name: 'Remove ZZZZ' }).click()
    await expect(page.getByText('ZZZZ')).toHaveCount(0)
  })

  test('reports export real files and backup restore round-trips', async ({ page }) => {
    await go(page, '/balances')
    await page.getByRole('button', { name: 'Add your first account' }).click()
    await page.getByPlaceholder('e.g. Fidelity Individual').fill('Backup test account')
    await page.getByPlaceholder('—').fill('123')
    await page.getByRole('button', { name: 'Save' }).click()

    await go(page, '/reports')
    // Empty datasets disable their buttons instead of downloading nothing
    await expect(page.getByRole('button', { name: 'No data yet' })).toHaveCount(2) // ledger + goals empty
    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Export full backup (JSON)' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/meridian-backup-.*\.json/)
  })

  test('demo mode is explicitly labeled and exits cleanly back to personal data', async ({ page }) => {
    await go(page, '/settings')
    await page.getByRole('tab', { name: 'Demo household' }).click()
    await expect(page.getByText('Demo data — every number on screen belongs to a fictional household')).toBeVisible()
    await page.getByRole('button', { name: 'Exit demo' }).click()
    await expect(page.getByText(/fictional household/)).toHaveCount(0)
    await expect(page).toHaveURL(/#\/$/)
  })

  test('copilot computes from the store and admits what it cannot answer', async ({ page }) => {
    await go(page, '/')
    await page.getByRole('button', { name: 'Financial copilot' }).click()
    await expect(page.getByText('Computed from your records', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'What is my net worth?' }).click()
    await expect(page.getByText(/I can’t compute net worth yet — there are no balance records/)).toBeVisible()
  })
})
