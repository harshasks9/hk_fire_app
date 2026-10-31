"""
Step 14 — Manager skill and 13F signal-quality scorecards (Part 6), point-in-time.

Two rankings, kept separate:
  Investor Quality Score — the manager's observable record: trailing copy-portfolio return (value-weighted
    disclosed book, held one quarter from availability), its consistency (share of quarters beating SPY),
    FF6 alpha of the copy series, concentration and turnover.
  13F Signal Quality Score — what a follower earned from the manager's *decisions*: SPY-excess 12-month
    return after new positions, after conviction adds, and the (negative of the) excess return after exits,
    each shrunk toward the cross-manager mean by sample size (James-Stein style: w = n / (n + 40)).
Both are computed with an expanding window so that score(t) uses only entries whose 12-month outcome was
known at t; the "current" scorecard is the final row. Specialisation by FF49 industry (S10) is computed where
the sector map exists.
Outputs: OUTPUT_DIR/scorecard/manager_scorecard.csv, manager_scorecard_pit.parquet, manager_sector_hitrate.parquet
"""
from __future__ import annotations
from pathlib import Path
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel, quarterly_factors, factor_alpha_q

OUT = OUTPUT_DIR / "scorecard"; OUT.mkdir(parents=True, exist_ok=True)
SHRINK_N = 40

def shrink(mean: pd.Series, n: pd.Series, prior: float) -> pd.Series:
    w = n / (n + SHRINK_N)
    return w * mean + (1 - w) * prior

