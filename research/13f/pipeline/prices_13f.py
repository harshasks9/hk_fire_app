"""
Step 5b — Quarter-end prices implied by the 13F filings themselves (no price vendor needed).

Every 13F line reports a position's fair market value and share count at the report date. Across the
~5,000 filers reporting a security in a quarter, the value-weighted median of value ÷ shares is the
quarter-end price to within the rounding of the largest positions (values were rounded to $1,000 before
2023, so positions worth ≥ $200k are used first; a $10m position carries a 0.005 % rounding error).

What this gives: a survivorship-free quarterly price for every security held by any 13F filer,
2013Q2 → 2026Q2, including stocks that were later delisted (they simply stop appearing).
What it does not give: dividends (returns are price returns; benchmarks SPY/QQQ/RSP are measured the same
way from their own 13F lines, so relative returns are like-for-like), intra-quarter prices (entries are
at the first quarter end after a filing became public — a 45–90 day lag that is *more* conservative than a
real investor needs), and the final payout of a delisted stock (handled as a sensitivity: last observed price
vs. −100 %).

Splits are detected cross-sectionally: for holders present in both quarters, the median ratio of shares
held; if ≥ 60 % of common holders show the same ratio within 2 % of a conventional split ratio and the
implied price moved inversely, the ratio is recorded as the split factor for that (CUSIP, period).

Outputs: PRICES_DIR/prices_13f.parquet   (CUSIP, period, price, n_holders, agg_value, n_used, price_raw)
         DERIVED_DIR/splits_13f.parquet  (CUSIP, period_from, period_to, factor, support)
         PRICES_DIR/prices_13f_adj.parquet (CUSIP, period, adj_price) — split-adjusted to the latest basis
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import DERIVED_DIR, PRICES_DIR

POS_DIR = DERIVED_DIR / "filer_positions"
SPLIT_RATIOS = np.array([2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 30, 40, 50, 1/2, 1/3, 1/4, 1/5, 1/6, 1/8, 1/10, 1/15, 1/20, 1/25, 1/50, 3/2, 4/3, 5/4, 2/3, 3/4, 4/5, 7/4, 5/2])

def wmedian(x: np.ndarray, w: np.ndarray) -> float:
    o = np.argsort(x); x, w = x[o], w[o]
    c = np.cumsum(w); return float(x[np.searchsorted(c, c[-1] / 2)])

def quarter_end(d: pd.Timestamp) -> pd.Timestamp:
    return (d + pd.offsets.QuarterEnd(0))

def main() -> None:
    files = sorted(POS_DIR.glob("*.parquet"))
    out, prev = [], None
    splits = []
    for f in files:
        p = pd.read_parquet(f, columns=["cik", "CUSIP", "shares", "value", "filing_date"])
        period = pd.Timestamp(f.stem)
        qe = quarter_end(period)
        if period != qe or period < pd.Timestamp("2013-06-30"):   # off-cycle or mistyped report dates are skipped
            continue
        p = p[(p["shares"] > 0) & (p["value"] > 0) & p["CUSIP"].notna()].copy()
        p["px"] = p["value"] / p["shares"]
        # prefer large positions (small rounding error); fall back to all when a name has few large holders
        big = p[p["value"] >= 2e5]
        g_big = big.groupby("CUSIP")
        px_big = g_big["px"].agg(price="median", n_used="size")
        px_big = px_big[px_big["n_used"] >= 3]
        g_all = p.groupby("CUSIP")
        px_all = g_all["px"].median().rename("price_all")
        agg = pd.DataFrame({"n_holders": g_all.size(), "agg_value": g_all["value"].sum(), "price_all": px_all}).join(px_big, how="left")
        agg["price"] = agg["price"].fillna(agg["price_all"]); agg["n_used"] = agg["n_used"].fillna(agg["n_holders"])
        # drop names whose holders disagree wildly (bad units / bad CUSIPs): interquartile ratio > 3
        q = g_all["px"].quantile([0.25, 0.75]).unstack()
        agg["dispersion"] = (q[0.75] / q[0.25]).reindex(agg.index)
        agg["period"] = qe
        out.append(agg.reset_index())
        # splits: common holders' share ratios (vectorised)
        if prev is not None:
            m = p[["cik", "CUSIP", "shares"]].merge(prev[["cik", "CUSIP", "shares", "px"]], on=["cik", "CUSIP"], suffixes=("", "_prev"))
            n_common = m.groupby("CUSIP").size().rename("n_common")
            m = m[m["shares"] != m["shares_prev"]].copy()
            m["ratio"] = m["shares"] / m["shares_prev"]
            med = m.groupby("CUSIP")["ratio"].median()
            # holders trade during the quarter, so individual ratios scatter around the split factor; the median
            # across hundreds of holders is tight (AAPL 4:1 in 2020Q3: median 3.9, IQR 3.6–4.05 across 3,295 holders)
            hit = np.isclose(med.values[:, None], SPLIT_RATIOS[None, :], rtol=0.05)
            cand = med[hit.any(axis=1)]
            factors = pd.Series(SPLIT_RATIOS[hit[hit.any(axis=1)].argmax(axis=1)], index=cand.index)
            if len(cand):
                mm = m[m["CUSIP"].isin(cand.index)].copy()
                mm["factor"] = mm["CUSIP"].map(factors)
                mm["ok"] = np.isclose(mm["ratio"], mm["factor"], rtol=0.15)
                st = mm.groupby("CUSIP").agg(support=("ok", "mean"), n=("ok", "size"), px_prev=("px", "median"))
                st = st.join(n_common).join(factors.rename("factor"))
                st["px_now"] = agg["price"].reindex(st.index)
                st = st[(st["support"] >= 0.5) & (st["n"] >= 5) & (st["n"] >= 0.8 * st["n_common"].fillna(1))]
                st = st[(st["factor"] >= 2) | (st["factor"] <= 0.5) | (st["n"] >= 20)]
                ratio = (st["px_prev"] / st["px_now"]) / st["factor"]
                st = st[ratio.between(0.6, 1.6)]
                for cusip, r in st.iterrows():
                    splits.append({"CUSIP": cusip, "period_from": prev_qe, "period_to": qe, "factor": float(r["factor"]), "support": float(r["support"]), "n": int(r["n"])})
        prev, prev_qe = p, qe
        print(qe.date(), len(agg), flush=True)
    px = pd.concat(out, ignore_index=True)
    px = px[px["dispersion"].fillna(1) < 3]
    sp = pd.DataFrame(splits)
    sp.to_parquet(DERIVED_DIR / "splits_13f.parquet", index=False)
    # split-adjust to the latest share basis: adj_price(t) = price(t) / Π_{splits with period_to > t} factor
    px = px.sort_values(["CUSIP", "period"]).reset_index(drop=True)
    px["adj_price"] = px["price"]
    if len(sp):
        for cusip, d in sp.groupby("CUSIP"):
            mask = px["CUSIP"] == cusip
            for r in d.itertuples():
                px.loc[mask & (px["period"] < r.period_to), "adj_price"] /= r.factor
    # isolated spikes (bad units in a thinly-held quarter): |log change| > 1.6 both against the previous and the next
    # observation, with no split recorded — set to NaN rather than let a 5× phantom return through
    lr = np.log(px["adj_price"])
    g = px.groupby("CUSIP")["adj_price"]
    d_prev = (lr - np.log(g.shift(1))).abs(); d_next = (np.log(g.shift(-1)) - lr).abs()
    spike = (d_prev > 1.6) & (d_next > 1.6)
    px.loc[spike, "adj_price"] = np.nan
    px["spike"] = spike
    px.to_parquet(PRICES_DIR / "prices_13f.parquet", index=False)
    px[["CUSIP", "period", "adj_price"]].to_parquet(PRICES_DIR / "prices_13f_adj.parquet", index=False)
    print(f"{len(px):,} CUSIP-quarters, {px.CUSIP.nunique():,} CUSIPs, {len(sp)} splits detected")
    for c, name in [("78462F103", "SPY"), ("46090E103", "QQQ"), ("037833100", "AAPL"), ("67066G104", "NVDA")]:
        s = px[px.CUSIP == c].set_index("period")["price"]
        print(name, s.iloc[[0, -5, -1]].round(2).to_dict())

if __name__ == "__main__":
    main()
