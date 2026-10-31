"""
Step 11 (quarterly) — Event studies for the pre-specified signals on 13F-implied prices.

Same hypotheses and tables as event_study.py (S1–S14), with the quarterly execution rule of bt_quarterly:
entry at the first quarter end strictly after public availability; horizons 3m/6m/12m/24m/36m.
Outputs: OUTPUT_DIR/event_study/<signal>.csv, all_signals.csv, DERIVED_DIR/events_*_returns.parquet
"""
from __future__ import annotations
import sys
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel, quarterly_factors, forward_returns, summarize, calendar_time_returns, factor_alpha_q, covered, HORIZONS_Q

OUT = OUTPUT_DIR / "event_study"; OUT.mkdir(parents=True, exist_ok=True)
ALPHA_HOLD = {"3m": 1, "6m": 2, "12m": 4}

def attach_prior_returns(ev: pd.DataFrame, panel: pd.DataFrame) -> pd.DataFrame:
    """Trailing 2-quarter (≈6m) and 4-quarter-minus-latest (≈12-1) returns to the report period end — known at the event."""
    periods = panel.index; arr = panel.values; col = pd.Index(panel.columns).get_indexer(ev["CUSIP"])
    pend = np.clip(periods.searchsorted(ev["period"].values, side="right") - 1, 0, len(periods) - 1)
    def ret(back_hi, back_lo):
        a = np.clip(pend - back_hi, 0, None); b = np.clip(pend - back_lo, 0, None)
        return arr[b, col] / arr[a, col] - 1
    ev["ret_6m_prior"] = ret(2, 0); ev["mom_12_1"] = ret(4, 1)
    return ev

def run_table(ev: pd.DataFrame, by, name: str, panel, ffq, alpha: bool = True, worst_case: pd.DataFrame | None = None, sample: str = "all") -> pd.DataFrame:
    t = summarize(ev, by)
    if worst_case is not None and len(worst_case):
        w = summarize(worst_case, by); w["measure"] = w["measure"] + "_worstcase_delist"
        t = pd.concat([t, w[w["measure"] == "xs_spy_worstcase_delist"]], ignore_index=True)
    if alpha and len(ev):
        rows = []
        groups = ev.groupby(by, observed=True) if by else [((), ev)]
        for key, g in groups:
            base = dict(zip(by, key if isinstance(key, tuple) else (key,))) if by else {}
            if len(g) < 30:
                continue
            for h, k in ALPHA_HOLD.items():
                a = factor_alpha_q(calendar_time_returns(g, panel, k), ffq)
                rows.append({**base, "horizon": h, "measure": "ff6_alpha_ann", "n": len(g), "n_periods": a.get("quarters"), "mean": a["alpha_ann"], "t_cluster": a["alpha_t"],
                             "beta_mkt": a.get("beta_mkt"), "beta_smb": a.get("beta_smb"), "beta_hml": a.get("beta_hml"), "beta_mom": a.get("beta_mom"), "r2": a.get("r2")})
        t = pd.concat([t, pd.DataFrame(rows)], ignore_index=True)
    t.insert(0, "signal", name)
    t.to_csv(OUT / f"{name}_{sample}.csv", index=False)
    return t

