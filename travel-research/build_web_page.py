"""Render travel-research/travel-research-report.md as a web page.

Usage: pip install markdown && python3 travel-research/build_web_page.py [--fragment OUT]

Writes villa/public/workation/index.html, a complete HTML document for the villa site.
With --fragment, it also writes the same page without the document wrapper or the theme
toggle, which is the form the claude.ai Artifact host expects.
"""
import html
import pathlib
import re
import sys

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

body = re.sub(r"<table>", '<div class="table-wrap"><table>', body)
body = body.replace("</table>", "</table></div>")
body = re.sub(r"\((V1|V2|E|U)\)", lambda m: f'<span class="tag t-{m.group(1).lower()}">{m.group(1)}</span>', body)
body = body.replace("<a href=", '<a target="_blank" rel="noopener" href=')

toc = "\n".join(f'        <li><a href="#{t["id"]}">{html.escape(t["name"])}</a></li>' for t in md.toc_tokens)

HEAD = """<title>December Workation Plan</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Research report: a December 2026 couples workation in Southeast Asia and a family trip to Siem Reap.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Public+Sans:wght@400;600;700&display=swap">
<style>
/* Layout: a summary band, then a contents rail beside the report; one column on phones. */
:root {
  --bg: #f4f6f5; --surface: #ffffff; --ink: #17211f; --muted: #55625e; --line: #dce3e0;
  --accent: #0b6b63; --accent-soft: #e1efec; --sandstone: #b0622a;
  --band: #0e3b3f; --band-ink: #f1f7f6;
  --v1: #1d7a3e; --v2: #2c5ea8; --e: #94600a; --u: #a2353b;
  --display: "Bricolage Grotesque", "Avenir Next", "Segoe UI", sans-serif;
  --body: "Public Sans", -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #0f1514; --surface: #162120; --ink: #e5edeb; --muted: #9caeaa; --line: #263431;
    --accent: #5ec6ba; --accent-soft: #15302d; --sandstone: #e39a5d;
    --band: #0a2a2c; --band-ink: #e8f3f1;
    --v1: #6fcf8e; --v2: #8db3ff; --e: #f0bf60; --u: #ff8e94; color-scheme: dark;
  }
}
:root[data-theme="dark"] {
  --bg: #0f1514; --surface: #162120; --ink: #e5edeb; --muted: #9caeaa; --line: #263431;
  --accent: #5ec6ba; --accent-soft: #15302d; --sandstone: #e39a5d;
  --band: #0a2a2c; --band-ink: #e8f3f1;
  --v1: #6fcf8e; --v2: #8db3ff; --e: #f0bf60; --u: #ff8e94; color-scheme: dark;
}
* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 var(--body); }
a { color: var(--accent); }
a:focus-visible, button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.wrap { max-width: 1240px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
header.band { background: var(--band); color: var(--band-ink); }
header.band .wrap { padding-block: 40px 36px; position: relative; }
.eyebrow { text-transform: uppercase; letter-spacing: .09em; font-size: 12px; margin: 0 0 10px; color: color-mix(in srgb, var(--band-ink) 75%, transparent); }
h1 { font-family: var(--display); font-weight: 700; font-size: clamp(30px, 4.6vw, 46px); line-height: 1.1; margin: 0 0 12px; text-wrap: balance; }
.lede { font-size: 18px; max-width: 64ch; margin: 0; color: color-mix(in srgb, var(--band-ink) 92%, transparent); }
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 12px; margin-top: 26px; }
.fact { border: 1px solid color-mix(in srgb, var(--band-ink) 22%, transparent); background: color-mix(in srgb, var(--band-ink) 7%, transparent); border-radius: 10px; padding: 14px 16px; display: grid; gap: 4px; align-content: start; }
.fact .k { font-size: 12px; text-transform: uppercase; letter-spacing: .07em; color: var(--sandstone); font-weight: 700; }
.fact .v { font-family: var(--display); font-size: 19px; font-weight: 600; line-height: 1.25; }
.fact .s { font-size: 13px; color: color-mix(in srgb, var(--band-ink) 82%, transparent); }
.theme-toggle { position: absolute; top: 12px; right: max(16px, env(safe-area-inset-right, 0px)); background: transparent; color: var(--band-ink); border: 1px solid color-mix(in srgb, var(--band-ink) 35%, transparent); border-radius: 999px; padding: 4px 12px; font: 13px var(--body); cursor: pointer; }
.layout { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 36px; padding-block: 32px 64px; }
nav.toc { position: sticky; top: calc(env(safe-area-inset-top, 0px) + 16px); align-self: start; font-size: 14px; }
nav.toc h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .09em; color: var(--muted); margin: 0 0 8px; }
nav.toc ol { list-style: none; padding: 0; margin: 0; display: grid; gap: 2px; }
nav.toc a { display: block; padding: 6px 10px; border-radius: 8px; color: var(--ink); text-decoration: none; }
nav.toc a:hover { background: var(--accent-soft); color: var(--accent); }
article { min-width: 0; }
article h2 { font-family: var(--display); font-weight: 700; font-size: 27px; line-height: 1.2; margin: 44px 0 12px; padding-top: 20px; border-top: 1px solid var(--line); text-wrap: balance; scroll-margin-top: 16px; }
article h3 { font-family: var(--display); font-weight: 600; font-size: 20px; margin: 28px 0 8px; }
article p, article li { max-width: 74ch; }
article li + li { margin-top: 4px; }
.note { margin: 0 0 8px; padding: 12px 16px; background: var(--accent-soft); border-left: 3px solid var(--accent); border-radius: 0 8px 8px 0; }
.legend { display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 13px; color: var(--muted); margin: 0 0 16px; }
.table-wrap { overflow-x: auto; margin: 16px 0 22px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; font-variant-numeric: tabular-nums; }
th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }
th { font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); white-space: nowrap; background: color-mix(in srgb, var(--surface) 70%, var(--accent-soft)); }
tr:last-child td { border-bottom: 0; }
td:first-child { font-weight: 600; }
.tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 0 6px; border-radius: 999px; border: 1px solid currentColor; line-height: 17px; vertical-align: 1px; }
.t-v1 { color: var(--v1); } .t-v2 { color: var(--v2); } .t-e { color: var(--e); } .t-u { color: var(--u); }
footer { border-top: 1px solid var(--line); color: var(--muted); font-size: 13px; }
footer .wrap { padding-block: 22px 44px; }
@media (max-width: 860px) {
  header.band .wrap { padding-block: 52px 30px; }
  .layout { grid-template-columns: minmax(0, 1fr); gap: 12px; padding-block: 20px 48px; }
  nav.toc { position: static; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 12px; }
  nav.toc ol { display: flex; flex-wrap: wrap; gap: 6px; }
  nav.toc a { padding: 4px 9px; background: var(--accent-soft); }
}
</style>"""

