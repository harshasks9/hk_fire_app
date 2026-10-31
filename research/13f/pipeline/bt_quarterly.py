"""
Quarterly backtest core on 13F-implied prices (used when no daily price vendor is configured).

Point-in-time rule. A signal available at timestamp T (EDGAR acceptance) is executed at the first quarter
end strictly after T, at that quarter end's 13F-implied price. For a filing on the 45-day deadline this means
buying about 45 days after the filing and 90 days after the holdings date — a harsher delay than a real
investor faces, so results here are a lower bound on the timing available to a daily implementation.
Forward returns are measured in quarters (1 = 3m, 2 = 6m, 4 = 12m, 8 = 24m, 12 = 36m). The 5-day and
20-day horizons of the brief cannot be measured on quarterly prices and are reported as not testable.

Returns are price returns. SPY / QQQ / RSP benchmarks are measured identically from their own 13F lines,
so excess returns are like-for-like; absolute levels understate total returns by the dividend yield
(≈1.3–2 % a year for SPY over the sample). Factor regressions use Fama-French factors compounded to
quarters, which are total-return based; alphas are therefore biased *down* by roughly the portfolio's
dividend yield minus the market's, which is noted wherever an alpha is quoted.

Delistings. A security that stops being reported has no further price. `fwd_k` then uses the last observed
price (`truncated=True`); the validation step re-runs every table with vanished names set to −100 %
(the worst case) to bound the survivorship effect.
"""
from __future__ import annotations
import numpy as np, pandas as pd
from config import PRICES_DIR, FACTORS_DIR, DERIVED_DIR

BENCH_CUSIP = {"SPY": "78462F103", "QQQ": "46090E103", "RSP": "78355W106", "IWM": "464287655"}
HORIZONS_Q = {"3m": 1, "6m": 2, "12m": 4, "24m": 8, "36m": 12}
MAX_PLAUSIBLE_RETURN = 20.0
COVERAGE: tuple[pd.DataFrame, pd.DataFrame] | None = None   # (holders, aggval) panels, set by load_panel
MIN_HOLDERS, MIN_AGG_VALUE = 5, 5e7                           # coverage screen used by every event table

def load_panel() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    px = pd.read_parquet(PRICES_DIR / "prices_13f_adj.parquet")
    raw = pd.read_parquet(PRICES_DIR / "prices_13f.parquet")
    panel = px.pivot(index="period", columns="CUSIP", values="adj_price").sort_index()
    holders = raw.pivot(index="period", columns="CUSIP", values="n_holders").reindex(panel.index)
    aggval = raw.pivot(index="period", columns="CUSIP", values="agg_value").reindex(panel.index)
    # Delisting rule: a quarter-end "price" implied by fewer than MIN_HOLDERS filers is not a market price — after an
    # acquisition or delisting one or two stale lines keep reporting the CUSIP (audit note 13). Such quarters are
    # blanked, so forward returns truncate at the last covered price and strategies carry the name at that price.
    panel = panel.where(holders.reindex(columns=panel.columns).fillna(0) >= MIN_HOLDERS)
    global COVERAGE
    COVERAGE = (holders, aggval)
    return panel, holders, aggval

def quarterly_factors() -> pd.DataFrame:
    ff = pd.read_parquet(FACTORS_DIR / "ff_daily.parquet").set_index("date")
    q = (1 + ff).groupby(ff.index.to_period("Q")).prod() - 1
    q.index = q.index.to_timestamp(how="end").normalize()
    return q

def entry_period(available_ts: pd.Series, periods: pd.DatetimeIndex) -> np.ndarray:
    """Index into periods of the first quarter end strictly after availability (−1 if none)."""
    ts = pd.to_datetime(available_ts).dt.normalize().values
    idx = periods.searchsorted(ts, side="right")
    return np.where(idx >= len(periods), -1, idx)

