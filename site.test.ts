import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { FORENSIC_MEMOS, weightedValue } from './memos/index.ts'
import { renderMemoPage, renderIndexPage, build, esc } from './build.ts'

const SECTION_IDS = [
  'summary', 'debate', 'quarter', 'trajectory', 'pershare', 'scorecard', 'segments', 'capital', 'quality',
  'ownership', 'peers', 'valuation', 'scenarios', 'redteam', 'risks', 'dashboard', 'conclusion', 'sources',
  'history', 'multiple', 'peergroup', 'yields',
]

/** Things that only appear in HTML when a template forgot a value. */
function assertNoTemplateLeaks(html: string, where: string) {
  for (const leak of ['undefined', 'NaN', '[object Object]', '${', 'null<']) {
    assert.ok(!html.includes(leak), `${where} contains "${leak}"`)
  }
}

function count(html: string, needle: string): number {
  return html.split(needle).length - 1
}

describe('escaping', () => {
  it('escapes the five HTML-significant characters and nothing else', () => {
    assert.equal(esc(`<b class="x">&'</b>`), '&lt;b class=&quot;x&quot;&gt;&amp;\'&lt;/b&gt;')
    assert.equal(esc('DE/share ≥ $0.22 — 54.0% × 1.2'), 'DE/share ≥ $0.22 — 54.0% × 1.2')
    assert.equal(esc(undefined), '')
  })
})


