"""
Step 16a — Stock-level consensus events for Universe B (point-in-time managers), used to re-run the consensus
strategies (A, E, J) on a universe that cannot carry hindsight.

For every quarter, the holdings of that quarter's Universe B-static members (docs/UNIVERSE-B.md, ranked by scale)
are compared with the same filer's previous original 13F-HR. Status: new (not held last quarter), increased
(shares ≥ +5 % after split adjustment from splits_13f), reduced (≤ −5 %), exited (held last quarter, not now).
Availability = EDGAR acceptance timestamp when known (filing_acceptance), else the filing date at 23:59 ET
(conservative: acceptance after 17:30 ET is dated the next business day). Output mirrors the Universe A table
(events_stock.parquet) for the columns the strategies use: DERIVED_DIR/events_stock_B.parquet.
"""
from __future__ import annotations
import sys
import numpy as np, pandas as pd
from config import DERIVED_DIR

POS = DERIVED_DIR / "filer_positions"

def main(variant: str = "static") -> None:
    ub = pd.read_parquet(DERIVED_DIR / f"universe_b_{variant}.parquet"); ub["cik"] = ub["cik"].astype(str).str.zfill(10)
    ub = ub[ub["rank"] <= 100]
    acc = pd.read_parquet(DERIVED_DIR / "filing_acceptance.parquet")[["accession", "acceptance_ts_et"]].drop_duplicates("accession")
    splits = pd.read_parquet(DERIVED_DIR / "splits_13f.parquet")
    periods = sorted(pd.Timestamp(f.stem) for f in POS.glob("*.parquet"))
    out = []
    prev_pos = None
    for i, p in enumerate(periods):
        cur = pd.read_parquet(POS / f"{p.date()}.parquet"); cur["cik"] = cur["cik"].astype(str).str.zfill(10)
        members = ub.loc[ub["period"] == p, "cik"]
        if prev_pos is not None and len(members):
            c = cur[cur["cik"].isin(members)].copy()
            c = c.groupby(["cik", "accession", "filing_date", "CUSIP"], as_index=False)[["shares", "value"]].sum()
            pv = prev_pos[prev_pos["cik"].isin(members)].groupby(["cik", "CUSIP"], as_index=False)["shares"].sum().rename(columns={"shares": "shares_prev"})
            sp = splits[(splits["period_from"] == periods[i - 1]) & (splits["period_to"] == p)].set_index("CUSIP")["factor"]
            pv["shares_prev"] = pv["shares_prev"] * pv["CUSIP"].map(sp).fillna(1.0)
            m = c.merge(pv, on=["cik", "CUSIP"], how="outer", indicator=True)
            filed_prev = set(prev_pos["cik"].unique()); filed_now = set(c["cik"].unique())
            m = m[m["cik"].isin(filed_prev & filed_now)]       # status needs both quarters' filings
            ratio = m["shares"] / m["shares_prev"]
            m["status"] = np.select([m["_merge"] == "left_only", m["_merge"] == "right_only", ratio >= 1.05, ratio <= 0.95], ["new", "exited", "increased", "reduced"], default="unchanged")
            # availability: acceptance of the current filing; exits use the current filing too
            fa = c[["cik", "accession", "filing_date"]].drop_duplicates("cik").merge(acc, on="accession", how="left")
            fa["available_ts"] = fa["acceptance_ts_et"].fillna(pd.to_datetime(fa["filing_date"]) + pd.Timedelta(hours=23, minutes=59))
            m = m.merge(fa[["cik", "available_ts"]], on="cik", how="left")
            live = m[m["status"] != "exited"]
            g = m.groupby("CUSIP")
            s = pd.DataFrame({
                "available_ts": g["available_ts"].max(),
                "n_holders": live.groupby("CUSIP").size(),
                "n_new": g["status"].apply(lambda x: (x == "new").sum()), "n_increased": g["status"].apply(lambda x: (x == "increased").sum()),
                "n_reduced": g["status"].apply(lambda x: (x == "reduced").sum()), "n_exited": g["status"].apply(lambda x: (x == "exited").sum()),
                "sum_value": live.groupby("CUSIP")["value"].sum(),
            }).reset_index()
            s["period"] = p; s["n_members"] = len(members); out.append(s)
            print(p.date(), len(members), "members", len(s), "names", flush=True)
        prev_pos = cur[["cik", "CUSIP", "shares"]]
    s = pd.concat(out, ignore_index=True)
    s[["n_holders", "sum_value"]] = s[["n_holders", "sum_value"]].fillna(0)
    s = s.sort_values(["CUSIP", "period"]); s["q"] = s["period"].dt.year * 4 + (s["period"].dt.month - 1) // 3
    prev = s[["CUSIP", "q", "n_holders"]].copy(); prev["q"] += 1
    s = s.merge(prev.rename(columns={"n_holders": "n_holders_prev"}), on=["CUSIP", "q"], how="left"); s["n_holders_prev"] = s["n_holders_prev"].fillna(0)
    s["buyers_net"] = s["n_new"] + s["n_increased"] - s["n_reduced"] - s["n_exited"]
    s["consensus_buy"] = s["n_new"] + s["n_increased"]; s["ownership_accel"] = s["n_holders"] - s["n_holders_prev"]
    s["collective_distribution"] = (s["n_reduced"] + s["n_exited"] >= 3) & (s["buyers_net"] <= -2)
    s.to_parquet(DERIVED_DIR / ("events_stock_B.parquet" if variant == "static" else f"events_stock_B{variant}.parquet"), index=False)
    print(f"{len(s):,} stock-quarters; consensus ≥5: {(s.consensus_buy >= 5).sum():,}")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "static")