def forward_returns(events: pd.DataFrame, panel: pd.DataFrame, horizons=HORIZONS_Q, worst_case_delist: bool = False) -> pd.DataFrame:
    """Attach entry period, entry price and forward/excess returns for each event (events need CUSIP, available_ts)."""
    periods = panel.index
    ev = events[events["CUSIP"].isin(panel.columns)].copy()
    ev["entry_pos"] = entry_period(ev["available_ts"], periods)
    ev = ev[ev["entry_pos"] >= 0].copy()
    ev["entry_period"] = periods[ev["entry_pos"].values]
    arr = panel.values
    col = pd.Index(panel.columns).get_indexer(ev["CUSIP"]); row = ev["entry_pos"].values
    p0 = arr[row, col]
    ev["entry_price"] = p0
    ev = ev[np.isfinite(p0)].copy(); col = col[np.isfinite(p0)]; row = row[np.isfinite(p0)]; p0 = p0[np.isfinite(p0)]
    # institutional coverage at entry (all 13F filers): the liquidity / price-reliability screen
    if COVERAGE is not None:
        hold, aggv = COVERAGE
        hc = pd.Index(hold.columns).get_indexer(ev["CUSIP"]); ok = hc >= 0
        ev["n_holders_entry"] = np.where(ok, hold.values[row, np.where(ok, hc, 0)], np.nan)
        ev["agg_value_entry"] = np.where(ok, aggv.values[row, np.where(ok, hc, 0)], np.nan)
    bcol = {k: pd.Index(panel.columns).get_loc(c) for k, c in BENCH_CUSIP.items() if c in panel.columns}
    # last observed price index per column (for truncation / delisting handling)
    last_obs = pd.Series(np.where(np.isfinite(arr), np.arange(len(periods))[:, None], -1).max(axis=0), index=panel.columns)
    lo = last_obs.values[col]
    for name, k in horizons.items():
        r1 = row + k
        valid = r1 < len(periods)
        rr = np.where(valid, r1, len(periods) - 1)
        p1 = arr[rr, col]
        trunc = ~np.isfinite(p1) & valid & (lo > row)          # vanished before the horizon
        p1t = np.where(trunc, arr[np.minimum(lo, rr), col], p1)
        fwd = p1t / p0 - 1
        if worst_case_delist:
            fwd = np.where(trunc & (lo < rr), -1.0, fwd)
        fwd = np.where(valid, fwd, np.nan)
        fwd = np.where(fwd > MAX_PLAUSIBLE_RETURN, np.nan, fwd)      # a >20× move on quarterly implied prices is a data error (undetected reverse split / unit change), not a return
        ev[f"fwd_{name}"] = fwd; ev[f"trunc_{name}"] = trunc & valid
        for b, bc in bcol.items():
            ev[f"{b.lower()}_{name}"] = np.where(valid, arr[rr, bc] / arr[row, bc] - 1, np.nan)
        ev[f"xs_{name}"] = ev[f"fwd_{name}"] - ev.get(f"spy_{name}", np.nan)
        ev[f"xq_{name}"] = ev[f"fwd_{name}"] - ev.get(f"qqq_{name}", np.nan)
        ev[f"xe_{name}"] = ev[f"fwd_{name}"] - ev.get(f"rsp_{name}", np.nan)
    return ev

def covered(ev: pd.DataFrame) -> pd.DataFrame:
    """Events whose security had ≥ MIN_HOLDERS 13F holders and ≥ MIN_AGG_VALUE of 13F-reported value at entry."""
    return ev[(ev["n_holders_entry"] >= MIN_HOLDERS) & (ev["agg_value_entry"] >= MIN_AGG_VALUE)].copy()

def cluster_tstat(x: pd.Series, cluster: pd.Series) -> tuple[float, float, int]:
    df = pd.DataFrame({"x": x, "c": cluster}).dropna()
    if len(df) < 3:
        return np.nan, np.nan, len(df)
    m = df["x"].mean(); g = df.groupby("c")["x"]
    s = ((g.sum() - g.size() * m) ** 2).sum(); se = np.sqrt(s) / len(df)
    return m, (m / se if se > 0 else np.nan), df["c"].nunique()

def block_bootstrap_ci(x: pd.Series, cluster: pd.Series, n_boot: int = 2000, seed: int = 7) -> tuple[float, float]:
    df = pd.DataFrame({"x": x, "c": cluster}).dropna()
    if df["c"].nunique() < 3:
        return np.nan, np.nan
    sums = df.groupby("c")["x"].agg(["sum", "size"])
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(sums), size=(n_boot, len(sums)))
    means = sums["sum"].values[idx].sum(axis=1) / sums["size"].values[idx].sum(axis=1)
    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))