for (const memo of FORENSIC_MEMOS) {
  describe(`${memo.symbol} page`, () => {
    const html = renderMemoPage(memo)

    it('is a complete document with the memo in the title', () => {
      assert.match(html, /^<!doctype html>/)
      assert.ok(html.includes(`<title>${memo.symbol} — ${esc(memo.name)}`))
      assert.ok(html.trimEnd().endsWith('</html>'))
      assert.match(html, /<meta name="robots" content="noindex, nofollow">/)
    })

    it('renders all twenty-two sections, in order, each linked from the section nav', () => {
      let last = -1
      for (const id of SECTION_IDS) {
        const at = html.indexOf(`<section id="${id}"`)
        assert.ok(at > last, `section #${id} missing or out of order`)
        assert.ok(html.includes(`href="#${id}"`), `nav link to #${id} missing`)
        last = at
      }
    })

    it('carries the revalidation log above the first numbered section', () => {
      assert.ok(memo.revalidation)
      const reval = html.indexOf('id="revalidation"')
      assert.ok(reval > 0)
      assert.ok(reval < html.indexOf('<section id="summary"'))
      assert.ok(html.includes(esc(memo.revalidation.verdict)))
      for (const c of memo.revalidation.changes) assert.ok(html.includes(esc(c.item)))
      for (const u of memo.revalidation.unchanged) assert.ok(html.includes(esc(u)))
    })

    it('labels the latest pass against the previous pass and keeps every earlier pass on the page, collapsed', () => {
      const r = memo.revalidation!
      assert.ok(r.since)
      assert.ok(html.includes(`What changed since ${esc(r.since)}`))
      assert.ok(html.includes('Price at last pass'))
      const priors = memo.priorRevalidations ?? []
      assert.ok(priors.length >= 1)
      assert.equal(count(html, '<details class="pass">'), priors.length)
      for (const p of priors) {
        assert.ok(html.includes(`id="revalidation-${p.asOf}"`))
        assert.ok(html.includes(esc(p.verdict)))
        assert.ok(html.includes(esc(p.triggerNote)))
      }
      // The latest pass comes first; earlier passes follow it and precede the section nav.
      const latest = html.indexOf('id="revalidation"')
      const first = html.indexOf('<details class="pass">')
      assert.ok(latest < first && first < html.indexOf('<nav class="secnav"'))
    })

    it('renders the four v3 chapters from the expansion data', () => {
      const e = memo.expansion!
      assert.ok(e)
      for (const r of e.history.provenance) assert.ok(html.includes(esc(r.event)))
      for (const r of e.history.promises) assert.ok(html.includes(esc(r.promise)))
      for (const r of e.history.acquisitions) assert.ok(html.includes(esc(r.target)))
      for (const r of e.history.life) assert.ok(html.includes(esc(r.period)))
      for (const r of e.history.regimes) assert.ok(html.includes(esc(r.regime)))
      for (const p of e.multiple.points) {
        assert.ok(html.includes(esc(p.label)))
        assert.ok(html.includes(`${(p.price / p.dePs).toFixed(1)}×`), `P/DE for ${p.label}`)
      }
      for (const d of e.multiple.decomposition) assert.ok(html.includes(esc(d.term)))
      for (const t of e.multiple.technicals) assert.ok(html.includes(esc(t.indicator)))
      for (const r of e.peers.rows) assert.ok(html.includes(esc(r.name)), `peer ${r.ticker}`)
      for (const r of e.peers.whatMarketPays) assert.ok(html.includes(esc(r.factor)))
      for (const r of e.yields.rows) assert.ok(html.includes(esc(r.instrument)))
      for (const b of e.yields.buckets) assert.ok(html.includes(esc(b.bucket)))
      for (const v of [e.history.verdict, e.multiple.verdict, e.peers.verdict, e.yields.verdict]) assert.ok(html.includes(esc(v)))
      for (const src of e.sources) assert.ok(html.includes(esc(src.label)), `expansion source missing: ${src.label}`)
      // The yield chapter's derived numbers are computed at render time, not typed in.
      const share = e.yields.buckets.reduce((a, b) => a + b.sharePct, 0)
      const weighted = e.yields.buckets.reduce((a, b) => a + (b.sharePct * b.requiredYieldPct) / share, 0)
      assert.ok(html.includes(`${weighted.toFixed(1)}%`))
      assert.ok(html.includes(`$${(e.yields.dePs / (weighted / 100)).toFixed(2)}`))
    })

    it('puts every source, prediction, kill criterion and conclusion on the page', () => {
      for (const s of memo.sources) assert.ok(html.includes(esc(s.label)), `source missing: ${s.label}`)
      for (const p of memo.predictions) {
        assert.ok(html.includes(esc(p.claim)))
        assert.ok(html.includes(esc(p.threshold)))
        assert.ok(html.includes(esc(p.status!)))
      }
      for (const k of memo.killCriteria) assert.ok(html.includes(esc(k)))
      for (const c of memo.conclusions) {
        assert.ok(html.includes(esc(c.q)))
        assert.ok(html.includes(esc(c.a)))
      }
      for (const q of memo.questionsForManagement) assert.ok(html.includes(esc(q)))
    })

    it('renders every table row of the quarter, history, peer and sum-of-the-parts tables', () => {
      for (const r of memo.quarter) assert.ok(html.includes(esc(r.metric)))
      for (const r of memo.history) assert.ok(html.includes(esc(r.period)))
      for (const r of memo.peers) assert.ok(html.includes(esc(r.name)))
      for (const r of memo.sotp) assert.ok(html.includes(esc(r.component)))
      for (const r of memo.scorecard) assert.ok(html.includes(esc(r.commitment)))
      for (const r of memo.narrative) assert.ok(html.includes(esc(r.claim)))
    })

    it('quotes the price, weighted value and rating the data model produces', () => {
      assert.ok(html.includes(`$${memo.price.toFixed(2)}`))
      assert.ok(html.includes(`$${weightedValue(memo).toFixed(2)}`))
      assert.ok(html.includes(esc(memo.rating)))
    })

    it('tags figures with confidence-tier chips that explain themselves', () => {
      assert.ok(count(html, 'class="tier tier-A"') >= 10)
      assert.ok(html.includes('title="Reported — Quoted from a company release, filing or earnings call"'))
    })

    it('draws the five charts as accessible inline SVG with every point carrying a tooltip', () => {
      // two trajectory charts, price vs earnings line, P/DE, and the peer scatter
      assert.equal(count(html, '<svg '), 5)
      assert.equal(count(html, 'role="img" aria-label="'), 5)
      assert.ok(html.includes('FRE per share'))
      assert.ok(html.includes('DE per share'))
      assert.ok(html.includes('DE/share index'))
      assert.ok(html.includes(`Earnings line, ${memo.expansion!.multiple.earningsLineMultiple}× DE`))
      const points = memo.expansion!.multiple.points.length
      const scatter = memo.expansion!.peers.rows.filter((r) => r.pFre !== null && r.freGrowthPct !== null).length
      assert.equal(count(html, '<circle '), 2 * (memo.trajectory.labels.length + memo.indexed.labels.length) + 3 * points + scatter)
      assert.equal(count(html, '<circle '), count(html, '</title></circle>'))
    })

    it('opens with the integrity banner and the source caveat', () => {
      assert.ok(html.indexOf(esc(memo.sourceCaveat)) < html.indexOf('<h1>'))
      assert.ok(html.includes('Independent research, not investment advice.'))
    })

    it('leaves nothing unrendered', () => {
      assertNoTemplateLeaks(html, `${memo.symbol} page`)
      assert.equal(count(html, '<table'), count(html, '</table>'))
      assert.equal(count(html, '<section'), count(html, '</section>'))
      assert.equal(count(html, '<div'), count(html, '</div>'))
      assert.equal(count(html, '<details'), count(html, '</details>'))
    })
  })
}

