"""
Step 18 — Event-level attribution and case studies (Part 7).

  attribution/strategy_contributions.csv   per strategy: top-10 / bottom-10 names by cumulative contribution
                                            (weight × next-quarter return), concentration of return in the top 5 % of names,
                                            and contribution by calendar year
  attribution/signal_concentration.csv      per signal: how much of the mean excess return comes from the top 5 % of events,
                                            the share of events that beat SPY, and mean by calendar year of entry
  attribution/cases_*.csv                   data-driven case studies: the most-crowded consensus events and what followed;
                                            the largest-weight new positions and what followed; ownership paths of the
                                            biggest early-discovery successes and failures; manager-level best/worst calls
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel

OUT = OUTPUT_DIR / "attribution"; OUT.mkdir(parents=True, exist_ok=True)
ST = OUTPUT_DIR / "strategies"

def strategy_contributions(panel: pd.DataFrame) -> pd.DataFrame:
    rets = panel.pct_change().shift(-1)   # return over the quarter that follows each rebalance
    issuer = pd.read_parquet(DERIVED_DIR / "events_stock.parquet", columns=["CUSIP", "issuer"]).drop_duplicates("CUSIP").set_index("CUSIP")["issuer"]
    rows = []; years = []
    for f in sorted(ST.glob("holdings_*_base.parquet")):
        name = f.stem.split("_")[1]
        h = pd.read_parquet(f)
        if h.empty:
            continue
        col = pd.Index(panel.columns).get_indexer(h["CUSIP"]); row = pd.Index(panel.index).get_indexer(h["period"])
        h["ret_next_q"] = np.where(col >= 0, rets.values[row, np.clip(col, 0, None)], np.nan)
        h["contrib"] = h["weight"] * h["ret_next_q"].fillna(0)
        byname = h.groupby("CUSIP")["contrib"].sum().sort_values()
        total = byname.sum(); k = max(int(np.ceil(0.05 * len(byname))), 1)
        top_share = byname.nlargest(k).sum() / total if total > 0 else np.nan
        for kind, s in [("top", byname.nlargest(10)), ("bottom", byname.nsmallest(10))]:
            for c, v in s.items():
                rows.append({"strategy": name, "kind": kind, "CUSIP": c, "issuer": issuer.get(c, ""), "cum_contribution": v, "quarters_held": int((h["CUSIP"] == c).sum()),
                             "share_of_total": v / total if total else np.nan, "top5pct_names_share_of_total": top_share, "n_names_ever": len(byname)})
        y = h.groupby(h["period"].dt.year)["contrib"].sum()
        for yr, v in y.items():
            years.append({"strategy": name, "year": yr, "sum_contribution": v, "n_names": h[h["period"].dt.year == yr]["CUSIP"].nunique()})
    pd.DataFrame(years).to_csv(OUT / "strategy_contribution_by_year.csv", index=False)
    t = pd.DataFrame(rows); t.to_csv(OUT / "strategy_contributions.csv", index=False); return t

def signal_concentration() -> pd.DataFrame:
    M = pd.read_parquet(DERIVED_DIR / "events_manager_returns_all.parquet"); S = pd.read_parquet(DERIVED_DIR / "events_stock_returns_all.parquet")
    sets = {
        "S1 new positions (all)": M[M["status"] == "new"], "S1 new positions ≥ 5 %": M[(M["status"] == "new") & (M["weight"] >= 0.05)],
        "S2 conviction adds": M[M["conviction_add"]], "S3 accumulation ≥ 3 consecutive": M[(M["status"] == "increased") & (M["consecutive_adds"] >= 3)],
        "S4 consensus ≥ 5 buyers": S[S["consensus_buy"] >= 5], "S4 consensus ≥ 10 buyers": S[S["consensus_buy"] >= 10],
        "S6 top-10 exits": M[M["exit_top10"]], "S7 collective distribution": S[S["collective_distribution"]],
        "S8 contrarian (≤ −40 % prior 6m)": M[M["status"].isin(["new", "increased"]) & (M["ret_6m_prior"] <= -0.4)],
        "S11 ownership +3 or more": S[S["ownership_accel"] >= 3], "S12 crowded": S[S["crowded"]],
    }
    rows = []
    for name, d in sets.items():
        x = d["xs_12m"].dropna()
        if len(x) < 30:
            continue
        k = max(int(np.ceil(0.05 * len(x))), 1); top = x.nlargest(k)
        mean_ex_top = x.drop(top.index).mean()
        row = {"signal": name, "n": len(x), "mean_xs_12m": x.mean(), "median": x.median(), "win_rate": (x > 0).mean(),
               "mean_without_top5pct": mean_ex_top, "top5pct_events_share_of_sum": top.sum() / x.sum() if x.sum() != 0 else np.nan,
               "p10": x.quantile(0.1), "p90": x.quantile(0.9), "share_below_-50pct": (x < -0.5).mean(), "share_above_+100pct": (x > 1.0).mean()}
        by_year = d.groupby(d["entry_period"].dt.year)["xs_12m"].mean()
        row.update({f"y{yr}": v for yr, v in by_year.items()})
        row["years_positive"] = int((by_year > 0).sum()); row["years_tested"] = int(by_year.notna().sum())
        rows.append(row)
    t = pd.DataFrame(rows); t.to_csv(OUT / "signal_concentration.csv", index=False); return t

def cases(panel: pd.DataFrame) -> None:
    M = pd.read_parquet(DERIVED_DIR / "events_manager_returns_all.parquet"); S = pd.read_parquet(DERIVED_DIR / "events_stock_returns_all.parquet")
    es = pd.read_parquet(DERIVED_DIR / "events_stock.parquet")
    cols = ["issuer", "CUSIP", "period", "entry_period", "n_holders", "consensus_buy", "n_new", "n_increased", "n_reduced", "n_exited", "buyers", "fwd_12m", "spy_12m", "xs_12m", "xs_24m", "xs_36m"]
    S.nlargest(25, "consensus_buy")[cols].to_csv(OUT / "cases_most_crowded_consensus.csv", index=False)
    # the largest-weight new positions (≥ 10 % of a book) and their outcomes
    big = M[(M["status"] == "new") & (M["weight"] >= 0.10)].sort_values("weight", ascending=False)
    big[["manager", "category", "issuer", "CUSIP", "period", "entry_period", "weight", "fwd_12m", "spy_12m", "xs_12m", "xs_24m", "xs_36m", "quarters_held"]].head(40).to_csv(OUT / "cases_largest_new_positions.csv", index=False)
    # early-discovery: names that went from ≤ 2 to ≥ 10 universe holders — ownership path and returns from the first signal
    path = es.sort_values(["CUSIP", "period"])
    first = path[path["early_candidate"]].groupby("CUSIP").first().reset_index()[["CUSIP", "issuer", "period"]].rename(columns={"period": "signal_period"})
    peak = path.groupby("CUSIP")["n_holders"].max().rename("peak_holders")
    first = first.merge(peak, on="CUSIP"); first = first[first["peak_holders"] >= 10]
    ret = S[S["early_candidate"]].drop_duplicates("CUSIP")[["CUSIP", "entry_period", "xs_12m", "xs_24m", "xs_36m"]]
    first = first.merge(ret, on="CUSIP", how="left")
    paths = path[path["CUSIP"].isin(first["CUSIP"])].pivot(index="CUSIP", columns="period", values="n_holders").fillna(0).astype(int)
    paths.columns = [str(c.date()) for c in paths.columns]
    first.merge(paths, left_on="CUSIP", right_index=True).sort_values("peak_holders", ascending=False).to_csv(OUT / "cases_early_discovery_paths.csv", index=False)
    # manager-level best and worst calls (new positions ≥ 2 % weight by 24-month SPY-excess)
    n2 = M[(M["status"] == "new") & (M["weight"] >= 0.02)].dropna(subset=["xs_24m"])
    pd.concat([n2.nlargest(25, "xs_24m").assign(kind="best"), n2.nsmallest(25, "xs_24m").assign(kind="worst")])[
        ["kind", "manager", "category", "issuer", "CUSIP", "period", "weight", "fwd_12m", "xs_12m", "xs_24m", "quarters_held"]].to_csv(OUT / "cases_best_worst_calls.csv", index=False)
    # per-manager hit rate by year of entry: does any manager beat 50 % consistently?
    hr = M[M["status"] == "new"].assign(year=lambda d: d["entry_period"].dt.year).groupby(["manager", "year"])["xs_12m"].agg(hit=lambda s: (s > 0).mean(), n="count").reset_index()
    hr = hr[hr["n"] >= 10].pivot(index="manager", columns="year", values="hit").round(2)
    hr["years_above_50pct"] = (hr > 0.5).sum(axis=1); hr["years_tested"] = hr.notna().sum(axis=1) - 1
    hr.sort_values("years_above_50pct", ascending=False).to_csv(OUT / "cases_manager_hit_rate_by_year.csv")

if __name__ == "__main__":
    panel, holders, aggval = load_panel()
    t = strategy_contributions(panel)
    print(t[t["kind"] == "top"].groupby("strategy")[["top5pct_names_share_of_total", "n_names_ever"]].first())
    c = signal_concentration(); print(c[["signal", "n", "mean_xs_12m", "median", "win_rate", "mean_without_top5pct", "top5pct_events_share_of_sum", "years_positive", "years_tested"]].to_string(index=False, float_format=lambda v: f"{v:.3f}"))
    cases(panel); print("cases written")
