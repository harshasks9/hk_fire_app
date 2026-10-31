"""
Step 16 — The current intelligence report inputs (Part 8), from the latest COMPLETE quarter.

The latest complete cross-manager quarter is the last period for which ≥ 90 % of Universe A's active managers
have filed; filings received for a later period are reported separately as "early filings" and never mixed
into cross-manager comparisons.
Outputs (OUTPUT_DIR/current/): top20_accumulation.csv, top20_distribution.csv, disagreements.csv,
early_filings.csv, plus the per-stock evidence (managers buying/selling, weights, historical calibration).
"""
from __future__ import annotations
from pathlib import Path
import numpy as np, pandas as pd
from config import DERIVED_DIR, OUTPUT_DIR
from bt_quarterly import load_panel, BENCH_CUSIP

OUT = OUTPUT_DIR / "current"; OUT.mkdir(parents=True, exist_ok=True)

def main() -> None:
    universe = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "universe.csv", dtype=str)
    em = pd.read_parquet(DERIVED_DIR / "events_manager.parquet"); es = pd.read_parquet(DERIVED_DIR / "events_stock.parquet")
    q = em[(em["universe_a"] == "1") & ~em["is_control"]]
    active = q.groupby("manager_id")["period"].max()
    active_mgrs = active[active >= active.max() - pd.offsets.QuarterEnd(2)].index   # managers still filing within the last two quarters
    filed = q[q["manager_id"].isin(active_mgrs)].groupby("period")["manager_id"].nunique()
    complete = filed[filed >= 0.9 * len(active_mgrs)].index.max()
    latest = filed.index.max()
    print(f"latest complete quarter {complete.date()} ({filed[complete]}/{len(active_mgrs)} active managers filed); early filings for {latest.date()}: {filed[latest] if latest != complete else 0}")
    panel, holders, aggval = load_panel()
    px = panel.iloc[-1]; px_4q = panel.iloc[-5] if len(panel) > 5 else panel.iloc[0]; px_1q = panel.iloc[-2]
    # historical calibration per signal bucket (from the event study on the full sample)
    es_ret = pd.read_parquet(DERIVED_DIR / "events_stock_returns_all.parquet")
    es_ret["buyers"] = pd.cut(es_ret["consensus_buy"], [0, 1, 2, 4, 9, 999], labels=["1", "2", "3–4", "5–9", "10+"])
    calib = es_ret.groupby("buyers", observed=True)[["xs_3m", "xs_6m", "xs_12m"]].agg(["mean", "median", "count"])
    calib.columns = ["_".join(c) for c in calib.columns]; calib.to_csv(OUT / "calibration_consensus.csv")
    sc = pd.read_csv(OUTPUT_DIR / "scorecard" / "manager_scorecard.csv").set_index("manager_id")
    names = universe.drop_duplicates("manager_id").set_index("manager_id")["manager"]
    cur = es[es["period"] == complete].copy()
    cur["buyers_bucket"] = pd.cut(cur["consensus_buy"], [0, 1, 2, 4, 9, 999], labels=["1", "2", "3–4", "5–9", "10+"])
    cur["price"] = cur["CUSIP"].map(px); cur["ret_1q"] = cur["CUSIP"].map(px / px_1q - 1); cur["ret_4q"] = cur["CUSIP"].map(px / px_4q - 1)
    cur["agg_value_all_filers"] = cur["CUSIP"].map(aggval.iloc[-1])
    def mgr_list(ids: str, status_filter=None) -> str:
        out = []
        for m in ids.split(";") if ids else []:
            s = sc["signal_quality_score"].get(m, np.nan)
            out.append(f"{names.get(m, m)}" + (f" ({s:+.2f})" if pd.notna(s) else ""))
        return "; ".join(out)
    # skill-weighted buyer score: sum over buyers of (shrunk new-position signal quality), using the point-in-time scorecard
    sqs = sc["signal_quality_score"].to_dict()
    cur["skill_weighted_buyers"] = cur["buyers"].fillna("").apply(lambda s: sum(sqs.get(m, 0) for m in s.split(";") if m))
    cur["skill_weighted_sellers"] = cur["sellers"].fillna("").apply(lambda s: sum(sqs.get(m, 0) for m in s.split(";") if m))
    cur["composite"] = cur["consensus_buy"].rank(pct=True) + cur["n_conviction_add"].rank(pct=True) + cur["ownership_accel"].rank(pct=True) + cur["skill_weighted_buyers"].rank(pct=True)
    memb = pd.read_parquet(DERIVED_DIR / "theme_membership.parquet").groupby("cusip")["theme"].agg(lambda s: ";".join(sorted(s)))
    cur["themes"] = cur["CUSIP"].map(memb)
    top = cur[cur["consensus_buy"] >= 3].sort_values("composite", ascending=False).head(20).copy()
    top["managers_buying"] = top["buyers"].apply(mgr_list)
    top["calib_12m_mean_xs"] = top["buyers_bucket"].map(calib["xs_12m_mean"]); top["calib_12m_median_xs"] = top["buyers_bucket"].map(calib["xs_12m_median"]); top["calib_n"] = top["buyers_bucket"].map(calib["xs_12m_count"])
    top[["CUSIP", "issuer", "themes", "n_holders", "n_new", "n_increased", "n_conviction_add", "n_reduced", "n_exited", "ownership_accel", "sum_weight", "skill_weighted_buyers", "composite", "price", "ret_1q", "ret_4q", "agg_value_all_filers", "managers_buying", "calib_12m_mean_xs", "calib_12m_median_xs", "calib_n", "available_ts"]].to_csv(OUT / "top20_accumulation.csv", index=False)
    dist = cur[(cur["n_reduced"] + cur["n_exited"] >= 3)].copy()
    dist["composite_dist"] = (dist["n_reduced"] + dist["n_exited"]).rank(pct=True) + (-dist["buyers_net"]).rank(pct=True) + dist["n_big_cut"].rank(pct=True) + dist["skill_weighted_sellers"].rank(pct=True)
    dist = dist.sort_values("composite_dist", ascending=False).head(20).copy()
    dist["managers_selling"] = dist["sellers"].apply(mgr_list)
    dist["kind"] = np.select([dist["ret_4q"] > 0.5, dist["n_exited"] >= 3, dist["ownership_accel"] <= -3], ["profit-taking after large gain", "broad exits", "breadth falling"], default="reductions")
    dist[["CUSIP", "issuer", "themes", "n_holders", "n_holders_prev", "n_reduced", "n_exited", "n_big_cut", "n_new", "n_increased", "buyers_net", "price", "ret_1q", "ret_4q", "kind", "managers_selling", "available_ts"]].to_csv(OUT / "top20_distribution.csv", index=False)
    dis = cur[(cur["n_new"] + cur["n_increased"] >= 2) & (cur["n_reduced"] + cur["n_exited"] >= 2)].copy()
    dis["disagreement"] = np.minimum(dis["n_new"] + dis["n_increased"], dis["n_reduced"] + dis["n_exited"])
    dis = dis.sort_values(["disagreement", "n_holders"], ascending=False).head(20)
    dis["buyers_named"] = dis["buyers"].apply(mgr_list); dis["sellers_named"] = dis["sellers"].apply(mgr_list)
    dis[["CUSIP", "issuer", "themes", "n_holders", "n_new", "n_increased", "n_reduced", "n_exited", "skill_weighted_buyers", "skill_weighted_sellers", "price", "ret_4q", "buyers_named", "sellers_named"]].to_csv(OUT / "disagreements.csv", index=False)
    if latest != complete:
        early = es[es["period"] == latest].sort_values("consensus_buy", ascending=False).head(30)
        early.assign(managers_buying=early["buyers"].apply(mgr_list))[["CUSIP", "issuer", "n_holders", "n_new", "n_increased", "n_reduced", "n_exited", "managers_buying"]].to_csv(OUT / "early_filings.csv", index=False)
    pd.Series({"latest_complete_quarter": str(complete.date()), "latest_period_with_filings": str(latest.date()), "active_managers": len(active_mgrs), "filed_complete": int(filed[complete]), "filed_latest": int(filed[latest])}).to_csv(OUT / "status.csv")
    print(top[["issuer", "themes", "n_holders", "n_new", "n_increased", "ownership_accel", "skill_weighted_buyers", "ret_4q", "managers_buying"]].head(20).to_string(index=False))

if __name__ == "__main__":
    main()
