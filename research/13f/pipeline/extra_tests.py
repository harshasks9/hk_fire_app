"""
Step 16b — The remaining pre-specified tests and sensitivities (Part 5.5 / 5.6):

  S13 divergence     stock-quarters where managers ranked skilled (point-in-time signal score, top tercile as of the
                     quarter) are buying while the unskilled are selling, and the reverse; plus manager new positions
                     by point-in-time skill tercile (does past 13F signal skill persist?).
  S15 style change   new positions made in manager-quarters whose activity is ≥ 2σ above the manager's own trailing
                     8-quarter norm (n_new_z or weight_turnover_z), vs normal quarters; and the manager's copy return
                     over the following 4 quarters after such a quarter.
  Strategy sensitivities  lag +1 quarter; exclude the 50 largest names by 13F-held value at each rebalance; drop the
                     10 largest (most-followed) Universe A managers; consensus strategies on Universe B (point-in-time).
Outputs: OUTPUT_DIR/event_study/S13_*.csv, S15_*.csv; OUTPUT_DIR/validation/strategy_sensitivities_extra.csv
"""
from __future__ import annotations
import sys
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel, quarterly_factors, forward_returns, covered, summarize
from event_study_q import run_table

OUT = OUTPUT_DIR / "validation"; OUT.mkdir(parents=True, exist_ok=True)

def skill_tests(panel, ffq) -> list[pd.DataFrame]:
    M = pd.read_parquet(DERIVED_DIR / "events_manager_returns_all.parquet")
    S = pd.read_parquet(DERIVED_DIR / "events_stock_returns_all.parquet")
    pit = pd.read_parquet(OUTPUT_DIR / "scorecard" / "manager_scorecard_pit.parquet")
    # skill known as of each report period: latest as_of ≤ period (as_of = entry + 4q, so outcomes are realised)
    pit = pit.sort_values("as_of")
    pit["tercile"] = pit.groupby("as_of")["score_pit"].transform(lambda s: pd.qcut(s.rank(method="first"), 3, labels=["low", "mid", "high"]) if len(s) >= 6 else pd.Series(index=s.index, dtype="object"))
    M = M.sort_values("period")
    Mk = pd.merge_asof(M, pit[["manager_id", "as_of", "score_pit", "tercile"]].rename(columns={"as_of": "period"}).sort_values("period"), on="period", by="manager_id", direction="backward")
    Mk = Mk[Mk["tercile"].notna()]
    tabs = []
    tabs.append(run_table(Mk[Mk["status"] == "new"].assign(skill=lambda d: d["tercile"].astype(str)), ["skill"], "S13_new_positions_by_pit_skill", panel, ffq))
    tabs.append(run_table(Mk[Mk["conviction_add"]].assign(skill=lambda d: d["tercile"].astype(str)), ["skill"], "S13_conviction_adds_by_pit_skill", panel, ffq, alpha=False))
    # stock-level divergence
    buy = Mk[Mk["status"].isin(["new", "increased"])]; sell = Mk[Mk["status"].isin(["reduced", "exited"])]
    k = pd.DataFrame({
        "skilled_buy": buy[buy["tercile"] == "high"].groupby(["CUSIP", "period"]).size(),
        "unskilled_buy": buy[buy["tercile"] == "low"].groupby(["CUSIP", "period"]).size(),
        "skilled_sell": sell[sell["tercile"] == "high"].groupby(["CUSIP", "period"]).size(),
        "unskilled_sell": sell[sell["tercile"] == "low"].groupby(["CUSIP", "period"]).size(),
    }).fillna(0).reset_index()
    Sk = S.merge(k, on=["CUSIP", "period"], how="inner")
    Sk["divergence"] = np.select(
        [(Sk["skilled_buy"] >= 1) & (Sk["unskilled_sell"] >= 1) & (Sk["skilled_sell"] == 0),
         (Sk["unskilled_buy"] >= 1) & (Sk["skilled_sell"] >= 1) & (Sk["skilled_buy"] == 0),
         (Sk["skilled_buy"] >= 1) & (Sk["skilled_sell"] == 0),
         (Sk["skilled_sell"] >= 1) & (Sk["skilled_buy"] == 0)],
        ["skilled_buy_unskilled_sell", "unskilled_buy_skilled_sell", "skilled_buy_only", "skilled_sell_only"], default="other")
    tabs.append(run_table(Sk[Sk["divergence"] != "other"], ["divergence"], "S13_divergence", panel, ffq))
    # S15 style change
    M["style_change"] = np.select([(M["n_new_z"] >= 2) | (M["weight_turnover_z"] >= 2), (M["n_new_z"] <= -2) | (M["weight_turnover_z"] <= -2)], ["hyperactive_q", "quiet_q"], default="normal")
    tabs.append(run_table(M[M["status"] == "new"], ["style_change"], "S15_new_positions_by_style_change", panel, ffq, alpha=False))
    # manager copy return over the next 4 quarters after a hyperactive quarter vs the manager's other quarters
    cr = pd.read_parquet(DERIVED_DIR / "copy_returns_all_filers.parquet")
    uni = pd.read_csv(OUTPUT_DIR.parent / "data" / "universe.csv", dtype=str)[["cik", "manager_id"]]
    cr = cr.merge(uni, on="cik").sort_values(["manager_id", "period"])
    cr["fwd4_copy"] = cr.groupby("manager_id")["copy_ret_q"].transform(lambda s: (1 + s).rolling(4).apply(np.prod, raw=True).shift(-3) - 1)
    spy = panel["78462F103"]; spy4 = (spy.shift(-4) / spy - 1)
    cr["fwd4_spy"] = cr["period"].map(spy4); cr["fwd4_xs"] = cr["fwd4_copy"] - cr["fwd4_spy"]
    mq = M.drop_duplicates(["manager_id", "period"])[["manager_id", "period", "style_change"]]
    cq = cr.merge(mq, on=["manager_id", "period"], how="inner").dropna(subset=["fwd4_xs"])
    from bt_quarterly import cluster_tstat
    rows = []
    for sc, g in cq.groupby("style_change"):
        _m, t, _n = cluster_tstat(g["fwd4_xs"], g["period"])
        rows.append({"signal": "S15_manager_copy_return_after_style_change", "style_change": sc, "horizon": "12m", "measure": "copy_xs_spy_next4q", "n": len(g), "n_periods": g["period"].nunique(), "mean": g["fwd4_xs"].mean(), "median": g["fwd4_xs"].median(), "win_rate": (g["fwd4_xs"] > 0).mean(), "t_cluster": t})
    t15 = pd.DataFrame(rows); t15.to_csv(OUTPUT_DIR / "event_study" / "S15_manager_copy_return_after_style_change_all.csv", index=False); tabs.append(t15)
    return tabs

