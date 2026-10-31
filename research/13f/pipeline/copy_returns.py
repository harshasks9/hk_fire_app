"""
Step 10b — Copy-portfolio returns for every eligible 13F filer, point-in-time (feeds Universe B-perf and
the manager scorecard).

For filer f and report period t, the copy portfolio is f's long-equity book as disclosed for t, weighted by
reported value, bought at the first quarter end after the filing was public (t+1 for on-time filers) and
held one quarter, at 13F-implied prices. The quarterly series of these returns, compounded over the
trailing 8 quarters, is the "trailing copy return" an investor could have computed at each date with only
public information. Filers that did not file for a quarter get NaN for that quarter.
Output: DERIVED_DIR/copy_returns_all_filers.parquet (cik, period, copy_ret_q, trailing_8q_copy_return, n_names)
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import DERIVED_DIR, PRICES_DIR

POS_DIR = DERIVED_DIR / "filer_positions"

def main() -> None:
    px = pd.read_parquet(PRICES_DIR / "prices_13f_adj.parquet")
    panel = px.pivot(index="period", columns="CUSIP", values="adj_price").sort_index()
    rets = panel.pct_change()                      # return over the quarter ending at the index date
    el = pd.read_parquet(DERIVED_DIR / "filer_eligibility.parquet")
    el["period"] = pd.to_datetime(el["period"])
    # availability: for each filing, the first quarter end strictly after the filing date (no acceptance ts for non-universe filers; filing date + 1 day is conservative)
    el["avail"] = pd.to_datetime(el["filing_date"]) + pd.Timedelta(days=1)
    periods = panel.index
    el["entry_pos"] = periods.searchsorted(el["avail"].values, side="right")
    el = el[(el["entry_pos"] < len(periods) - 1) & el["eligible"]]
    out = []
    for f in sorted(POS_DIR.glob("*.parquet")):
        period = pd.Timestamp(f.stem)
        sub = el[el["period"] == period]
        if sub.empty:
            continue
        pos = pd.read_parquet(f, columns=["cik", "CUSIP", "value"])
        pos = pos[pos["cik"].isin(sub["cik"])]
        pos = pos.merge(sub[["cik", "entry_pos"]], on="cik")
        # weight by value, return over the quarter after entry (entry_pos → entry_pos+1)
        pos["ret"] = rets.values[np.clip(pos["entry_pos"].values + 1, 0, len(periods) - 1), pd.Index(panel.columns).get_indexer(pos["CUSIP"])] if True else np.nan
        pos.loc[pd.Index(panel.columns).get_indexer(pos["CUSIP"]) < 0, "ret"] = np.nan
        pos = pos[pos["ret"].notna()]
        g = pos.groupby(["cik", "entry_pos"])
        r = (g.apply(lambda d: np.average(d["ret"], weights=d["value"])).rename("copy_ret_q")).reset_index()
        r["n_names"] = g.size().values
        r["period"] = period; r["ret_period"] = periods[np.clip(r["entry_pos"] + 1, 0, len(periods) - 1)]
        out.append(r)
    cr = pd.concat(out, ignore_index=True).sort_values(["cik", "period"])
    cr["trailing_8q_copy_return"] = cr.groupby("cik")["copy_ret_q"].transform(lambda s: (1 + s).rolling(8, min_periods=8).apply(np.prod, raw=True) - 1)
    # the trailing return as of period t uses copy returns realised up to t's entry quarter + 1 — i.e. it is known only after
    # ret_period; shift so that trailing_8q is the value an investor knew when selecting for period t
    cr["trailing_8q_copy_return"] = cr.groupby("cik")["trailing_8q_copy_return"].shift(1)
    cr.to_parquet(DERIVED_DIR / "copy_returns_all_filers.parquet", index=False)
    print(f"{len(cr):,} filer-quarters of copy returns for {cr.cik.nunique():,} filers")

if __name__ == "__main__":
    main()