def main(sample: str = "all") -> None:
    panel, holders, aggval = load_panel(); ffq = quarterly_factors()
    em = pd.read_parquet(DERIVED_DIR / "events_manager.parquet"); es = pd.read_parquet(DERIVED_DIR / "events_stock.parquet")
    print(f"panel {panel.shape}; manager events priced {em.CUSIP.isin(panel.columns).mean():.1%}, stock-periods priced {es.CUSIP.isin(panel.columns).mean():.1%}")
    q = em[(em["universe_a"] == "1") & ~em["is_control"]].copy()
    M = covered(forward_returns(q, panel)); M = attach_prior_returns(M, panel)
    Mw = covered(forward_returns(q, panel, worst_case_delist=True))
    if sample != "all":   # 'train' (entry ≤ 2020-12-31) or 'test' (entry ≥ 2021-03-31) for the out-of-sample protocol
        cut = pd.Timestamp("2020-12-31")
        M = M[M["entry_period"] <= cut] if sample == "train" else M[M["entry_period"] > cut]
        Mw = Mw[Mw["entry_period"] <= cut] if sample == "train" else Mw[Mw["entry_period"] > cut]
    M.to_parquet(DERIVED_DIR / f"events_manager_returns_{sample}.parquet", index=False)
    tabs = []
    tabs.append(run_table(M[M["status"] == "new"], ["new_weight_bucket"], "S1_new_position_by_weight", panel, ffq, worst_case=Mw[Mw["status"] == "new"], sample=sample))
    sel = M["conviction_add"] | ((M["status"] == "new") & (M["weight"] >= 0.01))
    tabs.append(run_table(M[sel].assign(kind=lambda d: np.where(d["conviction_add"], "conviction_add", "new_ge1pct")), ["kind"], "S2_conviction_add_vs_new", panel, ffq, sample=sample))
    acc = M[M["status"].isin(["new", "increased"])].assign(consec=lambda d: pd.cut(d["consecutive_adds"], [0, 1, 2, 3, 99], labels=["1", "2", "3", "4+"]))
    tabs.append(run_table(acc, ["consec"], "S3_consecutive_accumulation", panel, ffq, sample=sample))
    ex = M[M["status"] == "exited"].assign(kind=lambda d: np.where(d["exit_top10"], "exit_top10", "exit_other"))
    tabs.append(run_table(ex, ["kind"], "S6_exits", panel, ffq, worst_case=Mw[Mw["status"] == "exited"].assign(kind=lambda d: np.where(d["exit_top10"], "exit_top10", "exit_other")), sample=sample))
    contr = M[M["status"].isin(["new", "increased"]) & M["ret_6m_prior"].notna()].assign(drawdown=lambda d: pd.cut(d["ret_6m_prior"], [-1.01, -0.4, -0.2, 0, 0.2, 100], labels=["≤−40%", "−40..−20%", "−20..0%", "0..20%", ">20%"]))
    tabs.append(run_table(contr, ["drawdown"], "S8_contrarian_accumulation", panel, ffq, sample=sample))
    live = M[M["status"] != "exited"].assign(bucket=lambda d: np.where(d["top5"], "top5", "rest"))
    tabs.append(run_table(live, ["bucket"], "S9_top5_vs_rest", panel, ffq, alpha=False, sample=sample))
    mom = M[M["status"].isin(["new", "increased"]) & M["mom_12_1"].notna()].copy()
    mom["mom_tercile"] = mom.groupby("period")["mom_12_1"].transform(lambda s: pd.qcut(s.rank(method="first"), 3, labels=["low", "mid", "high"]) if len(s) >= 3 else pd.Series(index=s.index, dtype="object"))
    tabs.append(run_table(mom, ["mom_tercile"], "S14_accumulation_by_momentum", panel, ffq, alpha=False, sample=sample))
    tabs.append(run_table(M[M["status"].isin(["new", "increased"])], ["category"], "S10_by_manager_category", panel, ffq, alpha=False, sample=sample))
    tabs.append(run_table(M[M["status"].isin(["new", "increased"])], ["manager_id"], "S10_by_manager", panel, ffq, alpha=False, sample=sample))
    # stock-level
    S = covered(forward_returns(es, panel)); S = attach_prior_returns(S, panel)
    if sample != "all":
        S = S[S["entry_period"] <= cut] if sample == "train" else S[S["entry_period"] > cut]
    S.to_parquet(DERIVED_DIR / f"events_stock_returns_{sample}.parquet", index=False)
    cons = S[S["consensus_buy"] >= 1].assign(buyers=lambda d: pd.cut(d["consensus_buy"], [0, 1, 2, 4, 9, 999], labels=["1", "2", "3–4", "5–9", "10+"]))
    tabs.append(run_table(cons, ["buyers"], "S4_consensus_buyers", panel, ffq, sample=sample))
    tabs.append(run_table(S[S["early_candidate"]], None, "S5_early_candidates", panel, ffq, sample=sample))
    tabs.append(run_table(S[S["collective_distribution"]], None, "S7_collective_distribution", panel, ffq, sample=sample))
    accel = S.assign(accel=lambda d: pd.cut(d["ownership_accel"], [-99, -3, -1, 0, 1, 2, 99], labels=["≤−3", "−2..−1", "0", "+1", "+2", "≥+3"]))
    tabs.append(run_table(accel, ["accel"], "S11_ownership_acceleration", panel, ffq, alpha=False, sample=sample))
    tabs.append(run_table(S[S["crowded"]], None, "S12_crowded", panel, ffq, sample=sample))
    allt = pd.concat(tabs, ignore_index=True); allt["sample"] = sample
    allt.to_csv(OUT / f"all_signals_{sample}.csv", index=False)
    keys = [c for c in ["new_weight_bucket", "kind", "consec", "buyers", "drawdown", "bucket", "accel", "mom_tercile", "category"] if c in allt.columns]
    view = allt[(allt.measure == "xs_spy") & (allt.horizon == "12m") & (allt.signal != "S10_by_manager")]
    print(view[["signal"] + keys + ["n", "n_periods", "mean", "median", "win_rate", "t_cluster", "ci_lo", "ci_hi", "truncated_share"]].to_string(index=False, float_format=lambda v: f"{v:.3f}"))

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "all")
