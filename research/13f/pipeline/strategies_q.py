"""
Step 13 — The investable strategies A–J (Part 5.3), quarterly implementation on 13F-implied prices.

Each strategy is a selection rule evaluated at every quarter end E using only filings whose acceptance
timestamp precedes E (so for holdings of quarter t, E is normally t+1's quarter end). Positions are bought at
E's price, equal-weighted unless stated, capped at 10 % per name and N names, with a liquidity proxy
(≥ $200m of total 13F-reported value) and 20 bp per-side costs. Holding periods are expressed in quarters;
a name re-selected at a later rebalance is simply kept.

Parameter choices below were fixed before results were seen (see docs/METHODOLOGY.md §4). The
validation step re-runs each on the training window (entries ≤ 2020-12-31) and the untouched test window
(entries ≥ 2021-03-31), and under cost, lag and universe sensitivities.

A  Consensus accumulation      stocks with the most qualifying buyers this quarter (new + increased), top 30, hold 2q
B  High-conviction new positions new positions ≥ 2 % of a qualifying manager's book, hold 4q, top 30 by weight
C  Follow the best manager     each quarter, the manager with the best trailing-8q copy return (point-in-time); hold its top-20 book for 1q
D  Multi-quarter conviction    positions increased in ≥ 3 consecutive quarters by qualifying managers, hold 2q
E  Emerging ownership          ≤ 3 holders last quarter, ≥ +2 new holders this quarter, hold 4q
F  Contrarian smart money      new/increased positions where the stock fell ≥ 20 % over the prior two quarters, hold 4q
G  Theme rotation              themes ranked by net buyers (initiating + increasing − reducing − exiting) over the last 2 quarters; own the top-3 themes' most-held names, hold 1q
H  Specialist manager signal   a manager's new positions only in FF49 industries where its trailing point-in-time hit rate ≥ 60 % over ≥ 10 events (needs sector_map); hold 4q
I  Ensemble                    z-score sum of A, B, D, E signals per stock; top 30, hold 2q
J  Distribution avoidance      Strategy A's book minus names under collective distribution; compared with A
Passive baseline              every name held by any qualifying manager, value-weighted by their holdings (what "owning what they own" without timing returns)
"""
from __future__ import annotations
import sys
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel, quarterly_factors, simulate_quarterly, metrics_q, factor_alpha_q, entry_period, BENCH_CUSIP

OUT = OUTPUT_DIR / "strategies"; OUT.mkdir(parents=True, exist_ok=True)

def exec_periods(available_ts: pd.Series, periods: pd.DatetimeIndex) -> pd.Series:
    pos = entry_period(available_ts, periods)
    return pd.Series(np.where(pos >= 0, periods[np.clip(pos, 0, len(periods) - 1)], pd.NaT), index=available_ts.index)

def hold(targets_by_entry: dict, hold_q: int, periods: pd.DatetimeIndex) -> dict:
    """Turn {entry period: {cusip: w}} into per-quarter targets where each selection is held hold_q quarters (equal weight across live selections)."""
    live: dict[pd.Timestamp, dict[str, float]] = {}
    for e, book in targets_by_entry.items():
        i = periods.get_loc(e)
        for k in range(hold_q):
            if i + k >= len(periods):
                break
            d = live.setdefault(periods[i + k], {})
            for c, w in book.items():
                d[c] = d.get(c, 0.0) + w
    return live

