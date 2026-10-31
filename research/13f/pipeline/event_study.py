"""
Step 11 — Event studies for the signal library (Part 3 / Part 5.2).

Joins events_manager / events_stock to prices (via the security master), computes point-in-time forward
returns at every horizon, and writes one summary table per pre-specified hypothesis. Every table reports
N, number of report-period clusters, mean / median / win rate, a period-clustered t-statistic and a
period-block bootstrap 95 % CI on the SPY-excess return, and the FF5+Mom calendar-time alpha at the
matching holding period.

Pre-specified hypotheses (run as written before any result was seen; see docs/METHODOLOGY.md):
  S1  new position, by weight bucket                    S2  conviction add vs new position
  S3  consecutive accumulation 1 / 2 / 3+ quarters       S4  consensus buyers 1 / 2 / 3–4 / 5–9 / 10+
  S5  early candidates (≤2 holders, ≥1 new buyer)        S6  full exits (all; from a top-10 position)
  S7  collective distribution                            S8  contrarian accumulation (6-m return ≤ −20 %)
  S9  top-5 holdings vs rest                             S11 ownership acceleration (+2 or more holders)
  S12 crowded names (top 2 % breadth)                    S14 accumulation controlling for 12-1 momentum
Output: OUTPUT_DIR/event_study/<signal>.csv, and DERIVED_DIR/events_with_returns.parquet for reuse.
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_core import load_price_panel, load_factors, cusip_to_ticker, forward_returns, summarize, calendar_time_alpha, HORIZONS

OUT = OUTPUT_DIR / "event_study"; OUT.mkdir(parents=True, exist_ok=True)
ALPHA_HOLD = {"3m": 63, "6m": 126, "12m": 252}

def attach_prior_returns(ev: pd.DataFrame, close: pd.DataFrame) -> pd.DataFrame:
    """Trailing 6-month return to the report period end and 12-1 momentum, for S8 and S14 (known at the event)."""
    cal = close.index; arr = close.values; col = pd.Index(close.columns).get_indexer(ev["ticker"])
    pend = np.clip(cal.searchsorted(ev["period"].values, side="right") - 1, 0, len(cal) - 1)
    def ret(back_hi, back_lo):
        a = np.clip(pend - back_hi, 0, None); b = np.clip(pend - back_lo, 0, None)
        return arr[b, col] / arr[a, col] - 1
    ev["ret_6m_prior"] = ret(126, 0)
    ev["mom_12_1"] = ret(252, 21)
    return ev

def run_table(ev: pd.DataFrame, by: list[str] | None, name: str, close, ff, alpha: bool = True) -> pd.DataFrame:
    t = summarize(ev, by)
    if alpha and len(ev):
        rows = []
        groups = ev.groupby(by) if by else [((), ev)]
        for key, g in groups:
            base = dict(zip(by, key if isinstance(key, tuple) else (key,))) if by else {}
            for h, d in ALPHA_HOLD.items():
                if len(g) < 30:
                    continue
                a = calendar_time_alpha(g, close, ff, d)
                rows.append({**base, "horizon": h, "measure": "ff6_alpha", "n": len(g), "mean": a["alpha_ann"], "t_cluster": a["alpha_t"],
                             "beta_mkt": a["beta_mkt"], "beta_mom": a["beta_mom"], "beta_smb": a["beta_smb"], "r2": a["r2"]})
        t = pd.concat([t, pd.DataFrame(rows)], ignore_index=True)
    t.insert(0, "signal", name)
    t.to_csv(OUT / f"{name}.csv", index=False)
    return t

def main(lag_sessions: int = 1) -> None:
    c2t = cusip_to_ticker()
    em = pd.read_parquet(DERIVED_DIR / "events_manager.parquet"); es = pd.read_parquet(DERIVED_DIR / "events_stock.parquet")
    em["ticker"] = em["CUSIP"].map(c2t); es["ticker"] = es["CUSIP"].map(c2t)
    tickers = pd.concat([em["ticker"], es["ticker"]]).dropna().unique().tolist()
    close, open_, dvol = load_price_panel(tickers); ff = load_factors()
    print(f"price panel {close.shape}; events mapped {em.ticker.notna().mean():.1%} manager-rows, {es.ticker.notna().mean():.1%} stock-rows")

    # manager-level events (active discretionary, Universe A, excluding controls)
    q = em[(em["universe_a"] == "1") & ~em["is_control"] & em["ticker"].notna()].copy()
    fr = forward_returns(q, close, lag_sessions=lag_sessions, dvol=dvol); M = attach_prior_returns(fr.table, close)
    M = M[M["entry_price_ok"]]
    M.to_parquet(DERIVED_DIR / "events_manager_returns.parquet", index=False)
    fr.audit.to_csv(OUT / "entry_audit_manager_events.csv", index=False)
    tabs = []
    new = M[M["status"] == "new"]
    tabs.append(run_table(new, ["new_weight_bucket"], "S1_new_position_by_weight", close, ff))
    tabs.append(run_table(M[M["conviction_add"] | ((M["status"] == "new") & (M["weight"] >= 0.01))].assign(kind=lambda d: np.where(d["conviction_add"], "conviction_add", "new_ge1pct")), ["kind"], "S2_conviction_add_vs_new", close, ff))
    acc = M[M["status"].isin(["new", "increased"])].assign(consec=lambda d: pd.cut(d["consecutive_adds"], [0, 1, 2, 3, 99], labels=["1", "2", "3", "4+"]))
    tabs.append(run_table(acc, ["consec"], "S3_consecutive_accumulation", close, ff))
    ex = M[M["status"] == "exited"].assign(kind=lambda d: np.where(d["exit_top10"], "exit_top10", "exit_other"))
    tabs.append(run_table(ex, ["kind"], "S6_exits", close, ff))
    contr = M[M["status"].isin(["new", "increased"]) & M["ret_6m_prior"].notna()].assign(drawdown=lambda d: pd.cut(d["ret_6m_prior"], [-1, -0.4, -0.2, 0, 0.2, 10], labels=["≤−40%", "−40..−20%", "−20..0%", "0..20%", ">20%"]))
    tabs.append(run_table(contr, ["drawdown"], "S8_contrarian_accumulation", close, ff))
    live = M[M["status"] != "exited"].assign(bucket=lambda d: np.where(d["top5"], "top5", "rest"))
    tabs.append(run_table(live, ["bucket"], "S9_top5_vs_rest", close, ff, alpha=False))
    mom = M[M["status"].isin(["new", "increased"]) & M["mom_12_1"].notna()].copy()
    mom["mom_tercile"] = mom.groupby("period")["mom_12_1"].transform(lambda s: pd.qcut(s.rank(method="first"), 3, labels=["low", "mid", "high"]))
    tabs.append(run_table(mom, ["mom_tercile"], "S14_accumulation_by_momentum", close, ff, alpha=False))
    tabs.append(run_table(M[M["status"].isin(["new", "increased"])], ["category"], "S10_by_manager_category", close, ff, alpha=False))

    # stock-level (cross-sectional) events
    s = es[es["ticker"].notna()].copy()
    frs = forward_returns(s, close, lag_sessions=lag_sessions, dvol=dvol); S = attach_prior_returns(frs.table, close)
    S = S[S["entry_price_ok"]]
    S.to_parquet(DERIVED_DIR / "events_stock_returns.parquet", index=False)
    cons = S[S["consensus_buy"] >= 1].assign(buyers=lambda d: pd.cut(d["consensus_buy"], [0, 1, 2, 4, 9, 999], labels=["1", "2", "3–4", "5–9", "10+"]))
    tabs.append(run_table(cons, ["buyers"], "S4_consensus_buyers", close, ff))
    tabs.append(run_table(S[S["early_candidate"]], None, "S5_early_candidates", close, ff))
    tabs.append(run_table(S[S["collective_distribution"]], None, "S7_collective_distribution", close, ff))
    accel = S.assign(accel=lambda d: pd.cut(d["ownership_accel"], [-99, -3, -1, 0, 1, 2, 99], labels=["≤−3", "−2..−1", "0", "+1", "+2", "≥+3"]))
    tabs.append(run_table(accel, ["accel"], "S11_ownership_acceleration", close, ff, alpha=False))
    tabs.append(run_table(S[S["crowded"]], None, "S12_crowded", close, ff))
    allt = pd.concat(tabs, ignore_index=True)
    allt.to_csv(OUT / "all_signals.csv", index=False)
    print(allt[(allt.measure == "xs_spy") & (allt.horizon == "12m")][["signal"] + [c for c in allt.columns if c in ("new_weight_bucket", "kind", "consec", "buyers", "drawdown", "bucket", "accel", "mom_tercile", "category")] + ["n", "mean", "median", "win_rate", "t_cluster", "ci_lo", "ci_hi"]].to_string())

if __name__ == "__main__":
    import sys
    main(lag_sessions=int(sys.argv[1]) if len(sys.argv) > 1 else 1)
