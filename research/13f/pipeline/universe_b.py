"""
Step 10 — Universe B: the point-in-time manager universe (docs/UNIVERSE-B.md).

Inputs: filer_summary.parquet (every original 13F-HR of every filer), coverpages (names, other-manager
counts), and — for the performance-ranked variant — copy-portfolio returns computed from prices.
Outputs: DERIVED_DIR/universe_b_static.parquet  (period, cik, rank) — rules 1–5, ranked by scale
         DERIVED_DIR/universe_b_perf.parquet    (period, cik, rank) — rules 1–5, ranked by trailing copy return
"""
from __future__ import annotations
import duckdb, numpy as np, pandas as pd
from config import DERIVED_DIR, SEC_DB

BANK_PAT = r"\b(BANK|TRUST CO|TRUST COMPANY|N\.A\.|NATIONAL ASSOCIATION|BANCORP|SAVINGS)\b"

def eligibility(fs: pd.DataFrame, names: pd.DataFrame) -> pd.DataFrame:
    fs = fs.merge(names, on="cik", how="left").sort_values(["cik", "period"])
    fs["q"] = fs["period"].dt.year * 4 + (fs["period"].dt.month - 1) // 3
    g = fs.groupby("cik")
    # consecutive history: count of consecutive prior quarters filed
    fs["consec"] = g["q"].transform(lambda s: s.diff().ne(1).cumsum())
    fs["history_q"] = fs.groupby(["cik", "consec"]).cumcount()
    fs["active4"] = g.apply(lambda d: ((d["n_new"].fillna(0) + d["n_exit"].fillna(0)) > 0).rolling(4, min_periods=4).min()).reset_index(level=0, drop=True)
    fs["prev_value"] = g["long_value"].shift(1)
    fs["eligible"] = (
        (fs["history_q"] >= 8)
        & fs["prev_value"].between(5e8, 1.5e11)
        & (fs["top10_weight"] >= 0.35) & fs["n_positions"].between(8, 250)
        & (fs["active4"] == 1)
        & (fs["other_managers"].fillna(0) < 10)
        & ~fs["manager_name"].fillna("").str.upper().str.contains(BANK_PAT, regex=True)
    )
    return fs

def main() -> None:
    con = duckdb.connect(str(SEC_DB), read_only=True)
    names = con.execute("""
        SELECT cik, max(manager_name) AS manager_name, max(other_managers) AS other_managers
        FROM submissions JOIN coverpages USING (ACCESSION_NUMBER) JOIN summarypages USING (ACCESSION_NUMBER) GROUP BY cik""").df()
    fs = pd.read_parquet(DERIVED_DIR / "filer_summary.parquet")
    fs["period"] = pd.to_datetime(fs["period"])
    el = eligibility(fs, names)
    el.to_parquet(DERIVED_DIR / "filer_eligibility.parquet", index=False)
    stat = el[el["eligible"]].copy()
    stat["rank"] = stat.groupby("period")["prev_value"].rank(ascending=False, method="first")
    stat = stat[stat["rank"] <= 100][["period", "cik", "manager_name", "rank", "prev_value", "n_positions", "top10_weight"]]
    stat.to_parquet(DERIVED_DIR / "universe_b_static.parquet", index=False)
    print("eligible per period:", el[el.eligible].groupby("period").size().describe()[["min", "50%", "max"]].to_dict())
    print(stat.groupby("period").size().tail(3).to_dict())
    perf = DERIVED_DIR / "copy_returns_all_filers.parquet"
    if perf.exists():
        cr = pd.read_parquet(perf)   # columns: cik, period, trailing_8q_copy_return (as of period's availability)
        pf = el[el["eligible"]].merge(cr, on=["cik", "period"], how="left")
        pf["rank"] = pf.groupby("period")["trailing_8q_copy_return"].rank(ascending=False, method="first")
        pf = pf[pf["rank"] <= 100][["period", "cik", "manager_name", "rank", "trailing_8q_copy_return", "prev_value"]]
        pf.to_parquet(DERIVED_DIR / "universe_b_perf.parquet", index=False)
        print("perf-ranked universe built")

if __name__ == "__main__":
    main()