def build_targets(name: str, em: pd.DataFrame, es: pd.DataFrame, panel: pd.DataFrame, themes_q: pd.DataFrame | None, copy_ret: pd.DataFrame | None, sector_hit: pd.DataFrame | None) -> tuple[dict, int]:
    periods = panel.index
    es = es.copy(); es["E"] = exec_periods(es["available_ts"], periods)
    em = em.copy(); em["E"] = exec_periods(em["available_ts"], periods)
    es = es.dropna(subset=["E"]); em = em.dropna(subset=["E"])
    sel: dict[pd.Timestamp, dict[str, float]] = {}
    if name == "A":
        for E, g in es[es["consensus_buy"] >= 2].groupby("E"):
            top = g.nlargest(30, ["consensus_buy", "n_holders"]); sel[E] = {c: 1.0 for c in top["CUSIP"]}
        return sel, 2
    if name == "B":
        new = em[(em["status"] == "new") & (em["weight"] >= 0.02)]
        for E, g in new.groupby("E"):
            top = g.groupby("CUSIP")["weight"].max().nlargest(30); sel[E] = {c: 1.0 for c in top.index}
        return sel, 4
    if name == "C":
        if copy_ret is None:
            return {}, 1
        cr = copy_ret.dropna(subset=["trailing_8q_copy_return"])
        for E, g in em.groupby("E"):
            per = g["period"].max()
            cand = cr[cr["period"] == per]
            cand = cand[cand["cik"].isin(g["cik"])]
            if cand.empty:
                continue
            best = cand.sort_values("trailing_8q_copy_return", ascending=False).iloc[0]["cik"]
            book = g[(g["cik"] == best) & (g["status"] != "exited")].nlargest(20, "weight")
            if len(book):
                sel[E] = dict(zip(book["CUSIP"], book["weight"]))
        return sel, 1
    if name == "D":
        d = em[(em["status"] == "increased") & (em["consecutive_adds"] >= 3)]
        for E, g in d.groupby("E"):
            top = g.groupby("CUSIP")["consecutive_adds"].max().nlargest(30); sel[E] = {c: 1.0 for c in top.index}
        return sel, 2
    if name == "E":
        e = es[(es["n_holders_prev"] <= 3) & (es["ownership_accel"] >= 2)]
        for E, g in e.groupby("E"):
            top = g.nlargest(30, ["ownership_accel", "n_new"]); sel[E] = {c: 1.0 for c in top["CUSIP"]}
        return sel, 4
    if name == "F":
        f = em[em["status"].isin(["new", "increased"]) & (em["ret_6m_prior"] <= -0.20)]
        for E, g in f.groupby("E"):
            top = g.groupby("CUSIP")["weight"].max().nlargest(30); sel[E] = {c: 1.0 for c in top.index}
        return sel, 4
    if name == "G":
        if themes_q is None:
            return {}, 1
        tq = themes_q.copy(); tq["E"] = exec_periods(tq["available_ts"], periods); tq = tq.dropna(subset=["E"])
        tq["score"] = tq.groupby("theme")["net_buyers"].transform(lambda s: s.rolling(2, min_periods=1).sum())
        memb = pd.read_parquet(DERIVED_DIR / "theme_membership.parquet")
        for E, g in tq.groupby("E"):
            top_themes = g.nlargest(3, "score")["theme"].tolist()
            names = memb[memb["theme"].isin(top_themes)]["cusip"].unique()
            held = es[(es["E"] == E) & es["CUSIP"].isin(names)].nlargest(30, "n_holders")
            if len(held):
                sel[E] = {c: 1.0 for c in held["CUSIP"]}
        return sel, 1
    if name == "H":
        if sector_hit is None:
            return {}, 4
        from bt_core import cusip_to_ticker
        sec = pd.read_parquet(DERIVED_DIR / "sector_map.parquet").set_index("ticker")["ff49"]
        em = em.assign(ff49=em["CUSIP"].map(cusip_to_ticker()).map(sec))
        new = em[(em["status"] == "new") & em["ff49"].notna()].merge(sector_hit, on=["manager_id", "period", "ff49"], how="inner")
        new = new[(new["hit_rate"] >= 0.6) & (new["n_events"] >= 10)]
        for E, g in new.groupby("E"):
            top = g.groupby("CUSIP")["weight"].max().nlargest(30); sel[E] = {c: 1.0 for c in top.index}
        return sel, 4
    if name == "I":
        A = es.groupby(["E", "CUSIP"])["consensus_buy"].max().rename("A")       # late filings can map two report periods to one execution quarter
        B = em[em["status"] == "new"].groupby(["E", "CUSIP"])["weight"].max().rename("B")
        D = em[em["status"] == "increased"].groupby(["E", "CUSIP"])["consecutive_adds"].max().rename("D")
        Ee = es.groupby(["E", "CUSIP"])["ownership_accel"].max().rename("E")
        z = pd.concat([A, B, D, Ee], axis=1).fillna(0)
        z = z.groupby(level=0).transform(lambda s: (s - s.mean()) / (s.std() if s.std() > 0 else 1))
        z["score"] = z.sum(axis=1)
        for E, g in z.groupby(level=0):
            top = g["score"].nlargest(30); sel[E] = {c: 1.0 for (_, c) in top.index}
        return sel, 2
    if name == "J":
        for E, g in es[es["consensus_buy"] >= 2].groupby("E"):
            top = g[~g["collective_distribution"]].nlargest(30, ["consensus_buy", "n_holders"]); sel[E] = {c: 1.0 for c in top["CUSIP"]}
        return sel, 2
    # ---- Part 9 portfolio designs (pre-specified rules; evaluated like the strategies)
    if name == "PA":   # long-term compounders: held ≥ 8 quarters by ≥ 3 managers, at least one of them top-5; ranked by long holders; hold 4q
        lh = em[(em["status"] != "exited") & (em["quarters_held"] >= 8)]
        agg = lh.groupby(["E", "CUSIP"]).agg(n_long=("manager_id", "nunique"), any_top5=("top5", "max"), wsum=("weight", "sum")).reset_index()
        agg = agg[(agg["n_long"] >= 3) & agg["any_top5"]]
        for E, g in agg.groupby("E"):
            top = g.nlargest(30, ["n_long", "wsum"]); sel[E] = {c: 1.0 for c in top["CUSIP"]}
        return sel, 4
    if name == "PB":   # accumulation + momentum: ≥ 3 qualifying buyers and positive 12-1 momentum at the report date; hold 2q
        mom = em.dropna(subset=["mom_12_1"]).groupby(["E", "CUSIP"])["mom_12_1"].first().rename("mom").reset_index()
        e = es.merge(mom, on=["E", "CUSIP"], how="inner")
        e = e[(e["consensus_buy"] >= 3) & (e["mom"] > 0)]
        for E, g in e.groupby("E"):
            top = g.nlargest(30, ["consensus_buy", "mom"]); sel[E] = {c: 1.0 for c in top["CUSIP"]}
        return sel, 2
    if name == "PC":   # thematic: themes in adoption stage 2–3 (early adoption / acceleration); own their most-held names; hold 2q
        tsq = OUTPUT_DIR / "themes" / "theme_stage_quarter.csv"
        if not tsq.exists():
            return {}, 2
        tq = pd.read_csv(tsq, parse_dates=["period", "available_ts"]); tq["E"] = exec_periods(tq["available_ts"], periods); tq = tq.dropna(subset=["E"])
        memb = pd.read_parquet(DERIVED_DIR / "theme_membership.parquet")
        for E, g in tq[tq["stage"].isin([2, 3])].groupby("E"):
            names_ = memb[memb["theme"].isin(g["theme"])]["cusip"].unique()
            held = es[(es["E"] == E) & es["CUSIP"].isin(names_)].nlargest(30, ["n_holders", "consensus_buy"])
            if len(held):
                sel[E] = {c: 1.0 for c in held["CUSIP"]}
        return sel, 2
    if name == "PASSIVE":
        for E, g in es.groupby("E"):
            top = g.nlargest(200, "sum_value"); sel[E] = dict(zip(top["CUSIP"], top["sum_value"]))
        return sel, 1
    raise ValueError(name)