def summarize(ev: pd.DataFrame, by: list[str] | None, horizons=HORIZONS_Q, cluster_col: str = "entry_period") -> pd.DataFrame:
    rows = []
    groups = ev.groupby(by, observed=True) if by else [((), ev)]
    for key, g in groups:
        base = dict(zip(by, key if isinstance(key, tuple) else (key,))) if by else {}
        for name in horizons:
            for col, lab in [(f"fwd_{name}", "abs"), (f"xs_{name}", "xs_spy"), (f"xq_{name}", "xs_qqq"), (f"xe_{name}", "xs_rsp")]:
                if col not in g:
                    continue
                m, t, nc = cluster_tstat(g[col], g[cluster_col])
                lo, hi = block_bootstrap_ci(g[col], g[cluster_col]) if lab == "xs_spy" else (np.nan, np.nan)
                x = g[col].dropna(); mw = x.clip(x.quantile(0.01), x.quantile(0.99)).mean() if len(x) > 20 else x.mean()
                rows.append({**base, "horizon": name, "measure": lab, "n": int(g[col].notna().sum()), "n_periods": nc,
                             "mean": m, "mean_winsor": mw, "median": g[col].median(), "win_rate": (g[col] > 0).mean() if g[col].notna().any() else np.nan,
                             "t_cluster": t, "ci_lo": lo, "ci_hi": hi, "p10": g[col].quantile(0.10), "p90": g[col].quantile(0.90),
                             "truncated_share": g[f"trunc_{name}"].mean() if f"trunc_{name}" in g else np.nan})
    return pd.DataFrame(rows)

def calendar_time_returns(ev: pd.DataFrame, panel: pd.DataFrame, hold_q: int) -> pd.Series:
    """Equal-weight calendar-time quarterly portfolio: each event held hold_q quarters from entry; weights reset
    each quarter across active events (the standard Jaffe–Mandelker construction). Returns a quarterly series."""
    rets = panel.pct_change().values
    n_periods = len(panel.index)
    col = pd.Index(panel.columns).get_indexer(ev["CUSIP"]).astype(int); row = ev["entry_pos"].values.astype(int)
    acc = np.zeros(n_periods); cnt = np.zeros(n_periods)
    for k in range(1, hold_q + 1):
        t = row + k
        ok = t < n_periods
        v = rets[t[ok], col[ok]]
        fin = np.isfinite(v)
        np.add.at(acc, t[ok][fin], v[fin]); np.add.at(cnt, t[ok][fin], 1.0)
    out = pd.Series(np.where(cnt > 0, acc / np.where(cnt > 0, cnt, 1), np.nan), index=panel.index)
    return out.dropna()

def factor_alpha_q(port_q: pd.Series, ffq: pd.DataFrame, min_obs: int = 12) -> dict:
    x = ffq.reindex(port_q.index).dropna(); y = port_q.reindex(x.index) - x["RF"]
    if len(x) < min_obs:
        return {"alpha_ann": np.nan, "alpha_t": np.nan, "quarters": len(x)}
    X = np.column_stack([np.ones(len(x)), x[["Mkt-RF", "SMB", "HML", "RMW", "CMA", "Mom"]].values])
    beta, *_ = np.linalg.lstsq(X, y.values, rcond=None); resid = y.values - X @ beta
    n, k = X.shape; L = 2
    XtX_inv = np.linalg.inv(X.T @ X); S = (X * resid[:, None]).T @ (X * resid[:, None])
    for l in range(1, L + 1):
        G = (X[l:] * resid[l:, None]).T @ (X[:-l] * resid[:-l, None]); S += (1 - l / (L + 1)) * (G + G.T)
    se = np.sqrt(np.diag(XtX_inv @ S @ XtX_inv))
    return {"alpha_ann": beta[0] * 4, "alpha_t": beta[0] / se[0], "beta_mkt": beta[1], "beta_smb": beta[2], "beta_hml": beta[3],
            "beta_rmw": beta[4], "beta_cma": beta[5], "beta_mom": beta[6], "r2": 1 - resid.var() / y.var() if y.var() > 0 else np.nan, "quarters": int(n)}

