"""
Backtest core: prices, calendar, point-in-time entry dates, forward returns, benchmarks, statistics.

Point-in-time rule. A filing accepted at time T (US Eastern) can be traded at the first session close
that is strictly after T plus `lag_sessions` further sessions. With lag_sessions = 1 (the default) a
filing accepted on Monday evening is bought at Tuesday's close; one accepted at 11:00 on Monday is bought
at Monday's close only with lag_sessions = 0. The audit table (entry_audit) lists, for every event, the
acceptance timestamp, the first tradable session and the one actually used.

Returns are total returns from Tiingo adjClose. Benchmarks: SPY, QQQ, an equal-weight proxy (RSP), the
Fama-French market and, where a SIC → FF49 industry map exists, the matching industry portfolio.
"""
from __future__ import annotations
from dataclasses import dataclass
import numpy as np, pandas as pd
from pathlib import Path
from config import PRICES_DIR, FACTORS_DIR, DERIVED_DIR, SECURITY_MASTER

HORIZONS = {"5d": 5, "20d": 20, "3m": 63, "6m": 126, "12m": 252, "24m": 504, "36m": 756}
BENCH = ["SPY", "QQQ", "RSP"]

def load_price_panel(tickers: list[str]) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Wide panels of adjClose, adjOpen and dollar volume (close × volume), trading-day index from SPY."""
    closes, opens, dvol = {}, {}, {}
    for t in dict.fromkeys(list(tickers) + BENCH):
        p = PRICES_DIR / f"{t.upper().replace('/', '-')}.parquet"
        if not p.exists():
            continue
        d = pd.read_parquet(p)
        if d.empty:
            continue
        d = d.drop_duplicates("date").set_index("date").sort_index()
        closes[t] = d["adjClose"]; opens[t] = d.get("adjOpen", d["adjClose"]); dvol[t] = d["close"] * d["volume"]
    close = pd.DataFrame(closes); open_ = pd.DataFrame(opens); dv = pd.DataFrame(dvol)
    cal = close["SPY"].dropna().index
    return close.reindex(cal), open_.reindex(cal), dv.reindex(cal)

def load_factors() -> pd.DataFrame:
    return pd.read_parquet(FACTORS_DIR / "ff_daily.parquet").set_index("date")

def cusip_to_ticker() -> pd.Series:
    sm = pd.read_parquet(SECURITY_MASTER)
    ok = sm[sm["mapped"] & sm["ticker"].notna() & (sm["market_sector"] == "Equity")]
    return ok.set_index("cusip")["ticker"]

def entry_positions(available_ts: pd.Series, cal: pd.DatetimeIndex, lag_sessions: int = 1, close_cutoff: str = "15:45") -> np.ndarray:
    """Index into cal of the execution session for each availability timestamp (−1 when beyond the calendar).
    A timestamp at or before close_cutoff on day D can be executed at D's close; later ones at the next session's
    close; lag_sessions further sessions are then added."""
    ts = pd.to_datetime(available_ts)
    cutoff = pd.Timedelta(close_cutoff + ":00")
    same_day = (ts - ts.dt.normalize()) <= cutoff
    candidate = pd.DatetimeIndex(np.where(same_day, ts.dt.normalize(), ts.dt.normalize() + pd.Timedelta(days=1)))
    idx = cal.searchsorted(candidate, side="left") + lag_sessions
    return np.where(idx >= len(cal), -1, idx)

@dataclass
class ForwardReturns:
    table: pd.DataFrame     # events with entry_date and fwd_<h>, bench_<h>, excess_<h>, mkt_<h>
    audit: pd.DataFrame     # availability → first tradable → used session

def forward_returns(events: pd.DataFrame, close: pd.DataFrame, ticker_col: str = "ticker", lag_sessions: int = 1,
                    horizons: dict[str, int] = HORIZONS, dvol: pd.DataFrame | None = None) -> ForwardReturns:
    cal = close.index
    ev = events[events[ticker_col].isin(close.columns)].copy()
    pos = entry_positions(ev["available_ts"], cal, lag_sessions)
    ev["entry_pos"] = pos
    ev = ev[ev["entry_pos"] >= 0].copy()
    ev["entry_date"] = cal[ev["entry_pos"].values]
    first = entry_positions(ev["available_ts"], cal, 0)
    ev["first_tradable_date"] = cal[np.clip(first, 0, len(cal) - 1)]
    arr = close.values
    col = pd.Index(close.columns).get_indexer(ev[ticker_col])
    row = ev["entry_pos"].values
    p0 = arr[row, col]
    spy = pd.Index(close.columns).get_loc("SPY"); qqq = pd.Index(close.columns).get_loc("QQQ")
    rsp = pd.Index(close.columns).get_loc("RSP") if "RSP" in close.columns else None
    ev["entry_price_ok"] = ~np.isnan(p0)
    if dvol is not None:
        dv = dvol.reindex(columns=close.columns).values
        lo = np.clip(row - 63, 0, None)
        ev["adv63_usd"] = [np.nanmean(dv[lo[i]:row[i] + 1, col[i]]) if row[i] > lo[i] else np.nan for i in range(len(ev))]
    for name, h in horizons.items():
        r1 = row + h
        valid = r1 < len(cal)
        rr = np.where(valid, r1, len(cal) - 1)
        p1 = arr[rr, col]
        # delisted inside the window: use the last available price (the delisting return is in adjClose where Tiingo has it)
        fwd = p1 / p0 - 1
        fwd = np.where(valid, fwd, np.nan)
        ev[f"fwd_{name}"] = fwd
        ev[f"spy_{name}"] = np.where(valid, arr[rr, spy] / arr[row, spy] - 1, np.nan)
        ev[f"qqq_{name}"] = np.where(valid, arr[rr, qqq] / arr[row, qqq] - 1, np.nan)
        if rsp is not None:
            ev[f"rsp_{name}"] = np.where(valid, arr[rr, rsp] / arr[row, rsp] - 1, np.nan)
        ev[f"xs_{name}"] = ev[f"fwd_{name}"] - ev[f"spy_{name}"]
        ev[f"xq_{name}"] = ev[f"fwd_{name}"] - ev[f"qqq_{name}"]
    audit = ev[["available_ts", "first_tradable_date", "entry_date"]].drop_duplicates()
    return ForwardReturns(ev, audit)

def cluster_tstat(x: pd.Series, cluster: pd.Series) -> tuple[float, float, int]:
    """Mean, t-stat with one-way clustering on `cluster` (e.g. the report period), and number of clusters."""
    df = pd.DataFrame({"x": x, "c": cluster}).dropna()
    if df.empty:
        return np.nan, np.nan, 0
    m = df["x"].mean()
    g = df.groupby("c")["x"]
    # cluster-robust variance of the mean: Σ_c (Σ_i∈c (x_i − m))² / N²
    s = ((g.sum() - g.size() * m) ** 2).sum()
    se = np.sqrt(s) / len(df)
    return m, (m / se if se > 0 else np.nan), df["c"].nunique()

def block_bootstrap_ci(x: pd.Series, cluster: pd.Series, n_boot: int = 2000, seed: int = 7) -> tuple[float, float]:
    """95 % CI for the mean by resampling whole clusters (report periods) with replacement."""
    df = pd.DataFrame({"x": x, "c": cluster}).dropna()
    if df.empty:
        return np.nan, np.nan
    sums = df.groupby("c")["x"].agg(["sum", "size"])
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(sums), size=(n_boot, len(sums)))
    tot = sums["sum"].values[idx].sum(axis=1); n = sums["size"].values[idx].sum(axis=1)
    means = tot / n
    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))

def summarize(ev: pd.DataFrame, by: list[str] | None, horizons=HORIZONS, cluster_col: str = "period") -> pd.DataFrame:
    rows = []
    groups = ev.groupby(by) if by else [((), ev)]
    for key, g in groups:
        base = dict(zip(by, key if isinstance(key, tuple) else (key,))) if by else {}
        for name in horizons:
            for col, lab in [(f"fwd_{name}", "abs"), (f"xs_{name}", "xs_spy"), (f"xq_{name}", "xs_qqq")]:
                m, t, nc = cluster_tstat(g[col], g[cluster_col])
                lo, hi = block_bootstrap_ci(g[col], g[cluster_col]) if lab == "xs_spy" else (np.nan, np.nan)
                rows.append({**base, "horizon": name, "measure": lab, "n": int(g[col].notna().sum()), "n_periods": nc,
                             "mean": m, "median": g[col].median(), "win_rate": (g[col] > 0).mean(), "t_cluster": t,
                             "ci_lo": lo, "ci_hi": hi, "p10": g[col].quantile(0.10), "p90": g[col].quantile(0.90)})
    return pd.DataFrame(rows)

def calendar_time_alpha(ev: pd.DataFrame, close: pd.DataFrame, ff: pd.DataFrame, hold_days: int, ticker_col: str = "ticker") -> dict:
    """Equal-weight calendar-time portfolio: each event is held hold_days sessions from its entry; daily rebalanced
    among active events. Regress excess daily returns on FF5 + Mom. Returns annualised alpha, t-stat, betas, R²."""
    rets = close.pct_change()
    cal = close.index
    active = np.zeros((len(cal), 1))
    port = pd.Series(0.0, index=cal); cnt = pd.Series(0.0, index=cal)
    for r in ev.itertuples():
        a, b = int(r.entry_pos) + 1, min(int(r.entry_pos) + hold_days, len(cal) - 1)
        if b <= a:
            continue
        s = rets[getattr(r, ticker_col)].iloc[a:b + 1].fillna(0.0)
        port.iloc[a:b + 1] += s.values; cnt.iloc[a:b + 1] += 1
    daily = (port / cnt.replace(0, np.nan)).dropna()
    x = ff.reindex(daily.index).dropna()
    y = (daily.reindex(x.index) - x["RF"])
    X = np.column_stack([np.ones(len(x)), x[["Mkt-RF", "SMB", "HML", "RMW", "CMA", "Mom"]].values])
    beta, res, *_ = np.linalg.lstsq(X, y.values, rcond=None)
    resid = y.values - X @ beta
    # Newey-West (6 lags) standard error for alpha
    n, k = X.shape; L = 6
    XtX_inv = np.linalg.inv(X.T @ X)
    S = (X * resid[:, None]).T @ (X * resid[:, None])
    for l in range(1, L + 1):
        w = 1 - l / (L + 1)
        G = (X[l:] * resid[l:, None]).T @ (X[:-l] * resid[:-l, None])
        S += w * (G + G.T)
    V = XtX_inv @ S @ XtX_inv
    se = np.sqrt(np.diag(V))
    return {"alpha_ann": beta[0] * 252, "alpha_t": beta[0] / se[0], "beta_mkt": beta[1], "beta_smb": beta[2], "beta_hml": beta[3],
            "beta_rmw": beta[4], "beta_cma": beta[5], "beta_mom": beta[6], "r2": 1 - resid.var() / y.var(), "days": int(n),
            "daily": daily}