BODY = f"""<header class="band">
  <div class="wrap">
    TOGGLE
    <p class="eyebrow">Research report · updated 21 Oct 2026</p>
    <h1>December 2026 workation and family trip to Siem Reap</h1>
    <p class="lede">A beach weekend in Phuket, a working week in a riverside suite in Bangkok, then three days at Angkor with the grandparents and kids.</p>
    <div class="facts">
      <div class="fact"><span class="k">Weekend · Fri 18 – Sun 20</span><span class="v">Trisara, Phuket</span><span class="s">Entry pool suite · $4,648 for 2 nights</span></div>
      <div class="fact"><span class="k">Workweek · Sun 20 – Thu 24</span><span class="v">Four Seasons Bangkok</span><span class="s">Executive Suite with a separate bedroom · about $6,600</span></div>
      <div class="fact"><span class="k">Thu 24 Dec</span><span class="v">PG903 · BKK 07:55 → SAI 09:15</span><span class="s">Same flight as the grandparents and kids</span></div>
      <div class="fact"><span class="k">Couple, Phase 1</span><span class="v">About $15,200</span><span class="s">From Singapore · about $11,500 with a COMO weekend</span></div>
    </div>
  </div>
</header>
<main class="wrap">
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
      <p class="note"><strong>Limits of this research.</strong> Live prices come from Expedia, which shows the cheapest available room rather than a named category, so hotel prices are floors. No hotel has independent, measured Wi-Fi evidence. Prices and schedules were retrieved on 21 Oct 2026 and change daily.</p>
{body}
    </article>
  </div>
</main>
<footer><div class="wrap">Prepared 21 Oct 2026. Prices and flight schedules change daily, so confirm everything before you book.</div></footer>"""

TOGGLE = '<button class="theme-toggle" type="button" id="theme-toggle">Light / dark</button>'
TOGGLE_SCRIPT = """<script>
(function () {
  var root = document.documentElement, key = "workation-theme";
  try { var saved = localStorage.getItem(key); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  document.getElementById("theme-toggle").addEventListener("click", function () {
    var current = root.getAttribute("data-theme");
    var dark = current ? current === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    var next = dark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(key, next); } catch (e) {}
  });
})();
</script>"""

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
{HEAD}
</head>
<body>
{BODY.replace("TOGGLE", TOGGLE, 1)}
{TOGGLE_SCRIPT}
</body>
</html>
"""

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page)
print(OUT, len(page), "bytes")

if "--fragment" in sys.argv:
    frag_path = pathlib.Path(sys.argv[sys.argv.index("--fragment") + 1])
    frag = HEAD.replace("<title>December Workation Plan</title>",
                        '<title>December Workation Plan</title>\n<meta name="claude:viewport-fit-sides" content="cover">', 1)
    frag += "\n" + BODY.replace("    TOGGLE\n", "", 1) + "\n"
    frag_path.write_text(frag)
    print(frag_path, len(frag), "bytes")
