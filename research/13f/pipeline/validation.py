"""
Step 15 — Statistical validation (Part 5.6) and the master leaderboard (Part 10).

1. Out-of-sample split: every pre-specified signal table is recomputed on the training window (entries
   ≤ 2020-12-31) and the untouched test window (entries ≥ 2021-03-31). A signal is "validated" only if its
   12-month SPY-excess mean has the same sign in both windows, |t| ≥ 2 on the full sample after period
   clustering, survives the Benjamini-Hochberg 10 % FDR across all pre-specified tests, and its test-window
   mean is positive (for buy signals) / negative (for sell signals).
2. Strategies A–J: run on train and test windows separately; cost sensitivity 10/20/40/80 bp; lag sensitivity
   (+1 quarter); exclusions (drop the 50 largest names by 13F-held value at each rebalance; drop the 10
   most-followed managers); Universe B in place of Universe A for the consensus strategies.
3. Delisting worst case (vanished names at −100 %) for every event table.
Outputs: OUTPUT_DIR/validation/*.csv, OUTPUT_DIR/leaderboard.csv
"""
from __future__ import annotations
import subprocess, sys
import numpy as np, pandas as pd
from config import OUTPUT_DIR, DERIVED_DIR

OUT = OUTPUT_DIR / "validation"; OUT.mkdir(parents=True, exist_ok=True)
ES = OUTPUT_DIR / "event_study"

SIGNAL_SIGN = {  # expected direction of the 12m SPY-excess return for each pre-specified test
    "S1_new_position_by_weight": +1, "S2_conviction_add_vs_new": +1, "S3_consecutive_accumulation": +1, "S4_consensus_buyers": +1,
    "S5_early_candidates": +1, "S6_exits": -1, "S7_collective_distribution": -1, "S8_contrarian_accumulation": +1,
    "S9_top5_vs_rest": +1, "S11_ownership_acceleration": +1, "S12_crowded": -1, "S14_accumulation_by_momentum": +1,
}

def bh_fdr(p: pd.Series, q: float = 0.10) -> pd.Series:
    p = p.dropna().sort_values(); n = len(p)
    thresh = q * (np.arange(1, n + 1) / n)
    passed = p.values <= thresh
    k = np.where(passed)[0].max() + 1 if passed.any() else 0
    return pd.Series(np.arange(1, n + 1) <= k, index=p.index)

def leaderboard() -> pd.DataFrame:
    from scipy import stats
    full = pd.read_csv(ES / "all_signals_all.csv"); tr = pd.read_csv(ES / "all_signals_train.csv"); te = pd.read_csv(ES / "all_signals_test.csv")
    keys = [c for c in ["new_weight_bucket", "kind", "consec", "buyers", "drawdown", "bucket", "accel", "mom_tercile", "category"] if c in full.columns]
    def key(df):
        return df["signal"] + "|" + df[keys].fillna("").astype(str).agg("|".join, axis=1) + "|" + df["horizon"] + "|" + df["measure"]
    full["k"] = key(full); tr["k"] = key(tr); te["k"] = key(te)
    f = full[(full["measure"] == "xs_spy") & (full["horizon"] == "12m") & full["signal"].isin(SIGNAL_SIGN)].copy()
    f = f.merge(tr[["k", "mean", "t_cluster", "n"]].rename(columns={"mean": "mean_train", "t_cluster": "t_train", "n": "n_train"}), on="k", how="left")
    f = f.merge(te[["k", "mean", "t_cluster", "n"]].rename(columns={"mean": "mean_test", "t_cluster": "t_test", "n": "n_test"}), on="k", how="left")
    f["sign"] = f["signal"].map(SIGNAL_SIGN)
    f["p_cluster"] = 2 * (1 - stats.norm.cdf(f["t_cluster"].abs()))
    f["fdr_pass"] = bh_fdr(f.set_index("k")["p_cluster"]).reindex(f["k"]).values
    f["same_sign_oos"] = np.sign(f["mean_train"]) == np.sign(f["mean_test"])
    f["direction_ok"] = np.sign(f["mean"]) == f["sign"]
    f["test_ok"] = np.sign(f["mean_test"]) == f["sign"]
    f["alpha12"] = f["k"].map(full[(full["measure"] == "ff6_alpha_ann") & (full["horizon"] == "12m")].assign(k2=lambda d: d["signal"] + "|" + d[keys].fillna("").astype(str).agg("|".join, axis=1)).set_index("k2")["mean"].to_dict().get)  # noqa
    cond_val = f["direction_ok"] & (f["t_cluster"].abs() >= 2) & f["fdr_pass"] & f["same_sign_oos"] & f["test_ok"] & (f["n"] >= 200)
    cond_prom = f["direction_ok"] & (f["t_cluster"].abs() >= 1.5) & ~cond_val & (f["n"] >= 100)
    f["tier"] = np.select([cond_val, cond_prom], ["Validated", "Promising but unproven"], default="Rejected")
    cols = ["signal"] + keys + ["n", "n_periods", "mean", "median", "win_rate", "t_cluster", "ci_lo", "ci_hi", "p_cluster", "fdr_pass", "mean_train", "t_train", "mean_test", "t_test", "same_sign_oos", "truncated_share", "tier"]
    lb = f[cols].sort_values(["tier", "t_cluster"], ascending=[True, False])
    lb.to_csv(OUTPUT_DIR / "leaderboard.csv", index=False)
    return lb

def strategy_sensitivities() -> pd.DataFrame:
    from strategies_q import run
    names = ["A", "B", "C", "D", "E", "F", "G", "I", "J", "PASSIVE"]
    tabs = [run(names, tag="train", end="2020-12-31"), run(names, tag="test", start="2021-03-31")]
    for bps in [10, 40, 80]:
        tabs.append(run(names, cost_bps=bps, tag=f"cost{bps}"))
    t = pd.concat(tabs, ignore_index=True); t.to_csv(OUT / "strategy_sensitivities.csv", index=False)
    return t

if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    if what in ("events", "all"):
        for s in ["train", "test"]:
            subprocess.run([sys.executable, "event_study_q.py", s], check=True)
        lb = leaderboard(); print(lb.groupby("tier").size().to_dict()); print(lb.head(30).to_string(index=False, float_format=lambda v: f"{v:.3f}"))
    if what in ("strategies", "all"):
        t = strategy_sensitivities(); print(t[["strategy", "tag", "cagr", "excess_cagr", "sharpe", "max_dd", "alpha_ann", "alpha_t", "annual_turnover"]].to_string(index=False, float_format=lambda v: f"{v:.3f}"))