def sector_tests(panel, ffq) -> list[pd.DataFrame]:
    """S10b specialist-industry test and industry-relative (FF49) excess returns; needs sector_map + manager_sector_hitrate."""
    from bt_core import cusip_to_ticker
    from config import FACTORS_DIR
    sec = pd.read_parquet(DERIVED_DIR / "sector_map.parquet").set_index("ticker")
    c2t = cusip_to_ticker()
    M = pd.read_parquet(DERIVED_DIR / "events_manager_returns_all.parquet"); S = pd.read_parquet(DERIVED_DIR / "events_stock_returns_all.parquet")
    for d in (M, S):
        d["ff49"] = d["CUSIP"].map(c2t).map(sec["ff49"]); d["ff49_name"] = d["CUSIP"].map(c2t).map(sec["ff49_name"])
    # industry-relative returns: quarterly compounded FF49 industry returns, 4-quarter forward from entry
    ind = pd.read_parquet(FACTORS_DIR / "ind49_daily.parquet").set_index("date")   # already decimal (factors.py converts)
    indq = (1 + ind).groupby(ind.index.to_period("Q")).prod() - 1; indq.index = indq.index.to_timestamp(how="end").normalize()
    names = {i + 1: c for i, c in enumerate(indq.columns)}   # FF49 numbering is 1..49 in the daily file's column order
    ind4 = (1 + indq).rolling(4).apply(np.prod, raw=True).shift(-4) - 1    # return over the 4 quarters after the index date
    for d in (M, S):
        col = d["ff49"].map(names); ok = col.notna() & d["entry_period"].isin(ind4.index)
        d["ind_12m"] = np.nan
        d.loc[ok, "ind_12m"] = ind4.reindex(d.loc[ok, "entry_period"]).values[np.arange(ok.sum()), pd.Index(indq.columns).get_indexer(col[ok])]
        d["xi_12m"] = d["fwd_12m"] - d["ind_12m"]
    tabs = []
    hr = pd.read_parquet(DERIVED_DIR / "manager_sector_hitrate.parquet")
    Mn = M[(M["status"] == "new")].merge(hr.rename(columns={"period": "period"}), on=["manager_id", "period", "ff49"], how="left")
    Mn["specialist"] = np.select([Mn["ff49"].isna(), (Mn["hit_rate"] >= 0.6) & (Mn["n_events"] >= 10), Mn["n_events"] >= 10], ["unmapped", "specialist_industry", "non_specialist_industry"], default="insufficient_history")
    tabs.append(run_table(Mn, ["specialist"], "S10b_new_positions_by_industry_specialisation", panel, ffq, alpha=False))
    # sector specialists in their own sector vs outside (category-level)
    sp = M[(M["category"] == "Sector specialist") & (M["status"] == "new") & M["ff49_name"].notna()]
    home = sp.groupby("manager_id")["ff49_name"].agg(lambda x: x.value_counts().index[0])
    sp = sp.assign(home_sector=lambda d: np.where(d["ff49_name"] == d["manager_id"].map(home), "home_sector", "outside"))
    tabs.append(run_table(sp, ["home_sector"], "S10b_sector_specialists_home_vs_outside", panel, ffq, alpha=False))
    # industry-relative view of the headline signals
    rows = []
    from bt_quarterly import cluster_tstat
    sets = {"S1 new positions": M[M["status"] == "new"], "S1 new ≥ 5 %": M[(M["status"] == "new") & (M["weight"] >= 0.05)], "S2 conviction adds": M[M["conviction_add"]],
            "S4 consensus 10+": S[S["consensus_buy"] >= 10], "S4 consensus 5–9": S[S["consensus_buy"].between(5, 9)], "S7 collective distribution": S[S["collective_distribution"]],
            "S8 contrarian ≤ −40 %": M[M["status"].isin(["new", "increased"]) & (M["ret_6m_prior"] <= -0.4)], "S6 top-10 exits": M[M["exit_top10"]]}
    for k, d in sets.items():
        d = d.dropna(subset=["xi_12m"])
        if len(d) < 30:
            continue
        _m, t, n = cluster_tstat(d["xi_12m"], d["entry_period"])
        rows.append({"signal": k, "measure": "xs_ff49_industry", "horizon": "12m", "n": len(d), "n_periods": n, "mean": d["xi_12m"].mean(), "median": d["xi_12m"].median(), "win_rate": (d["xi_12m"] > 0).mean(), "t_cluster": t,
                     "mean_xs_spy_same_events": d["xs_12m"].mean(), "mapped_share": len(d) / len(sets[k])})
    ti = pd.DataFrame(rows); ti.to_csv(OUTPUT_DIR / "event_study" / "industry_relative_all.csv", index=False); tabs.append(ti)
    return tabs