describe('index page', () => {
  const html = renderIndexPage()

  it('links to every memo and the methodology', () => {
    for (const m of FORENSIC_MEMOS) assert.ok(html.includes(`href="/${m.symbol.toLowerCase()}/"`))
    assert.ok(html.includes('href="/methodology.md"'))
    assert.ok(html.includes('href="/logout"'))
  })

  it('shows the revalidation delta and the v3 expansion panel before the memo cards', () => {
    const updated = html.indexOf('Updated 2026-09-20')
    assert.ok(updated > 0)
    assert.ok(updated < html.indexOf('<article'))
    for (const m of FORENSIC_MEMOS) assert.ok(html.includes(esc(m.revalidation!.verdict)))
    const expanded = html.indexOf('Expanded 2026-09-20')
    assert.ok(expanded > updated && expanded < html.indexOf('<article'))
    for (const m of FORENSIC_MEMOS) {
      assert.ok(html.includes(esc(m.expansion!.yields.verdict)))
      for (const id of ['history', 'multiple', 'peergroup', 'yields']) assert.ok(html.includes(`href="/${m.symbol.toLowerCase()}/#${id}"`))
    }
  })

  it('renders the side-by-side table with a column per memo and the verdict paragraph', () => {
    assert.ok(html.includes('Side by side'))
    assert.ok(html.includes('If forced to own one.'))
    for (const m of FORENSIC_MEMOS) {
      assert.ok(html.includes(`$${m.price.toFixed(2)}`))
      assert.ok(html.includes(esc(m.rating)))
      assert.ok(html.includes(esc(m.headline)))
    }
  })

  it('leaves nothing unrendered', () => {
    assertNoTemplateLeaks(html, 'index')
    assert.equal(count(html, '<div'), count(html, '</div>'))
    assert.equal(count(html, '<svg '), FORENSIC_MEMOS.length)
  })
})

describe('build', () => {
  const out = join(import.meta.dirname, 'dist')
  let files: string[] = []
  before(async () => {
    files = await build(out)
  })

  it('writes an index, one folder per memo, the methodology and a robots file', async () => {
    assert.deepEqual([...files].sort(), ['404.html', 'index.html', 'methodology.md', 'owl/index.html', 'pax/index.html', 'robots.txt'].sort())
    for (const f of files) assert.ok((await stat(join(out, f))).size > 0, `${f} is empty`)
  })

  it('keeps crawlers out and ships the versioned prompt as the methodology', async () => {
    assert.equal(await readFile(join(out, 'robots.txt'), 'utf8'), 'User-agent: *\nDisallow: /\n')
    const method = await readFile(join(out, 'methodology.md'), 'utf8')
    assert.match(method, /^# Forensic Investment Analysis — Listed Alternative Asset Manager \(v3\)/)
    assert.ok(method.includes('### 13 · History'))
    assert.ok(method.includes('### 16 · Comparison with bond yields'))
    assert.ok(method.includes('Changelog'))
  })
})