def simulate_quarterly(targets: dict[pd.Timestamp, dict[str, float]], panel: pd.DataFrame, aggval: pd.DataFrame | None = None,
                       cost_bps: float = 20.0, max_weight: float = 0.10, max_names: int = 50, min_agg_value: float = 2e8,
                       exclude_top_n: int = 0) -> dict:
    """Quarterly-rebalanced long-only portfolio. targets: {execution quarter end: {CUSIP: weight}}; weights are
    applied at that quarter end's price, drift until the next rebalance, costs charged on turnover.
    min_agg_value: liquidity proxy — total 13F-reported value of the name at the rebalance (≥ $200m default)."""
    periods = panel.index; rets = panel.pct_change()
    w = pd.Series(dtype=float); nav = 1.0; navs = {}; turn = {}; cost = {}; holdings = []
    start = min(targets)
    for t in periods[periods >= start]:
        if len(w):
            r = rets.loc[t].reindex(w.index)
            r = r.fillna(0.0)                      # vanished names carried at last price (worst case handled in validation)
            nav *= 1 + float((w * r).sum()); w = w * (1 + r); w = w / w.sum() if w.sum() > 0 else w
        if t in targets:
            tgt = pd.Series(targets[t], dtype=float)
            tgt = tgt[tgt.index.isin(panel.columns)]
            tgt = tgt[panel.loc[t].reindex(tgt.index).notna()]
            if aggval is not None and min_agg_value:
                tgt = tgt[aggval.loc[t].reindex(tgt.index).fillna(0) >= min_agg_value]
            if aggval is not None and exclude_top_n:   # sensitivity: drop the n largest names by 13F-held value at this rebalance
                tgt = tgt[~tgt.index.isin(aggval.loc[t].nlargest(exclude_top_n).index)]
            tgt = tgt.sort_values(ascending=False).head(max_names)
            if len(tgt):
                tgt = tgt / tgt.sum(); tgt = tgt.clip(upper=max_weight); tgt = tgt / tgt.sum()
            allk = tgt.index.union(w.index)
            trade = (tgt.reindex(allk).fillna(0) - w.reindex(allk).fillna(0)).abs().sum()
            c = trade * cost_bps / 1e4; nav *= 1 - c
            turn[t] = trade / 2; cost[t] = c; w = tgt
            holdings.append(pd.DataFrame({"period": t, "CUSIP": w.index, "weight": w.values}))
        navs[t] = nav
    nav_s = pd.Series(navs)
    return {"nav": nav_s, "turnover": pd.Series(turn), "costs": pd.Series(cost),
            "holdings": pd.concat(holdings, ignore_index=True) if holdings else pd.DataFrame()}

def metrics_q(nav: pd.Series, bench: pd.Series | None = None, rf_q: pd.Series | None = None) -> dict:
    r = nav.pct_change().dropna()
    if len(r) < 4:
        return {}
    years = len(r) / 4
    cagr = nav.iloc[-1] ** (1 / years) - 1 if nav.iloc[0] == 1 else (nav.iloc[-1] / nav.iloc[0]) ** (1 / years) - 1
    ex = r - (rf_q.reindex(r.index).fillna(0) if rf_q is not None else 0)
    vol = r.std() * 2; sharpe = ex.mean() / r.std() * 2 if r.std() > 0 else np.nan
    down = r[r < 0].std() * 2; sortino = ex.mean() * 4 / down if down > 0 else np.nan
    dd = (nav / nav.cummax() - 1).min()
    out = {"cagr": cagr, "vol": vol, "sharpe": sharpe, "sortino": sortino, "max_dd": dd, "calmar": cagr / abs(dd) if dd < 0 else np.nan, "quarters": len(r)}
    if bench is not None:
        b = bench.reindex(nav.index).ffill(); br = b.pct_change().dropna().reindex(r.index).fillna(0)
        bc = (b.iloc[-1] / b.iloc[0]) ** (1 / years) - 1
        te = (r - br).std() * 2
        out.update({"bench_cagr": bc, "excess_cagr": cagr - bc, "tracking_error": te, "info_ratio": (r - br).mean() * 4 / te if te > 0 else np.nan,
                    "beta": np.cov(r, br)[0, 1] / br.var() if br.var() > 0 else np.nan, "win_rate_q": (r > br).mean()})
    return out
