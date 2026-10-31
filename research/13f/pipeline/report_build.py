"""
Step 17 — Assemble the deliverables from the output tables.

  outputs/REPORT-DATA.md      every table the executive report cites, rendered from CSV (no hand-typed numbers)
  outputs/dashboard.html      the institutional theme-rotation dashboard + leaderboard + strategies + current lists,
                              a single self-contained HTML file with inline SVG charts (no external scripts)
  outputs/manager_database.csv the manager intelligence database (universe + behaviour + scorecard)
"""
from __future__ import annotations
import html, json
from pathlib import Path
import numpy as np, pandas as pd
from config import OUTPUT_DIR, DERIVED_DIR

def md_table(df: pd.DataFrame, floatfmt: str = "{:.3f}", max_rows: int = 60) -> str:
    d = df.head(max_rows).copy()
    for c in d.columns:
        if d[c].dtype.kind == "f":
            d[c] = d[c].map(lambda v: "" if pd.isna(v) else floatfmt.format(v))
    cols = [str(c) for c in d.columns]
    lines = ["| " + " | ".join(cols) + " |", "|" + "|".join(["---"] * len(cols)) + "|"]
    for _, r in d.iterrows():
        lines.append("| " + " | ".join(str(v).replace("|", "/") for v in r.values) + " |")
    return "\n".join(lines)

