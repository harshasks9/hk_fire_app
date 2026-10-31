"""
Step 9 — The signal library (Part 3): every hypothesis as a measurable event table.

Two event tables are produced, both keyed by CUSIP and carrying an `available_ts` (US Eastern) that is the
earliest moment the information was public. Prices are joined later in backtest.py; nothing here uses them.

events_manager.parquet — one row per (manager, CUSIP, period) with the manager's action and context:
  status, weight, weight_prev, weight_change, share_change_pct, new-position weight bucket (S1),
  conviction add (S2: increased ≥ 25 % in shares and ≥ 1 % weight after), consecutive accumulation
  count (S3), top-5 flag (S9), exit from a top-10 position (S6), manager style-change z-scores (S15).

events_stock.parquet — one row per (CUSIP, period) aggregated over *qualifying* managers (Universe A
  minus the quantitative/platform and broad/passive controls): holders, new, increased, reduced, exited,
  consensus score (S4), ownership acceleration (S11), early-discovery label (S5), collective
  distribution (S7), crowding level (S12). available_ts is the LAST acceptance among the contributing
  filings — a cross-sectional signal is not computable before all of its inputs are public.
Contrarian accumulation (S8), momentum controls (S14) and the skill-conditioned signals (S10, S13) need
prices or prior backtest output and are attached in backtest.py / scorecard.py.
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import DERIVED_DIR

CONTROL_CATEGORIES = {"Quantitative and systematic", "Broad institutional and passive"}
WEIGHT_BUCKETS = [0, 0.005, 0.02, 0.05, 0.10, 1.01]
WEIGHT_LABELS = ["<0.5%", "0.5–2%", "2–5%", "5–10%", ">10%"]

def manager_events(h: pd.DataFrame) -> pd.DataFrame:
    e = h[h["is_equity_long"] & h["status"].isin(["new", "increased", "reduced", "unchanged", "exited"])].copy()
    e = e.sort_values(["manager_id", "CUSIP", "period"])
    e["q"] = e["period"].dt.year * 4 + (e["period"].dt.month - 1) // 3
    e["rank_in_portfolio"] = e.groupby(["manager_id", "period"])["weight"].rank(ascending=False, method="first")
    e["rank_prev"] = e.groupby(["manager_id", "period"])["weight_prev"].rank(ascending=False, method="first")
    e["top5"] = e["rank_in_portfolio"] <= 5
    e["new_weight_bucket"] = pd.cut(e["weight"].where(e["status"] == "new"), WEIGHT_BUCKETS, labels=WEIGHT_LABELS, right=False)
    e["conviction_add"] = (e["status"] == "increased") & (e["share_change_pct"] >= 0.25) & (e["weight"] >= 0.01)
    e["big_cut"] = (e["status"] == "reduced") & (e["share_change_pct"] <= -0.25) & (e["weight_prev"] >= 0.01)
    e["exit_top10"] = (e["status"] == "exited") & (e["rank_prev"] <= 10)
    # consecutive quarters of accumulation (new counts as 1, each consecutive 'increased' adds 1; anything else resets)
    acc = (e["status"].isin(["new", "increased"])).astype(int)
    grp = e.groupby(["manager_id", "CUSIP"])
    consec = []
    for _, s in acc.groupby([e["manager_id"], e["CUSIP"]], sort=False):
        run, out = 0, []
        for v in s.values:
            run = run + 1 if v else 0
            out.append(run)
        consec.extend(out)
    e["consecutive_adds"] = consec
    e["quarters_held"] = grp.cumcount() + 1
    e["available_ts"] = pd.to_datetime(e["acceptance_ts_et"])
    e["is_control"] = e["category"].isin(CONTROL_CATEGORIES)
    # style change (S15): manager's quarterly new-position count and weight turnover vs its own trailing 8-quarter history
    mq = pd.read_parquet(DERIVED_DIR / "manager_quarter.parquet").sort_values(["manager_id", "period"])
    for col in ["n_new", "weight_turnover", "n_positions"]:
        r = mq.groupby("manager_id")[col]
        mq[f"{col}_z"] = (mq[col] - r.transform(lambda s: s.shift(1).rolling(8, min_periods=4).mean())) / r.transform(lambda s: s.shift(1).rolling(8, min_periods=4).std())
    e = e.merge(mq[["manager_id", "period", "n_new_z", "weight_turnover_z", "n_positions_z"]], on=["manager_id", "period"], how="left")
    keep = ["manager_id", "manager", "category", "universe_a", "defunct_control", "is_control", "cik", "accession", "period", "q", "available_ts",
            "CUSIP", "issuer", "status", "shares", "shares_prev", "share_change_pct", "value", "weight", "weight_prev", "weight_change",
            "rank_in_portfolio", "rank_prev", "top5", "new_weight_bucket", "conviction_add", "big_cut", "exit_top10", "consecutive_adds",
            "quarters_held", "split_suspect", "amended_later", "n_new_z", "weight_turnover_z", "n_positions_z"]
    return e[keep]

def stock_events(e: pd.DataFrame) -> pd.DataFrame:
    q = e[(e["universe_a"] == "1") & ~e["is_control"]].copy()
    live = q[q["status"] != "exited"]
    g = q.groupby(["CUSIP", "period"])
    s = pd.DataFrame({
        "issuer": g["issuer"].first(),
        "available_ts": g["available_ts"].max(),
        "first_available_ts": g["available_ts"].min(),
        "n_holders": live.groupby(["CUSIP", "period"]).size(),
        "n_new": g["status"].apply(lambda x: (x == "new").sum()),
        "n_increased": g["status"].apply(lambda x: (x == "increased").sum()),
        "n_reduced": g["status"].apply(lambda x: (x == "reduced").sum()),
        "n_exited": g["status"].apply(lambda x: (x == "exited").sum()),
        "n_conviction_add": g["conviction_add"].sum(),
        "n_big_cut": g["big_cut"].sum(),
        "n_top5": g["top5"].sum(),
        "sum_weight": live.groupby(["CUSIP", "period"])["weight"].sum(),
        "mean_weight": live.groupby(["CUSIP", "period"])["weight"].mean(),
        "sum_value": live.groupby(["CUSIP", "period"])["value"].sum(),
        "max_consecutive_adds": g["consecutive_adds"].max(),
        "holders": live.groupby(["CUSIP", "period"])["manager_id"].agg(lambda x: ";".join(sorted(x))),
        "buyers": g.apply(lambda x: ";".join(sorted(x.loc[x["status"].isin(["new", "increased"]), "manager_id"]))),
        "sellers": g.apply(lambda x: ";".join(sorted(x.loc[x["status"].isin(["reduced", "exited"]), "manager_id"]))),
    }).reset_index()
    s[["n_holders", "sum_weight", "mean_weight", "sum_value"]] = s[["n_holders", "sum_weight", "mean_weight", "sum_value"]].fillna(0)
    s = s.sort_values(["CUSIP", "period"])
    s["q"] = s["period"].dt.year * 4 + (s["period"].dt.month - 1) // 3
    prev = s[["CUSIP", "q", "n_holders", "sum_weight"]].copy(); prev["q"] += 1
    s = s.merge(prev.rename(columns={"n_holders": "n_holders_prev", "sum_weight": "sum_weight_prev"}), on=["CUSIP", "q"], how="left")
    s["n_holders_prev"] = s["n_holders_prev"].fillna(0)
    s["buyers_net"] = s["n_new"] + s["n_increased"] - s["n_reduced"] - s["n_exited"]
    s["consensus_buy"] = s["n_new"] + s["n_increased"]                     # S4: breadth of independent accumulation
    s["ownership_accel"] = s["n_holders"] - s["n_holders_prev"]            # S11
    s["collective_distribution"] = (s["n_reduced"] + s["n_exited"] >= 3) & (s["buyers_net"] <= -2)   # S7
    s["crowded"] = s["n_holders"] >= s.groupby("period")["n_holders"].transform(lambda x: x.quantile(0.98))  # S12 (top 2 % of names by breadth)
    # S5 early discovery label: ≤ 2 holders now, ≥ 5 holders within the next 4 quarters (label only — a prediction target)
    fut = s[["CUSIP", "q", "n_holders"]].copy()
    for k in range(1, 5):
        f = fut.copy(); f["q"] -= k
        s = s.merge(f.rename(columns={"n_holders": f"n_holders_f{k}"}), on=["CUSIP", "q"], how="left")
    s["early_discovery_label"] = (s["n_holders"] <= 2) & (s[[f"n_holders_f{k}" for k in range(1, 5)]].max(axis=1) >= 5)
    s["early_candidate"] = (s["n_holders"] <= 2) & (s["n_new"] >= 1)
    return s

def main() -> None:
    h = pd.read_parquet(DERIVED_DIR / "holdings_m.parquet")
    e = manager_events(h)
    e.to_parquet(DERIVED_DIR / "events_manager.parquet", index=False)
    s = stock_events(e)
    s.to_parquet(DERIVED_DIR / "events_stock.parquet", index=False)
    print(f"manager events {len(e):,}; stock-periods {len(s):,}; CUSIPs {s.CUSIP.nunique():,}")
    print("new-position buckets:", e["new_weight_bucket"].value_counts().to_dict())
    print("conviction adds:", int(e.conviction_add.sum()), "top-10 exits:", int(e.exit_top10.sum()), "consecutive ≥3:", int((e.consecutive_adds >= 3).sum()))
    print("consensus ≥5:", int((s.consensus_buy >= 5).sum()), "collective distribution:", int(s.collective_distribution.sum()), "early labels:", int(s.early_discovery_label.sum()))

if __name__ == "__main__":
    main()
