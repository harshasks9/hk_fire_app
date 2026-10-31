"""
Step 12b — Theme adoption stages (Part 4.3) and historical theme cases (Part 4.4).

Stage rules are defined on measurable, point-in-time quantities per theme-quarter (breadth = number of
qualifying managers holding; Δbreadth over 4 quarters; net buyers over 2 quarters; concentration HHI of
holders' value):
  1 Discovery       breadth ≤ 5 and net_buyers_2q > 0
  2 Early adoption  5 < breadth ≤ 15 and Δbreadth_4q ≥ +3
  3 Acceleration    breadth > 15 and Δbreadth_4q ≥ +5 and net_buyers_2q > 0
  4 Consensus       breadth ≥ 25 and |Δbreadth_4q| < 5 and HHI ≤ 0.10
  5 Distribution    net_buyers_2q ≤ −4 and Δbreadth_4q ≤ 0
  0 Unclassified    otherwise
Each theme-quarter's stage is assigned from data available at that quarter's filings; the theme's forward
return (equal-weight of its member securities' 13F-implied prices, 4 and 8 quarters) is then compared across
stages, on the training window and the test window separately.

Honesty: the taxonomy is defined today (hindsight in *membership*); stages and returns are point-in-time.
Outputs: OUTPUT_DIR/themes/theme_stage_quarter.csv, stage_returns.csv, theme_cases.csv, current_themes.csv
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel, BENCH_CUSIP, cluster_tstat

OUT = OUTPUT_DIR / "themes"; OUT.mkdir(parents=True, exist_ok=True)
CASES = {"cloud_computing": "2013–2021", "ecommerce": "2013–2021", "semis_packaging": "2016–2024", "energy_commodities": "2020–2022", "ai_compute": "2022–2026", "healthcare_innovation_obesity": "2022–2025", "nuclear": "2023–2026", "datacenter_power_cooling": "2023–2026"}

def theme_returns(panel: pd.DataFrame, memb: pd.DataFrame) -> pd.DataFrame:
    rets = panel.pct_change()
    rows = {}
    for th, d in memb.groupby("theme"):
        cols = [c for c in d["cusip"].unique() if c in panel.columns]
        if cols:
            rows[th] = rets[cols].mean(axis=1)      # equal-weight across members with a price that quarter
    return pd.DataFrame(rows)

def stages(tq: pd.DataFrame) -> pd.DataFrame:
    tq = tq.sort_values(["theme", "period"]).copy()
    g = tq.groupby("theme")
    tq["d_breadth_4q"] = g["n_holders"].diff(4)
    tq["net_buyers_2q"] = g["net_buyers"].transform(lambda s: s.rolling(2, min_periods=1).sum())
    b, db, nb, hhi = tq["n_holders"], tq["d_breadth_4q"], tq["net_buyers_2q"], tq["hhi_holders"]
    tq["stage"] = np.select(
        [(nb <= -4) & (db <= 0), (b <= 5) & (nb > 0), (b > 5) & (b <= 15) & (db >= 3), (b > 15) & (db >= 5) & (nb > 0), (b >= 25) & (db.abs() < 5) & (hhi <= 0.10)],
        [5, 1, 2, 3, 4], default=0)
    return tq

def main() -> None:
    panel, holders, aggval = load_panel()
    memb = pd.read_parquet(DERIVED_DIR / "theme_membership.parquet"); tq = pd.read_parquet(DERIVED_DIR / "theme_quarter.parquet")
    tr = theme_returns(panel, memb)
    spy = panel[BENCH_CUSIP["SPY"]].pct_change()
    tq = stages(tq)
    # forward theme returns from the first quarter end after availability
    periods = panel.index
    tq["entry_pos"] = periods.searchsorted(pd.to_datetime(tq["available_ts"]).dt.normalize().values, side="right")
    for k in [4, 8]:
        fw, fb = [], []
        for r in tq.itertuples():
            i = r.entry_pos
            if r.theme in tr and i + k < len(periods):
                fw.append((1 + tr[r.theme].iloc[i + 1:i + k + 1]).prod() - 1); fb.append((1 + spy.iloc[i + 1:i + k + 1]).prod() - 1)
            else:
                fw.append(np.nan); fb.append(np.nan)
        tq[f"theme_fwd_{k}q"] = fw; tq[f"spy_fwd_{k}q"] = fb; tq[f"theme_xs_{k}q"] = tq[f"theme_fwd_{k}q"] - tq[f"spy_fwd_{k}q"]
    tq.to_csv(OUT / "theme_stage_quarter.csv", index=False)
    rows = []
    for win, sel in [("all", tq), ("train", tq[tq["period"] <= "2020-12-31"]), ("test", tq[tq["period"] > "2020-12-31"])]:
        for st, d in sel.groupby("stage"):
            for k in [4, 8]:
                m, t, n = cluster_tstat(d[f"theme_xs_{k}q"], d["period"])
                rows.append({"window": win, "stage": st, "horizon_q": k, "n": int(d[f"theme_xs_{k}q"].notna().sum()), "n_periods": n, "mean_xs_spy": m, "median": d[f"theme_xs_{k}q"].median(), "win_rate": (d[f"theme_xs_{k}q"] > 0).mean(), "t_cluster": t})
    sr = pd.DataFrame(rows); sr.to_csv(OUT / "stage_returns.csv", index=False)
    # historical cases: first quarter the theme had ≥ 3 qualifying holders and net buyers > 0 (the first observable signal)
    cases = []
    for th in CASES:
        d = tq[tq["theme"] == th].sort_values("period")
        sig = d[(d["n_holders"] >= 3) & (d["net_buyers"] > 0)]
        if sig.empty:
            continue
        first = sig.iloc[0]; i = int(first["entry_pos"])
        def fwd(k):
            return (1 + tr[th].iloc[i + 1:i + k + 1]).prod() - 1 if i + k < len(periods) and th in tr else np.nan
        def spyf(k):
            return (1 + spy.iloc[i + 1:i + k + 1]).prod() - 1 if i + k < len(periods) else np.nan
        peak = d.loc[d["n_holders"].idxmax()]
        cases.append({"theme": th, "cycle": CASES[th], "first_signal_period": first["period"].date(), "first_signal_public": pd.Timestamp(first["available_ts"]).date(),
                      "investable_entry": periods[i].date() if i < len(periods) else None, "holders_at_signal": int(first["n_holders"]),
                      "ret_6m": fwd(2), "ret_12m": fwd(4), "ret_24m": fwd(8), "ret_36m": fwd(12), "spy_6m": spyf(2), "spy_12m": spyf(4), "spy_24m": spyf(8), "spy_36m": spyf(12),
                      "peak_breadth": int(peak["n_holders"]), "peak_breadth_period": peak["period"].date(),
                      "stage_now": int(d.iloc[-1]["stage"]), "breadth_now": int(d.iloc[-1]["n_holders"])})
    pd.DataFrame(cases).to_csv(OUT / "theme_cases.csv", index=False)
    cur = tq[tq["period"] == tq["period"].max()].sort_values(["stage", "net_buyers_2q"], ascending=[True, False])
    cur[["theme", "period", "stage", "n_holders", "d_breadth_4q", "net_buyers_2q", "n_initiating", "n_increasing", "n_reducing", "n_exiting", "hhi_holders", "agg_value"]].to_csv(OUT / "current_themes.csv", index=False)
    print(sr[sr.window == "all"].to_string(index=False, float_format=lambda v: f"{v:.3f}")); print(pd.DataFrame(cases).to_string(index=False, float_format=lambda v: f"{v:.2f}"))

if __name__ == "__main__":
    main()
