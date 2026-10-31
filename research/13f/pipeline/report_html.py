"""
Step 19 — Render outputs/EXECUTIVE-REPORT.md as a self-contained HTML page (outputs/EXECUTIVE-REPORT.html).
The page is what gets published; the Markdown stays the source. No external scripts; fonts from Google Fonts.
"""
from __future__ import annotations
import html, re
import markdown
from config import OUTPUT_DIR

CSS = """
/* layout: one reading column (72ch) on a quiet paper ground; a verdict band on top; tables scroll in place */
:root{--bg:#f7f6f2;--paper:#fffdf9;--fg:#1f2328;--muted:#5d6570;--rule:#d9d6cc;--accent:#0f5f6b;--accent-ink:#0a4650;--warn:#9a5b00;--warn-bg:#fff4e0;--good:#1f6d3a;--bad:#9b2c2c;--tile:#eef2ef;
 --display:"Spectral",Georgia,"Times New Roman",serif;--body:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif;--mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#15181c;--paper:#1c2024;--fg:#e6e3dc;--muted:#a7aeb8;--rule:#343a42;--accent:#6cc3cf;--accent-ink:#9adbe3;--warn:#e8b35a;--warn-bg:#2b2416;--good:#6fcf8f;--bad:#f08a8a;--tile:#222830;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#15181c;--paper:#1c2024;--fg:#e6e3dc;--muted:#a7aeb8;--rule:#343a42;--accent:#6cc3cf;--accent-ink:#9adbe3;--warn:#e8b35a;--warn-bg:#2b2416;--good:#6fcf8f;--bad:#f08a8a;--tile:#222830;color-scheme:dark}
body{background:var(--bg);color:var(--fg);font:16px/1.6 var(--body);margin:0}
.wrap{max-width:76ch;margin:0 auto;padding-block:28px 64px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.eyebrow{font:600 12px/1.4 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
h1{font:600 clamp(28px,5vw,40px)/1.15 var(--display);margin:6px 0 10px;text-wrap:balance;letter-spacing:-.01em}
.sub{color:var(--muted);font-size:15px;margin:0 0 22px}
h2{font:600 24px/1.25 var(--display);margin:44px 0 12px;padding-top:18px;border-top:1px solid var(--rule);text-wrap:balance}
h3{font:600 18px/1.3 var(--display);margin:28px 0 8px;text-wrap:balance}
p{margin:0 0 14px}
p,li{max-width:72ch}
a{color:var(--accent-ink);text-decoration-thickness:1px;text-underline-offset:2px}
strong{font-weight:600}
ul,ol{padding-left:22px;margin:0 0 14px}
li{margin:0 0 6px}
code{font:13.5px var(--mono);background:var(--tile);padding:1px 5px;border-radius:4px}
hr{border:0;border-top:1px solid var(--rule);margin:28px 0}
.tw{overflow-x:auto;margin:14px 0 20px;border:1px solid var(--rule);border-radius:6px;background:var(--paper)}
table{border-collapse:collapse;min-width:100%;font-size:13.5px;font-variant-numeric:tabular-nums}
th{font:600 11.5px/1.3 var(--body);letter-spacing:.05em;text-transform:uppercase;color:var(--muted);text-align:left;padding:9px 12px;border-bottom:1px solid var(--rule);white-space:nowrap}
td{padding:7px 12px;border-bottom:1px solid var(--rule);vertical-align:top;white-space:nowrap}
tr:last-child td{border-bottom:0}
td:first-child,th:first-child{white-space:normal;min-width:11ch}
.verdict{background:var(--paper);border:1px solid var(--rule);border-left:4px solid var(--accent);border-radius:6px;padding:18px 20px;margin:0 0 26px}
.verdict p{margin:0}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:0 0 28px}
.tile{background:var(--tile);border-radius:6px;padding:12px 14px}
.tile .n{font:600 26px/1.1 var(--display);font-variant-numeric:tabular-nums;color:var(--fg)}
.tile .l{font-size:12.5px;color:var(--muted);margin-top:4px;line-height:1.35}
.toc{columns:2;column-gap:28px;font-size:14px;margin:0 0 8px;padding-left:18px}
.toc li{break-inside:avoid}
@media (max-width:560px){.toc{columns:1}body{font-size:15.5px}}
.note{background:var(--warn-bg);border-left:3px solid var(--warn);padding:10px 14px;border-radius:4px;font-size:14.5px;margin:0 0 18px}
.foot{color:var(--muted);font-size:13.5px;border-top:1px solid var(--rule);padding-top:16px;margin-top:40px}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
"""