def stock_events_from_manager(em: pd.DataFrame) -> pd.DataFrame:
    """Rebuild the stock-level consensus table from a (possibly filtered) manager-event table — used for the
    'drop the 10 most-followed managers' sensitivity. Mirrors signals.stock_events for the columns the strategies use."""
    q = em.copy(); live = q[q["status"] != "exited"]
    g = q.groupby(["CUSIP", "period"])
    s = pd.DataFrame({
        "available_ts": g["available_ts"].max(),
        "n_holders": live.groupby(["CUSIP", "period"]).size(),
        "n_new": g["status"].apply(lambda x: (x == "new").sum()), "n_increased": g["status"].apply(lambda x: (x == "increased").sum()),
        "n_reduced": g["status"].apply(lambda x: (x == "reduced").sum()), "n_exited": g["status"].apply(lambda x: (x == "exited").sum()),
        "sum_value": live.groupby(["CUSIP", "period"])["value"].sum(),
    }).reset_index()
    s[["n_holders", "sum_value"]] = s[["n_holders", "sum_value"]].fillna(0)
    s = s.sort_values(["CUSIP", "period"]); s["q"] = s["period"].dt.year * 4 + (s["period"].dt.month - 1) // 3
    prev = s[["CUSIP", "q", "n_holders"]].copy(); prev["q"] += 1
    s = s.merge(prev.rename(columns={"n_holders": "n_holders_prev"}), on=["CUSIP", "q"], how="left"); s["n_holders_prev"] = s["n_holders_prev"].fillna(0)
    s["buyers_net"] = s["n_new"] + s["n_increased"] - s["n_reduced"] - s["n_exited"]
    s["consensus_buy"] = s["n_new"] + s["n_increased"]; s["ownership_accel"] = s["n_holders"] - s["n_holders_prev"]
    s["collective_distribution"] = (s["n_reduced"] + s["n_exited"] >= 3) & (s["buyers_net"] <= -2)
    return s

