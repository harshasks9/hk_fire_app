"""
Step 8 — Manager behaviour, per manager and quarter (Part 2.2).

From the point-in-time holdings (original snapshots, long equity only):
  counts of new / increased / reduced / unchanged / exited positions; largest additions and reductions by
  share change; concentration (top-1/5/10 weight, Herfindahl, effective N); disclosed-portfolio turnover
  (½ Σ|Δweight| plus entries/exits, the standard "name turnover" and "weight turnover"); persistence
  (median quarters a position is held, share of positions held ≥ 8 quarters); initial sizing (median first
  weight of new positions, and what the position weighs 4 quarters later); diversification trend.

Entities of the same manager are merged: per (manager, period) the entity with the larger long-equity
value is used (parent/subsidiary pairs report nested tables).

Output: DERIVED_DIR/manager_quarter.parquet, DERIVED_DIR/holdings_m.parquet (holdings keyed by manager_id)
"""
from __future__ import annotations
from pathlib import Path
import numpy as np, pandas as pd
from config import DERIVED_DIR

def pick_entities(h: pd.DataFrame, universe: pd.DataFrame) -> pd.DataFrame:
    h = h.merge(universe[["cik", "manager_id", "manager", "category", "universe_a", "defunct_control"]], on="cik", how="inner")
    val = h[h["is_equity_long"] & (h["status"] != "exited")].groupby(["manager_id", "period", "cik"])["value"].sum().reset_index()
    best = val.sort_values("value", ascending=False).drop_duplicates(["manager_id", "period"])[["manager_id", "period", "cik"]]
    return h.merge(best, on=["manager_id", "period", "cik"], how="inner")

def main() -> None:
    universe = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "universe.csv", dtype=str)
    h = pd.read_parquet(DERIVED_DIR / "holdings.parquet")
    hm = pick_entities(h, universe)
    hm.to_parquet(DERIVED_DIR / "holdings_m.parquet", index=False)
    eq = hm[hm["is_equity_long"]].copy()
    live = eq[eq["status"] != "exited"]
    rows = []
    for (mid, period), g in live.groupby(["manager_id", "period"]):
        w = g["weight"].fillna(0).sort_values(ascending=False).values
        allg = eq[(eq["manager_id"] == mid) & (eq["period"] == period)]
        st = allg["status"].value_counts()
        adds = allg[allg["status"].isin(["new", "increased"])].nlargest(3, "weight_change")
        cuts = allg[allg["status"].isin(["reduced", "exited"])].nsmallest(3, "weight_change")
        dw = allg["weight_change"].abs().sum() / 2 if allg["weight_prev"].notna().any() else np.nan
        rows.append({
            "manager_id": mid, "period": period, "cik": g["cik"].iloc[0], "manager": g["manager"].iloc[0], "category": g["category"].iloc[0],
            "acceptance_ts_et": g["acceptance_ts_et"].iloc[0],
            "long_value": g["value"].sum(), "n_positions": len(g),
            "top1": w[:1].sum(), "top5": w[:5].sum(), "top10": w[:10].sum(), "hhi": float((w ** 2).sum()),
            "effective_n": float(1 / (w ** 2).sum()) if (w ** 2).sum() > 0 else np.nan,
            "n_new": int(st.get("new", 0)), "n_increased": int(st.get("increased", 0)), "n_reduced": int(st.get("reduced", 0)),
            "n_unchanged": int(st.get("unchanged", 0)), "n_exited": int(st.get("exited", 0)), "n_unknown_prev": int(st.get("unknown_prev", 0)),
            "weight_turnover": dw,
            "name_turnover": (st.get("new", 0) + st.get("exited", 0)) / (2 * max(len(g), 1)),
            "new_weight_median": allg.loc[allg["status"] == "new", "weight"].median(),
            "new_weight_sum": allg.loc[allg["status"] == "new", "weight"].sum(),
            "largest_adds": "; ".join(f"{r.issuer} ({r.weight_change:+.1%})" for r in adds.itertuples()),
            "largest_cuts": "; ".join(f"{r.issuer} ({r.weight_change:+.1%})" for r in cuts.itertuples()),
            "n_options_rows": int((hm[(hm["manager_id"] == mid) & (hm["period"] == period)]["security_type_raw"].isin(["put", "call"])).sum()),
        })
    mq = pd.DataFrame(rows).sort_values(["manager_id", "period"])
    # Persistence: quarters each (manager, CUSIP) was held, measured on consecutive live quarters.
    live_s = live.sort_values(["manager_id", "CUSIP", "period"])
    live_s["q"] = live_s["period"].dt.year * 4 + (live_s["period"].dt.month - 1) // 3
    live_s["gap"] = live_s.groupby(["manager_id", "CUSIP"])["q"].diff().ne(1).cumsum()
    runs = live_s.groupby(["manager_id", "CUSIP", "gap"]).size().rename("run_len").reset_index()
    pers = runs.groupby("manager_id")["run_len"].agg(median_hold_q="median", share_ge8q=lambda s: (s >= 8).mean(), n_runs="size")
    # Initial sizing: weight at entry versus 4 quarters later for new positions
    new = live_s[live_s["status"] == "new"][["manager_id", "CUSIP", "period", "q", "weight"]].rename(columns={"weight": "w0"})
    later = live_s[["manager_id", "CUSIP", "q", "weight"]].rename(columns={"weight": "w4"}); later["q"] = later["q"] - 4
    sz = new.merge(later, on=["manager_id", "CUSIP", "q"], how="left")
    sizing = sz.groupby("manager_id").agg(entry_weight_median=("w0", "median"), still_held_4q=("w4", lambda s: s.notna().mean()),
                                          weight_4q_over_entry=("w4", lambda s: np.nan))  # placeholder, filled below
    ratio = (sz["w4"] / sz["w0"]).groupby(sz["manager_id"]).median()
    sizing["weight_4q_over_entry"] = ratio
    summary = mq.groupby("manager_id").agg(manager=("manager", "first"), category=("category", "first"), quarters=("period", "size"),
                                           first_period=("period", "min"), last_period=("period", "max"),
                                           avg_positions=("n_positions", "mean"), avg_top10=("top10", "mean"), avg_effective_n=("effective_n", "median"),
                                           avg_weight_turnover=("weight_turnover", "mean"), avg_name_turnover=("name_turnover", "mean"),
                                           avg_new_per_q=("n_new", "mean"), avg_exits_per_q=("n_exited", "mean"),
                                           latest_value=("long_value", "last")).join(pers).join(sizing)
    mq.to_parquet(DERIVED_DIR / "manager_quarter.parquet", index=False)
    summary.reset_index().to_parquet(DERIVED_DIR / "manager_summary.parquet", index=False)
    print(f"{len(mq):,} manager-quarters, {mq.manager_id.nunique()} managers")
    print(summary.sort_values("avg_weight_turnover")[["manager", "avg_positions", "avg_top10", "avg_weight_turnover", "median_hold_q", "entry_weight_median"]].head(12).to_string())

if __name__ == "__main__":
    main()