def svg_lines(series: dict[str, pd.Series], title: str, w: int = 720, h: int = 240, fmt=lambda v: f"{v:.0f}") -> str:
    allv = pd.concat(series.values()); lo, hi = float(allv.min()), float(allv.max()); span = (hi - lo) or 1
    lo -= 0.05 * span; hi += 0.1 * span
    idx = sorted(set().union(*[set(s.index) for s in series.values()]))
    x = lambda i: 50 + i / max(len(idx) - 1, 1) * (w - 70); y = lambda v: 15 + (1 - (v - lo) / (hi - lo)) * (h - 45)
    colors = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6e6d68", "#8e44ad", "#16a085"]
    out = [f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{html.escape(title)}" style="width:100%;height:auto;font:11px system-ui">']
    for k in range(5):
        v = lo + (hi - lo) * k / 4; out.append(f'<line x1="50" x2="{w-20}" y1="{y(v):.1f}" y2="{y(v):.1f}" stroke="#e3e2dd"/><text x="46" y="{y(v)+4:.1f}" text-anchor="end" fill="#6e6d68">{fmt(v)}</text>')
    for j, (name, s) in enumerate(series.items()):
        pts = " ".join(f"{x(idx.index(t)):.1f},{y(v):.1f}" for t, v in s.dropna().items())
        out.append(f'<polyline points="{pts}" fill="none" stroke="{colors[j % len(colors)]}" stroke-width="2"/>')
        last = s.dropna()
        if len(last):
            out.append(f'<text x="{x(idx.index(last.index[-1]))-4:.1f}" y="{y(last.iloc[-1])-6:.1f}" text-anchor="end" fill="{colors[j % len(colors)]}" font-weight="600">{html.escape(str(name))}</text>')
    step = max(1, len(idx) // 8)
    for i, t in enumerate(idx):
        if i % step == 0 or i == len(idx) - 1:
            out.append(f'<text x="{x(i):.1f}" y="{h-6}" text-anchor="middle" fill="#6e6d68">{pd.Timestamp(t).strftime("%Y-%m")}</text>')
    out.append("</svg>"); return "".join(out)

def main() -> None:
    O = OUTPUT_DIR
    parts = ["# Report data tables\n\nEvery number below is rendered from the pipeline's CSV outputs; see README.md for the step that produced each file.\n"]
    def section(title, path, **kw):
        p = O / path
        if p.exists():
            parts.append(f"\n## {title}\n\n`{path}`\n\n" + md_table(pd.read_csv(p), **kw) + "\n")
    section("Signal leaderboard (12-month SPY-excess, pre-specified tests)", "leaderboard.csv")
    section("Strategies — full sample", "strategies/summary_base.csv")
    section("Strategies — sensitivities (train / test / costs)", "validation/strategy_sensitivities.csv", max_rows=80)
    section("Manager scorecard", "scorecard/manager_scorecard.csv", max_rows=110)
    section("Theme stages — forward returns by stage", "themes/stage_returns.csv")
    section("Theme cases", "themes/theme_cases.csv")
    section("Current themes", "themes/current_themes.csv")
    section("Current — top 20 accumulation", "current/top20_accumulation.csv")
    section("Current — top 20 distribution", "current/top20_distribution.csv")
    section("Current — disagreements", "current/disagreements.csv")
    for f in sorted((O / "event_study").glob("S*_all.csv")):
        if "by_manager" in f.name:
            continue
        d = pd.read_csv(f); d = d[d["measure"].isin(["xs_spy", "ff6_alpha_ann"])]
        parts.append(f"\n## Event study — {f.stem}\n\n" + md_table(d, max_rows=80) + "\n")
    (O / "REPORT-DATA.md").write_text("\n".join(parts))
    # manager database
    u = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "universe.csv", dtype=str)
    beh = pd.read_parquet(DERIVED_DIR / "manager_summary.parquet")
    sc = pd.read_csv(O / "scorecard" / "manager_scorecard.csv") if (O / "scorecard" / "manager_scorecard.csv").exists() else pd.DataFrame(columns=["manager_id"])
    db = u.merge(beh.drop(columns=["manager", "category"], errors="ignore"), on="manager_id", how="left").merge(sc.drop(columns=["manager", "category", "universe_a", "defunct_control"], errors="ignore"), on="manager_id", how="left")
    db.to_csv(O / "manager_database.csv", index=False)
    # dashboard
    tq = pd.read_csv(O / "themes" / "theme_stage_quarter.csv", parse_dates=["period"]) if (O / "themes" / "theme_stage_quarter.csv").exists() else None
    css = "body{font:14px/1.5 system-ui;margin:0;background:#f6f6f4;color:#3d3c39}.wrap{max-width:1100px;margin:0 auto;padding:20px 16px}.card{background:#fff;border:1px solid #e3e2dd;border-radius:12px;padding:18px;margin:0 0 18px}h1{font-size:22px;color:#0b0b0b}h2{font-size:16px;color:#0b0b0b;margin:0 0 10px}table{border-collapse:collapse;width:100%;font-size:12px}th{text-align:left;font-size:11px;text-transform:uppercase;color:#6e6d68;border-bottom:1px solid #e3e2dd;padding:4px 8px 4px 0}td{padding:5px 8px 5px 0;border-bottom:1px solid #eee;vertical-align:top}.tw{overflow-x:auto}.small{font-size:12px;color:#6e6d68}"
    body = [f"<h1>Institutional theme rotation — 13F top-100 managers</h1><p class='small'>Point-in-time holdings of the qualifying managers (Universe A minus quantitative and passive controls). Breadth = number of managers holding; net buyers = initiating + increasing − reducing − exiting. Stages per docs; prices are 13F-implied quarter-end prices.</p>"]
    if tq is not None:
        top_themes = tq[tq["period"] == tq["period"].max()].nlargest(8, "n_holders")["theme"].tolist()
        series = {th: tq[tq["theme"] == th].set_index("period")["n_holders"] for th in top_themes}
        body.append("<div class='card'><h2>Breadth of ownership — eight widest themes</h2>" + svg_lines(series, "Theme breadth") + "</div>")
        nb = {th: tq[tq["theme"] == th].set_index("period")["net_buyers_2q"] for th in top_themes}
        body.append("<div class='card'><h2>Net buyers, trailing two quarters</h2>" + svg_lines(nb, "Net buyers", fmt=lambda v: f"{v:+.0f}") + "</div>")
        cur = pd.read_csv(O / "themes" / "current_themes.csv")
        body.append("<div class='card'><h2>Current theme stages</h2><div class='tw'>" + cur.to_html(index=False, float_format=lambda v: f"{v:.2f}", border=0) + "</div></div>")
        sr = pd.read_csv(O / "themes" / "stage_returns.csv")
        body.append("<div class='card'><h2>Forward theme returns by stage (SPY-excess)</h2><div class='tw'>" + sr.to_html(index=False, float_format=lambda v: f"{v:.3f}", border=0) + "</div></div>")
    for title, path in [("Signal leaderboard", "leaderboard.csv"), ("Strategies", "strategies/summary_base.csv"), ("Top 20 accumulation", "current/top20_accumulation.csv"), ("Top 20 distribution warnings", "current/top20_distribution.csv"), ("Disagreements", "current/disagreements.csv")]:
        p = O / path
        if p.exists():
            d = pd.read_csv(p)
            body.append(f"<div class='card'><h2>{html.escape(title)}</h2><div class='tw'>" + d.head(40).to_html(index=False, float_format=lambda v: f"{v:.3f}", border=0, na_rep="") + "</div></div>")
    (O / "dashboard.html").write_text(f"<!doctype html><html lang='en'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><meta name='robots' content='noindex'><title>13F theme rotation dashboard</title><style>{css}</style></head><body><div class='wrap'>{''.join(body)}</div></body></html>")
    print("report data, manager database and dashboard written")

if __name__ == "__main__":
    main()