def strategy_extra() -> pd.DataFrame:
    from strategies_q import run
    names = ["A", "B", "D", "E", "F", "I", "J"]
    tabs = [run(names, tag="lag1", lag_q=1), run(names, tag="exTop50", exclude_top_n=50)]
    sc = pd.read_csv(OUTPUT_DIR / "scorecard" / "manager_scorecard.csv")
    beh = pd.read_parquet(DERIVED_DIR / "manager_summary.parquet")
    qual = sc[(sc["universe_a"].astype(str) == "1") & ~sc["category"].isin(["Broad institutional and passive", "Quantitative and systematic"])]["manager_id"]
    big = beh[beh["manager_id"].isin(qual)].nlargest(10, "latest_value")["manager_id"].tolist()   # the most-followed = the largest qualifying (non-control) managers
    print("dropping the 10 largest qualifying Universe A managers:", big)
    tabs.append(run(names, tag="exTop10Mgrs", exclude_managers=big))
    if (DERIVED_DIR / "events_stock_B.parquet").exists():
        esb = pd.read_parquet(DERIVED_DIR / "events_stock_B.parquet")
        tabs.append(run(["A", "E", "J"], tag="universeB", es_override=esb))
    if (DERIVED_DIR / "events_stock_Bperf.parquet").exists():   # the performance-chasing variant (top 100 by trailing copy return)
        tabs.append(run(["A", "E", "J"], tag="universeBperf", es_override=pd.read_parquet(DERIVED_DIR / "events_stock_Bperf.parquet")))
    t = pd.concat(tabs, ignore_index=True); t.to_csv(OUT / "strategy_sensitivities_extra.csv", index=False)
    return t

if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "all"
    if what in ("events", "all"):
        panel, holders, aggval = load_panel(); ffq = quarterly_factors()
        tabs = skill_tests(panel, ffq)
        allt = pd.concat(tabs, ignore_index=True); allt.to_csv(OUTPUT_DIR / "event_study" / "S13_S15_all.csv", index=False)
        v = allt[(allt["measure"].isin(["xs_spy", "copy_xs_spy_next4q"])) & (allt["horizon"] == "12m")]
        keys = [c for c in ["skill", "divergence", "style_change"] if c in v.columns]
        print(v[["signal"] + keys + ["n", "n_periods", "mean", "median", "win_rate", "t_cluster"]].to_string(index=False, float_format=lambda x: f"{x:.3f}"))
    if what == "sectors":
        panel, holders, aggval = load_panel(); ffq = quarterly_factors()
        for t in sector_tests(panel, ffq):
            v = t[(t["horizon"] == "12m") & t["measure"].isin(["xs_spy", "xs_ff49_industry"])]
            keys = [c for c in ["specialist", "home_sector"] if c in v.columns]
            print(v[["signal"] + keys + ["measure", "n", "n_periods", "mean", "median", "win_rate", "t_cluster"]].to_string(index=False, float_format=lambda x: f"{x:.3f}"))
    if what in ("strategies", "all"):
        t = strategy_extra()
        print(t[["strategy", "tag", "cagr", "excess_cagr", "sharpe", "max_dd", "alpha_ann", "alpha_t", "annual_turnover"]].to_string(index=False, float_format=lambda x: f"{x:.3f}"))
