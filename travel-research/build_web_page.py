"""Build villa/public/workation/index.html from travel-research/travel-research-report.md.

Usage: pip install markdown && python3 travel-research/build_web_page.py
"""
import html
import pathlib
import re

import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "travel-research/travel-research-report.md"
OUT = ROOT / "villa/public/workation/index.html"

text = SRC.read_text()

# Drop the H1 and the intro paragraph; the page renders its own header.
text = text.split("\n---\n", 1)[1]

# Python-Markdown nests lists on 4-space indents; the report uses 2.
text = re.sub(r"(?m)^  (?=(- |\d+\. ))", "    ", text)
text = text.replace("## I. Sensitivity analysis (`scoring/score.py`)", "## I. Sensitivity analysis")

md = markdown.Markdown(extensions=["tables", "toc", "sane_lists"], extension_configs={"toc": {"toc_depth": "2"}})
body = md.convert(text)
toc_tokens = md.toc_tokens

body = re.sub(r"<table>", '<div class="table-wrap"><table>', body)
body = body.replace("</table>", "</table></div>")
body = re.sub(r"\((V1|V2|E|U)\)", lambda m: f'<span class="tag t-{m.group(1).lower()}">{m.group(1)}</span>', body)
body = body.replace("<a href=", '<a target="_blank" rel="noopener" href=')

toc = "\n".join(
    f'<li><a href="#{t["id"]}">{html.escape(t["name"])}</a></li>' for t in toc_tokens
)

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>December Workation Plan</title>
<meta name="description" content="Research report: a December 2026 couples workation in Southeast Asia and a family trip to Siem Reap.">
<style>
:root {{
  --bg: #f7f5f0; --surface: #ffffff; --ink: #1d2433; --muted: #5d6677; --line: #e4e0d6;
  --accent: #0f6e6a; --accent-soft: #e2f1ef; --warm: #b5532c;
  --v1: #1f7a3d; --v2: #2f5fa7; --e: #9a6400; --u: #a3343a;
  --shadow: 0 1px 2px rgba(20,25,35,.06), 0 4px 16px rgba(20,25,35,.05);
}}
@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg: #12161d; --surface: #1a2029; --ink: #e8ebf0; --muted: #9aa3b2; --line: #2b3340;
    --accent: #5cc8c0; --accent-soft: #173533; --warm: #f0956b;
    --v1: #6fd08f; --v2: #8fb4ff; --e: #f2c063; --u: #ff8f95; --shadow: none;
  }}
}}
:root[data-theme="dark"] {{
  --bg: #12161d; --surface: #1a2029; --ink: #e8ebf0; --muted: #9aa3b2; --line: #2b3340;
  --accent: #5cc8c0; --accent-soft: #173533; --warm: #f0956b;
  --v1: #6fd08f; --v2: #8fb4ff; --e: #f2c063; --u: #ff8f95; --shadow: none;
}}
* {{ box-sizing: border-box; }}
html {{ scroll-behavior: smooth; }}
body {{ margin: 0; background: var(--bg); color: var(--ink);
  font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, "Helvetica Neue", Arial, sans-serif; }}