def main() -> None:
    universe = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "universe.csv", dtype=str)
    M = pd.read_parquet(DERIVED_DIR / "events_manager_returns_all.parquet")
    panel, holders, aggval = load_panel(); ffq = quarterly_factors()
    cr = pd.read_parquet(DERIVED_DIR / "copy_returns_all_filers.parquet")
    cr = cr.merge(universe[["cik", "manager_id", "manager", "category"]], on="cik")
    spy = panel["78462F103"].pct_change()
    cr["spy_q"] = cr["ret_period"].map(spy)
    # ---- Investor quality
    iq = cr.groupby("manager_id").apply(lambda d: pd.Series({
        "quarters": len(d), "copy_cagr": (1 + d["copy_ret_q"]).prod() ** (4 / max(len(d), 1)) - 1,
        "spy_cagr_same_quarters": (1 + d["spy_q"]).prod() ** (4 / max(len(d), 1)) - 1,
        "hit_rate_vs_spy": (d["copy_ret_q"] > d["spy_q"]).mean(),
        "copy_vol": d["copy_ret_q"].std() * 2,
        "max_dd": ((1 + d["copy_ret_q"]).cumprod() / (1 + d["copy_ret_q"]).cumprod().cummax() - 1).min(),
    })).reset_index()
    alphas = []
    for mid, d in cr.groupby("manager_id"):
        s = d.set_index("ret_period")["copy_ret_q"].sort_index()
        a = factor_alpha_q(s, ffq); alphas.append({"manager_id": mid, "copy_alpha_ann": a.get("alpha_ann"), "copy_alpha_t": a.get("alpha_t"), "copy_beta": a.get("beta_mkt")})
    iq = iq.merge(pd.DataFrame(alphas), on="manager_id")
    # ---- Signal quality (12m SPY-excess after decisions), shrunk
    def dec(mask, col="xs_12m"):
        g = M[mask].groupby("manager_id")[col]
        return pd.DataFrame({"mean": g.mean(), "n": g.count(), "median": g.median(), "win": g.apply(lambda s: (s > 0).mean())})
    new = dec(M["status"] == "new"); conv = dec(M["conviction_add"]); exits = dec(M["status"] == "exited"); inc = dec(M["status"] == "increased")
    prior_new, prior_conv, prior_exit = new["mean"].mean(), conv["mean"].mean(), exits["mean"].mean()
    sq = pd.DataFrame({
        "new_xs12m": new["mean"], "new_n": new["n"], "new_win": new["win"], "new_xs12m_shrunk": shrink(new["mean"], new["n"], prior_new),
        "conv_xs12m": conv["mean"], "conv_n": conv["n"], "conv_xs12m_shrunk": shrink(conv["mean"], conv["n"], prior_conv),
        "inc_xs12m": inc["mean"], "inc_n": inc["n"],
        "exit_xs12m": exits["mean"], "exit_n": exits["n"], "exit_signal_shrunk": -shrink(exits["mean"], exits["n"], prior_exit),
    })
    sq["signal_quality_score"] = sq[["new_xs12m_shrunk", "conv_xs12m_shrunk", "exit_signal_shrunk"]].mean(axis=1)
    # regime reliability: positive new-position excess in each of the regimes (needs ≥ 10 events per regime)
    reg = M[M["status"] == "new"].assign(regime=lambda d: pd.cut(d["entry_period"], [pd.Timestamp("2013-01-01"), pd.Timestamp("2019-12-31"), pd.Timestamp("2020-12-31"), pd.Timestamp("2022-12-31"), pd.Timestamp("2030-01-01")], labels=["2013-19", "2020", "2021-22", "2023-26"]))
    rg = reg.groupby(["manager_id", "regime"], observed=True)["xs_12m"].agg(["mean", "count"]).reset_index()
    rg = rg[rg["count"] >= 10]
    sq["regimes_positive"] = rg[rg["mean"] > 0].groupby("manager_id").size().reindex(sq.index).fillna(0)
    sq["regimes_tested"] = rg.groupby("manager_id").size().reindex(sq.index).fillna(0)
    beh = pd.read_parquet(DERIVED_DIR / "manager_summary.parquet").set_index("manager_id")
    sc = universe.drop_duplicates("manager_id").set_index("manager_id")[["manager", "category", "universe_a", "defunct_control"]]
    sc = sc.join(iq.set_index("manager_id")).join(sq).join(beh[["avg_positions", "avg_top10", "avg_weight_turnover", "median_hold_q", "entry_weight_median"]])
    sc["investor_quality_score"] = sc[["copy_alpha_ann"]].rank(pct=True).mean(axis=1) * 0.5 + sc["hit_rate_vs_spy"].rank(pct=True) * 0.25 + (-sc["max_dd"]).rank(pct=True) * 0.25
    sc = sc.sort_values("signal_quality_score", ascending=False)
    sc.reset_index().to_csv(OUT / "manager_scorecard.csv", index=False)
    # ---- point-in-time signal score (expanding, outcomes known at t = entry_period + 4 quarters)
    N = M[M["status"] == "new"].copy(); N["known_at"] = N["entry_period"] + pd.offsets.QuarterEnd(4)
    rows = []
    for t in sorted(N["known_at"].unique()):
        k = N[N["known_at"] <= t].groupby("manager_id")["xs_12m"].agg(["mean", "count"])
        k["score_pit"] = shrink(k["mean"], k["count"], k["mean"].mean()); k["as_of"] = t
        rows.append(k.reset_index())
    pit = pd.concat(rows, ignore_index=True); pit.to_parquet(OUT / "manager_scorecard_pit.parquet", index=False)
    # ---- sector specialisation (if sector map exists)
    sm = DERIVED_DIR / "sector_map.parquet"
    if sm.exists():
        from bt_core import cusip_to_ticker
        c2t = cusip_to_ticker(); sec = pd.read_parquet(sm).set_index("ticker")["ff49"]
        N["ff49"] = N["CUSIP"].map(c2t).map(sec)
        hr = []
        for t in sorted(N["known_at"].unique()):
            k = N[(N["known_at"] <= t) & N["ff49"].notna()].groupby(["manager_id", "ff49"])["xs_12m"].agg(hit_rate=lambda s: (s > 0).mean(), n_events="count", mean="mean")
            k["period"] = t; hr.append(k.reset_index())
        pd.concat(hr, ignore_index=True).to_parquet(DERIVED_DIR / "manager_sector_hitrate.parquet", index=False)
    print(sc[["manager", "category", "copy_cagr", "spy_cagr_same_quarters", "copy_alpha_ann", "copy_alpha_t", "new_xs12m", "new_n", "new_xs12m_shrunk", "conv_xs12m_shrunk", "exit_signal_shrunk", "signal_quality_score"]].head(25).to_string(float_format=lambda v: f"{v:.3f}"))

if __name__ == "__main__":
    main()
