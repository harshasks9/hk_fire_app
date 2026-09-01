import { test, expect } from '@playwright/test'
import { boot, go } from './helpers'

test.describe('Forensic memoranda', () => {
  test('are reachable from the sidebar in both Simple and Pro mode', async ({ page }) => {
    await boot(page, { mode: 'simple' })
    await go(page, '/')
    await page.getByRole('link', { name: 'Forensic Memos' }).first().click()
    await expect(page.getByRole('heading', { name: /Forensic memoranda/i })).toBeVisible()

    await boot(page, { mode: 'pro' })
    await go(page, '/')
    await expect(page.getByRole('link', { name: 'Forensic Memos' }).first()).toBeVisible()
  })

  test('index lists both memos with ratings and a side-by-side comparison', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/forensic')

    await expect(page.getByRole('heading', { name: /OWL/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: /PAX/ })).toBeVisible()
    await expect(page.getByText('Blue Owl Capital Inc.')).toBeVisible()
    await expect(page.getByText('Patria Investments Limited')).toBeVisible()

    // The comparison table must show the dividend-coverage contrast that distinguishes the two.
    await expect(page.getByRole('cell', { name: /Dividend as % of DE/ })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Side by side' })).toBeVisible()
  })

  test('Research Lab surfaces the memos separately from its sample-data research', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research')
    const card = page.getByRole('heading', { name: /Forensic memoranda/i })
    await expect(card).toBeVisible()
    await page.getByRole('button', { name: 'Open memoranda' }).click()
    await expect(page).toHaveURL(/research\/forensic$/)
  })

  test.describe.parallel('each memo renders in full', () => {
    for (const { symbol, name, price, rating } of [
      { symbol: 'owl', name: 'Blue Owl Capital Inc.', price: '$9.35', rating: 'Moderately undervalued' },
      { symbol: 'pax', name: 'Patria Investments Limited', price: '$11.37', rating: 'Moderately undervalued' },
    ]) {
      test(`${symbol.toUpperCase()} memo`, async ({ page }) => {
        await boot(page, { mode: 'pro' })
        await go(page, `/research/forensic/${symbol}`)

        await expect(page.getByRole('heading', { name: new RegExp(name) })).toBeVisible()
        await expect(page.getByText(price, { exact: true }).first()).toBeVisible()
        await expect(page.getByText(rating).first()).toBeVisible()

        // The non-dismissible confidence disclosure must be present before any number.
        await expect(page.getByText(/Independent research, not investment advice/)).toBeVisible()
        await expect(page.getByText(/network egress policy/)).toBeVisible()

        // Every required artefact from the prompt's output contract.
        for (const heading of [
          'Investment conclusion',
          'The investment question',
          'What changed in the latest quarter',
          'Twelve-month operating trajectory',
          'Per-share bridge',
          'Progress since listing',
          'Business-line economics',
          'Capital quality — both sides of the balance',
          'Earnings quality and dividend coverage',
          'Ownership, incentives and dilution',
          'Peer comparison',
          'Valuation',
          'Bear, base and bull',
          'Red team',
          'Risks, predictions and kill criteria',
          'Quarterly monitoring dashboard',
          'Required conclusions',
          'Confidence ledger',
        ]) {
          await expect(page.getByRole('heading', { name: heading, exact: false }).first()).toBeVisible()
        }

        // Charts render as accessible images, not decorative divs.
        const charts = page.getByRole('img')
        expect(await charts.count()).toBeGreaterThanOrEqual(3)

        // The red team must argue against the memo's own conclusion.
        await expect(page.getByText('The case against', { exact: true })).toBeVisible()
        await expect(page.getByText('Adjudication', { exact: true })).toBeVisible()

        // Kill criteria and three dated predictions.
        await expect(page.getByRole('heading', { name: 'Kill criteria', exact: true })).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Falsifiable predictions', exact: true })).toBeVisible()

        // Sum-of-the-parts resolves to a per-share number.
        await expect(page.getByRole('cell', { name: 'Per share', exact: true })).toBeVisible()
      })
    }
  })

  test('quarter table expands to every reported metric', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/forensic/owl')

    // Scope to the quarter section by id: the revalidation log renders its own table
    // above this one, so `table.first()` no longer resolves to the quarter table.
    const quarter = page.locator('#quarter')
    const toggle = page.getByRole('button', { name: /Show all \d+/ })
    await expect(toggle).toBeVisible()
    const before = await quarter.locator('table').first().locator('tbody tr').count()
    await toggle.click()
    const after = await quarter.locator('table').first().locator('tbody tr').count()
    expect(after).toBeGreaterThan(before)
    await expect(page.getByRole('button', { name: 'Show fewer' })).toBeVisible()
  })

  test('the revalidation log leads the memo and reports both what moved and what did not', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/forensic/owl')

    // The user-facing point of the pass: what changed, at the top, before any conclusion.
    const panel = page.getByRole('heading', { name: /What changed since 2026-07-31/ })
    await expect(panel).toBeVisible()

    // A revalidation that only reported movement would be a sales document, not research.
    await expect(page.getByText('What did not change')).toBeVisible()
    await expect(page.getByText('Did our pre-committed triggers work?')).toBeVisible()

    // OWL re-rated through its own weighted value, so the rating must have moved with it.
    await expect(page.getByText('Rating changed').first()).toBeVisible()
    await expect(page.getByText('Fairly valued').first()).toBeVisible()

    // The revalidation panel must sit above the first section of the memo body.
    const panelY = await panel.boundingBox().then((b) => b!.y)
    const summaryY = await page
      .getByRole('heading', { name: /Investment conclusion/ })
      .boundingBox()
      .then((b) => b!.y)
    expect(panelY).toBeLessThan(summaryY)

    // PAX held its rating on the same pass — the log must be able to say "nothing changed" too.
    await go(page, '/research/forensic/pax')
    await expect(page.getByText('Rating unchanged').first()).toBeVisible()
    await expect(page.getByText('At threshold').first()).toBeVisible()
  })

  test('the page body never scrolls horizontally, at any width', async ({ page }) => {
    // Dense tables and SVG charts must scroll inside their own containers. Regression guard:
    // the chart kit renders at a 600px default before its ResizeObserver fires, which will
    // expand a grid track unless the track is allowed to shrink below its content.
    for (const width of [390, 768, 1366]) {
      await page.setViewportSize({ width, height: 900 })
      for (const symbol of ['owl', 'pax']) {
        await boot(page, { mode: 'pro' })
        await go(page, `/research/forensic/${symbol}`)
        await expect(page.getByRole('heading', { name: /Investment conclusion/ })).toBeVisible()
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )
        expect(overflow, `${symbol} at ${width}px`).toBeLessThanOrEqual(1)
      }
    }
  })

  test('an unknown ticker falls back to the index rather than a blank page', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/forensic/nosuchticker')
    await expect(page).toHaveURL(/research\/forensic$/)
    await expect(page.getByRole('heading', { name: /Forensic memoranda/i })).toBeVisible()
  })

  test('section jump-links scroll within the memo without clobbering the hash route', async ({ page }) => {
    await boot(page, { mode: 'pro' })
    await go(page, '/research/forensic/pax')
    await page.getByRole('button', { name: 'Valuation', exact: true }).click()
    await expect(page.locator('#valuation')).toBeInViewport()
    // The app uses a HashRouter — jumping to a section must not navigate away.
    await expect(page).toHaveURL(/research\/forensic\/pax/)
  })
})