a {{ color: var(--accent); }}
header.hero {{ background: linear-gradient(135deg, #0f6e6a 0%, #134e6f 60%, #22305c 100%); color: #fff; padding: 48px 16px 40px; }}
.hero .inner, main {{ max-width: 1240px; margin: 0 auto; }}
.hero .eyebrow {{ text-transform: uppercase; letter-spacing: .08em; font-size: 12px; opacity: .8; margin: 0 0 8px; }}
.hero h1 {{ font-size: clamp(28px, 5vw, 44px); line-height: 1.15; margin: 0 0 12px; }}
.hero p.lede {{ font-size: 18px; max-width: 760px; margin: 0; opacity: .95; }}
.cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 28px; }}
.card {{ background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.22); border-radius: 12px; padding: 14px 16px; }}
.card .k {{ font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .8; }}
.card .v {{ font-size: 17px; font-weight: 650; margin-top: 4px; }}
.card .s {{ font-size: 13px; opacity: .85; margin-top: 4px; }}
.layout {{ display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 32px; padding: 32px 16px 64px; }}
nav.toc {{ position: sticky; top: 16px; align-self: start; font-size: 14px; }}
nav.toc h2 {{ font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); margin: 0 0 8px; }}
nav.toc ol {{ list-style: none; padding: 0; margin: 0; }}
nav.toc li a {{ display: block; padding: 6px 10px; border-radius: 8px; color: var(--ink); text-decoration: none; }}
nav.toc li a:hover {{ background: var(--accent-soft); color: var(--accent); }}
article {{ min-width: 0; }}
article h2 {{ font-size: 26px; margin: 40px 0 12px; padding-top: 8px; border-top: 1px solid var(--line); scroll-margin-top: 12px; }}
article h2:first-child {{ margin-top: 0; border-top: 0; padding-top: 0; }}
article h3 {{ font-size: 19px; margin: 28px 0 8px; }}
article p, article li {{ max-width: 78ch; }}
article blockquote {{ margin: 16px 0; padding: 12px 16px; background: var(--accent-soft); border-left: 4px solid var(--accent); border-radius: 0 10px 10px 0; }}
.table-wrap {{ overflow-x: auto; margin: 16px 0 20px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: var(--shadow); }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }}
th {{ font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); background: color-mix(in srgb, var(--surface) 85%, var(--accent-soft)); white-space: nowrap; }}
tr:last-child td {{ border-bottom: 0; }}
td:first-child {{ font-weight: 600; }}
.tag {{ display: inline-block; font-size: 11px; font-weight: 700; padding: 0 6px; border-radius: 999px; border: 1px solid currentColor; line-height: 18px; vertical-align: 1px; }}
.t-v1 {{ color: var(--v1); }} .t-v2 {{ color: var(--v2); }} .t-e {{ color: var(--e); }} .t-u {{ color: var(--u); }}
.legend {{ display: flex; flex-wrap: wrap; gap: 10px 18px; font-size: 13px; color: var(--muted); margin: 0 0 24px; padding: 12px 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; }}
footer {{ border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; padding: 24px 16px 48px; }}
footer .inner {{ max-width: 1240px; margin: 0 auto; }}
.theme-toggle {{ position: absolute; top: 14px; right: 16px; background: rgba(255,255,255,.15); color: #fff; border: 1px solid rgba(255,255,255,.3); border-radius: 999px; padding: 6px 12px; font-size: 13px; cursor: pointer; }}
@media (max-width: 860px) {{
  header.hero {{ padding-top: 60px; }}
  .layout {{ grid-template-columns: minmax(0, 1fr); gap: 8px; padding-top: 20px; }}
  nav.toc {{ position: static; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 12px; }}
  nav.toc ol {{ display: flex; flex-wrap: wrap; gap: 4px; }}
  nav.toc li a {{ padding: 4px 8px; background: var(--accent-soft); }}
}}
@media print {{ nav.toc, .theme-toggle {{ display: none; }} .layout {{ display: block; }} header.hero {{ color: #000; background: none; }} .card {{ border-color: #999; }} }}
</style>
</head>
<body>
<header class="hero" style="position:relative">
  <button class="theme-toggle" type="button" id="theme">Theme</button>
  <div class="inner">
    <p class="eyebrow">Research report · updated 21 Oct 2026</p>
    <h1>December 2026 workation and family trip to Siem Reap</h1>
    <p class="lede">A beach weekend in Phuket, a working week in a riverside suite in Bangkok, then three days at Angkor with the grandparents and kids.</p>
    <div class="cards">
      <div class="card"><div class="k">Weekend · Fri 18 – Sun 20</div><div class="v">Trisara, Phuket</div><div class="s">Entry pool suite · $4,648 for 2 nights</div></div>
      <div class="card"><div class="k">Workweek · Sun 20 – Thu 24</div><div class="v">Four Seasons Bangkok</div><div class="s">Executive Suite with a separate bedroom · about $6,600</div></div>
      <div class="card"><div class="k">Thu 24 Dec</div><div class="v">PG903 · BKK 07:55 → SAI 09:15</div><div class="s">Same flight as the grandparents and kids</div></div>
      <div class="card"><div class="k">Couple, Phase 1</div><div class="v">About $15,200</div><div class="s">from Singapore · about $11,500 with a COMO weekend</div></div>
    </div>
  </div>
</header>
<main>
  <div class="layout">
    <nav class="toc" aria-label="Contents">
      <h2>Contents</h2>
      <ol>
{toc}
      </ol>
    </nav>
    <article>
      <div class="legend">
        <span><span class="tag t-v1">V1</span> live price or official source</span>
        <span><span class="tag t-v2">V2</span> credible secondary source</span>
        <span><span class="tag t-e">E</span> estimate</span>
        <span><span class="tag t-u">U</span> unknown, confirm directly</span>
      </div>
      <blockquote><strong>Limits of this research.</strong> Live prices come from Expedia, which shows the cheapest available room rather than a named category, so hotel prices are floors. No hotel has independent, measured Wi-Fi evidence. Prices and schedules were retrieved on 21 Oct 2026 and change daily.</blockquote>
{body}
    </article>
  </div>
</main>
<footer><div class="inner">Prepared 21 Oct 2026. Prices and flight schedules change daily, so confirm everything before you book.</div></footer>
<script>
(function () {{
  var root = document.documentElement, key = "workation-theme";
  try {{ var saved = localStorage.getItem(key); if (saved) root.setAttribute("data-theme", saved); }} catch (e) {{}}
  document.getElementById("theme").addEventListener("click", function () {{
    var dark = root.getAttribute("data-theme") ? root.getAttribute("data-theme") === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {{ localStorage.setItem(key, next); }} catch (e) {{}}
  }});
}})();
</script>
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page)
print(OUT, len(page), "bytes;", len(toc_tokens), "sections")