def run(names: list[str], cost_bps: float = 20.0, tag: str = "base", start: str | None = None, end: str | None = None,
        lag_q: int = 0, exclude_top_n: int = 0, exclude_managers: list[str] | None = None, es_override: pd.DataFrame | None = None,
        em_override: pd.DataFrame | None = None) -> pd.DataFrame:
    """Sensitivities: lag_q delays every execution by lag_q quarters; exclude_top_n drops the n largest names by
    13F-held value at each rebalance; exclude_managers drops those manager_ids from the manager events and rebuilds
    the stock-level consensus without them; es_override/em_override substitute other universes' event tables."""
    panel, holders, aggval = load_panel(); ffq = quarterly_factors()
    em = pd.read_parquet(DERIVED_DIR / "events_manager_returns_all.parquet") if em_override is None else em_override
    es = pd.read_parquet(DERIVED_DIR / "events_stock_returns_all.parquet") if es_override is None else es_override
    if exclude_managers:
        em = em[~em["manager_id"].isin(exclude_managers)]
        es = stock_events_from_manager(em)
    themes_q = pd.read_parquet(DERIVED_DIR / "theme_quarter.parquet") if (DERIVED_DIR / "theme_quarter.parquet").exists() else None
    copy_ret = pd.read_parquet(DERIVED_DIR / "copy_returns_all_filers.parquet") if (DERIVED_DIR / "copy_returns_all_filers.parquet").exists() else None
    sector_hit = pd.read_parquet(DERIVED_DIR / "manager_sector_hitrate.parquet") if (DERIVED_DIR / "manager_sector_hitrate.parquet").exists() else None
    bench = {k: panel[c] for k, c in BENCH_CUSIP.items() if c in panel.columns}
    rows = []
    for name in names:
        sel, hq = build_targets(name, em, es, panel, themes_q, copy_ret, sector_hit)
        if not sel:
            rows.append({"strategy": name, "note": "no selections (missing input)"}); continue
        if lag_q:
            idx = panel.index
            sel = {idx[idx.get_loc(E) + lag_q]: b for E, b in sel.items() if idx.get_loc(E) + lag_q < len(idx)}
        if start or end:
            sel = {E: b for E, b in sel.items() if (not start or E >= pd.Timestamp(start)) and (not end or E <= pd.Timestamp(end))}
        targets = hold(sel, hq, panel.index)
        res = simulate_quarterly(targets, panel, aggval, cost_bps=cost_bps, max_weight=0.10, max_names=50 if name != "PASSIVE" else 200, exclude_top_n=exclude_top_n)
        nav = res["nav"]
        if end:
            nav = nav[nav.index <= pd.Timestamp(end) + pd.offsets.QuarterEnd(hq)]
        m = metrics_q(nav, bench["SPY"].reindex(nav.index), ffq["RF"])
        mq = metrics_q(nav, bench["QQQ"].reindex(nav.index)); me = metrics_q(nav, bench["RSP"].reindex(nav.index)) if "RSP" in bench else {}
        fa = factor_alpha_q(nav.pct_change().dropna(), ffq)
        rows.append({"strategy": name, "tag": tag, "hold_q": hq, "start": nav.index[0].date(), "end": nav.index[-1].date(), **m,
                     "excess_cagr_qqq": mq.get("excess_cagr"), "excess_cagr_rsp": me.get("excess_cagr"),
                     "alpha_ann": fa.get("alpha_ann"), "alpha_t": fa.get("alpha_t"), "beta_mkt": fa.get("beta_mkt"), "beta_smb": fa.get("beta_smb"), "beta_hml": fa.get("beta_hml"), "beta_mom": fa.get("beta_mom"),
                     "annual_turnover": res["turnover"].groupby(res["turnover"].index.year).sum().mean(), "avg_names": res["holdings"].groupby("period").size().mean() if len(res["holdings"]) else 0,
                     "cost_drag_ann": res["costs"].groupby(res["costs"].index.year).sum().mean(), "n_rebalances": len(res["turnover"])})
        nav.rename("nav").to_frame().assign(spy=bench["SPY"].reindex(nav.index), qqq=bench["QQQ"].reindex(nav.index)).to_csv(OUT / f"nav_{name}_{tag}.csv")
        res["holdings"].to_parquet(OUT / f"holdings_{name}_{tag}.parquet", index=False)
    t = pd.DataFrame(rows); t.to_csv(OUT / f"summary_{tag}.csv", index=False)
    return t

if __name__ == "__main__":
    names = sys.argv[1].split(",") if len(sys.argv) > 1 else ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "PASSIVE"]
    t = run(names)
    cols = [c for c in ["strategy", "hold_q", "start", "end", "cagr", "bench_cagr", "excess_cagr", "excess_cagr_qqq", "vol", "sharpe", "max_dd", "alpha_ann", "alpha_t", "beta_mkt", "annual_turnover", "avg_names", "note"] if c in t.columns]
    print(t[cols].to_string(index=False, float_format=lambda v: f"{v:.3f}"))