def main() -> None:
    md = (OUTPUT_DIR / "EXECUTIVE-REPORT.md").read_text()
    # strip the Markdown title block (rendered as the page header) up to the first rule
    head, _, body = md.partition("\n---\n")
    md_ = markdown.Markdown(extensions=["tables", "toc", "sane_lists"], extension_configs={"toc": {"toc_depth": "2"}})
    body_html = md_.convert(body)
    # wrap every table for horizontal scrolling
    body_html = body_html.replace("<table>", '<div class="tw"><table>').replace("</table>", "</table></div>")
    toc_html = re.sub(r'^<div class="toc">|</div>\s*$', "", md_.toc.strip()).replace("<ul>", '<ul class="toc">', 1)
    tiles = [("0 of 37", "pre-specified signal tests validated after FDR, out-of-sample and clustering"),
             ("−1.6 %", "mean 12-month excess return vs SPY after a top manager's new position (median −6.6 %)"),
             ("0 of 106", "manager copy portfolios with a positive factor alpha at t > 2"),
             ("−0.20", "correlation of manager new-position skill between the 2013–20 and 2021–26 windows"),
             ("−2.8 % / yr", "the passive “own what they own” baseline against SPY (alpha −4.1 %, t = −4.1)")]
    tiles_html = "".join(f'<div class="tile"><div class="n">{html.escape(n)}</div><div class="l">{html.escape(l)}</div></div>' for n, l in tiles)
    page = f"""<title>Top-100 13F Intelligence Report</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Spectral:wght@400;600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>{CSS}</style>
<div class="wrap">
<div class="eyebrow">Executive research report · SEC Form 13F · 2013Q2 – 2026Q2 · point-in-time</div>
<h1>Institutional Investor Intelligence From the Top 100 13F Filers</h1>
<p class="sub">Prepared 2026-10-31 from primary SEC data. Every figure is produced by the pipeline in <code>research/13f/</code> and reproduced with its sample size and test statistic in <code>outputs/REPORT-DATA.md</code>; the interactive <a href="dashboard.html">theme and signal dashboard</a> and the full table set accompany this page.</p>
<div class="verdict"><p><strong>The defensible finding:</strong> thirteen years of filings from one hundred of the most-followed institutional managers contain almost no return information an outside investor could have used after the filing became public — after a quarterly execution delay, costs, period-clustered statistics, a reserved 2021–26 test window, a false-discovery correction across 37 pre-specified tests, and a point-in-time manager universe.</p></div>
<div class="tiles">{tiles_html}</div>
<div class="eyebrow">Contents</div>
{toc_html}
{body_html}
<div class="foot">Source: SEC Form 13F structured data sets (all filers, 2013Q2 → 2026-08-31), EDGAR acceptance timestamps, OpenFIGI, Kenneth French data library. Prices are quarter-end levels implied by the filings themselves (price returns, ex-dividend); see §1.3 and <code>docs/AUDIT-NOTES.md</code>. Reproducible repository: <code>research/13f/</code> in harshasks9/hk_fire_app.</div>
</div>
"""
    (OUTPUT_DIR / "EXECUTIVE-REPORT.html").write_text(page)
    print(f"{len(page):,} bytes")

if __name__ == "__main__":
    main()
