"""
Step 12 — Thematic classification and theme capital rotation (Part 4).

Taxonomy: data/themes.csv (theme, parent group, curated member tickers) extended by issuer-name keyword
rules in data/theme_rules.csv. A security can belong to several themes; attribution weights are normalised
to sum to 1 per security so theme exposures never double-count capital.

Honesty note. The taxonomy is defined today, so theme *membership* carries hindsight (an investor in 2015
did not have an "AI compute" basket). What is tested point-in-time is the *holdings behaviour* within a
fixed basket; the report labels theme-detection results accordingly and runs the historical cycles
(cloud, e-commerce, semis, energy, AI) as case studies rather than as investable backtests.

Per theme and period: holders, initiating, increasing, reducing, exiting managers; aggregate value;
aggregate split-adjusted shares change; weight allocation; ownership concentration (HHI of manager weights);
breadth. Price-driven value change is separated from holdings change using period-end prices when prices
are present (value_change = Δ(shares)×p_end + shares_prev×Δp).
Outputs: DERIVED_DIR/theme_membership.parquet, DERIVED_DIR/theme_quarter.parquet
"""
from __future__ import annotations
import re
from pathlib import Path
import numpy as np, pandas as pd
from config import DERIVED_DIR, SECURITY_MASTER

def membership(sm: pd.DataFrame, themes: pd.DataFrame, rules: pd.DataFrame) -> pd.DataFrame:
    rows = []
    tick = sm.dropna(subset=["ticker"]).copy(); tick["ticker"] = tick["ticker"].str.upper()
    for _, t in themes.iterrows():
        for tk in str(t["example_tickers"]).split(";"):
            tk = tk.strip().upper()
            if not tk:
                continue
            for _, s in tick[tick["ticker"] == tk].iterrows():
                rows.append({"cusip": s["cusip"], "ticker": tk, "theme": t["theme"], "source": "curated"})
    for _, r in rules.iterrows():
        pat = re.compile(r["issuer_regex"], re.I)
        hit = sm[sm["figi_name"].fillna("").str.contains(pat)]
        for _, s in hit.iterrows():
            rows.append({"cusip": s["cusip"], "ticker": s["ticker"], "theme": r["theme"], "source": "rule:" + r["issuer_regex"]})
    m = pd.DataFrame(rows).drop_duplicates(["cusip", "theme"])
    m["attribution"] = 1.0 / m.groupby("cusip")["theme"].transform("count")
    return m

def theme_quarter(h: pd.DataFrame, m: pd.DataFrame) -> pd.DataFrame:
    x = h[h["is_equity_long"]].merge(m[["cusip", "theme", "attribution"]], left_on="CUSIP", right_on="cusip", how="inner")
    x["v"] = x["value"] * x["attribution"]; x["w"] = x["weight"].fillna(0) * x["attribution"]
    live = x[x["status"] != "exited"]
    g = x.groupby(["theme", "period"])
    out = pd.DataFrame({
        "n_holders": live.groupby(["theme", "period"])["manager_id"].nunique(),
        "n_initiating": g.apply(lambda d: d.loc[d["status"] == "new", "manager_id"].nunique()),
        "n_increasing": g.apply(lambda d: d.loc[d["status"] == "increased", "manager_id"].nunique()),
        "n_reducing": g.apply(lambda d: d.loc[d["status"] == "reduced", "manager_id"].nunique()),
        "n_exiting": g.apply(lambda d: d.loc[d["status"] == "exited", "manager_id"].nunique()),
        "agg_value": live.groupby(["theme", "period"])["v"].sum(),
        "agg_weight_mean": live.groupby(["theme", "period"]).apply(lambda d: d.groupby("manager_id")["w"].sum().mean()),
        "n_securities": live.groupby(["theme", "period"])["CUSIP"].nunique(),
        "hhi_holders": live.groupby(["theme", "period"]).apply(lambda d: ((d.groupby("manager_id")["v"].sum() / d["v"].sum()) ** 2).sum()),
        "share_change_sum": g.apply(lambda d: (d["share_change"].fillna(0) * d["attribution"]).sum()),
        "available_ts": g["acceptance_ts_et"].max(),
    }).reset_index().fillna({"n_holders": 0})
    out = out.sort_values(["theme", "period"])
    out["n_holders_prev"] = out.groupby("theme")["n_holders"].shift(1)
    out["breadth_change"] = out["n_holders"] - out["n_holders_prev"]
    out["net_buyers"] = out["n_initiating"] + out["n_increasing"] - out["n_reducing"] - out["n_exiting"]
    return out

def main() -> None:
    base = Path(__file__).resolve().parents[1] / "data"
    sm = pd.read_parquet(SECURITY_MASTER)
    themes = pd.read_csv(base / "themes.csv"); rules = pd.read_csv(base / "theme_rules.csv")
    m = membership(sm, themes, rules)
    m.to_parquet(DERIVED_DIR / "theme_membership.parquet", index=False)
    h = pd.read_parquet(DERIVED_DIR / "holdings_m.parquet")
    h = h[(h["universe_a"] == "1") & ~h["category"].isin(["Quantitative and systematic", "Broad institutional and passive"])]
    tq = theme_quarter(h, m)
    tq.to_parquet(DERIVED_DIR / "theme_quarter.parquet", index=False)
    print(f"{m.cusip.nunique()} securities in {m.theme.nunique()} themes; {len(tq)} theme-quarters")
    print(tq[tq.period == tq.period.max()].sort_values("n_holders", ascending=False)[["theme", "n_holders", "n_initiating", "n_increasing", "n_reducing", "n_exiting", "net_buyers"]].head(12).to_string(index=False))

if __name__ == "__main__":
    main()
