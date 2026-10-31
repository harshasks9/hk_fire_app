"""
Portfolio simulator for the investable strategies (Part 5.3–5.5).

A strategy is a function that, given the information available at a rebalance timestamp, returns a list of
(ticker, target weight). The simulator:
  * executes at the close of the first session after each rebalance timestamp (lag_sessions configurable),
  * applies proportional costs per side (default 20 bp: ~half-spread + impact for liquid US large/mid caps;
    sensitivities at 10 / 40 / 80 bp are run by the validation step),
  * enforces a maximum position weight, a maximum number of names and a liquidity screen (63-day average
    dollar volume ≥ liquidity_min, default $5m) using data as of the rebalance date,
  * holds between rebalances with drift (buy-and-hold weights), so turnover is what the rule generates,
  * carries delisted names at their last price (Tiingo folds the delisting payout into adjClose where known).
Output: daily NAV, holdings log, turnover, costs paid, and summary metrics vs SPY / QQQ / RSP.
"""
from __future__ import annotations
from dataclasses import dataclass, field
import numpy as np, pandas as pd

@dataclass
class SimResult:
    nav: pd.Series
    holdings: pd.DataFrame
    turnover: pd.Series
    costs: pd.Series
    params: dict = field(default_factory=dict)

def simulate(targets: dict[pd.Timestamp, dict[str, float]], close: pd.DataFrame, dvol: pd.DataFrame | None = None,
             cost_bps: float = 20.0, max_weight: float = 0.10, max_names: int = 50, liquidity_min: float = 5e6,
             lag_sessions: int = 1, start_nav: float = 1.0) -> SimResult:
    cal = close.index
    rets = close.pct_change().fillna(0.0)
    dates = sorted(targets)
    # map rebalance timestamps to execution sessions
    from bt_core import entry_positions
    exec_pos = entry_positions(pd.Series(dates), cal, lag_sessions)
    nav = pd.Series(np.nan, index=cal); w = pd.Series(dtype=float)
    hold_log, turn_log, cost_log = [], {}, {}
    value = start_nav
    first = int(exec_pos[0]) if len(exec_pos) and exec_pos[0] >= 0 else 0
    nav.iloc[:first] = np.nan
    rebal = {int(p): d for p, d in zip(exec_pos, dates) if p >= 0}
    for i in range(first, len(cal)):
        if i > first and len(w):
            r = rets.iloc[i].reindex(w.index).fillna(0.0)
            value *= 1 + float((w * r).sum())
            w = w * (1 + r); w = w / w.sum() if w.sum() > 0 else w
        if i in rebal:
            tgt = pd.Series(targets[rebal[i]], dtype=float)
            tgt = tgt[tgt.index.isin(close.columns)]
            tgt = tgt[close.iloc[i].reindex(tgt.index).notna()]
            if dvol is not None and liquidity_min:
                adv = dvol.iloc[max(0, i - 63):i + 1].reindex(columns=tgt.index).mean()
                tgt = tgt[adv.fillna(0) >= liquidity_min]
            tgt = tgt.sort_values(ascending=False).head(max_names)
            if len(tgt):
                tgt = tgt / tgt.sum()
                tgt = tgt.clip(upper=max_weight); tgt = tgt / tgt.sum() if tgt.sum() > 0 else tgt
            allk = tgt.index.union(w.index)
            trade = (tgt.reindex(allk).fillna(0) - w.reindex(allk).fillna(0)).abs().sum()
            cost = trade * cost_bps / 1e4
            value *= 1 - cost
            turn_log[cal[i]] = trade / 2; cost_log[cal[i]] = cost
            w = tgt
            hold_log.append(pd.DataFrame({"date": cal[i], "ticker": w.index, "weight": w.values}))
        nav.iloc[i] = value
    hold = pd.concat(hold_log, ignore_index=True) if hold_log else pd.DataFrame(columns=["date", "ticker", "weight"])
    return SimResult(nav.dropna(), hold, pd.Series(turn_log), pd.Series(cost_log),
                     dict(cost_bps=cost_bps, max_weight=max_weight, max_names=max_names, liquidity_min=liquidity_min, lag_sessions=lag_sessions))

def metrics(nav: pd.Series, bench: pd.Series | None = None, rf: pd.Series | None = None) -> dict:
    r = nav.pct_change().dropna()
    if len(r) < 20:
        return {}
    years = (nav.index[-1] - nav.index[0]).days / 365.25
    cagr = (nav.iloc[-1] / nav.iloc[0]) ** (1 / years) - 1 if years > 0 else np.nan
    ex = r - (rf.reindex(r.index).fillna(0.0) if rf is not None else 0.0)
    vol = r.std() * np.sqrt(252)
    sharpe = ex.mean() / r.std() * np.sqrt(252) if r.std() > 0 else np.nan
    down = r[r < 0].std() * np.sqrt(252)
    sortino = ex.mean() * 252 / down if down > 0 else np.nan
    dd = (nav / nav.cummax() - 1).min()
    out = {"cagr": cagr, "vol": vol, "sharpe": sharpe, "sortino": sortino, "max_dd": dd, "calmar": cagr / abs(dd) if dd < 0 else np.nan,
           "years": years, "end_nav": nav.iloc[-1]}
    if bench is not None:
        b = bench.reindex(nav.index).ffill()
        bcagr = (b.iloc[-1] / b.iloc[0]) ** (1 / years) - 1
        out["bench_cagr"] = bcagr; out["excess_cagr"] = cagr - bcagr
        br = b.pct_change().dropna().reindex(r.index).fillna(0.0)
        out["tracking_error"] = (r - br).std() * np.sqrt(252)
        out["info_ratio"] = (r - br).mean() * 252 / out["tracking_error"] if out["tracking_error"] > 0 else np.nan
        out["beta"] = np.cov(r, br)[0, 1] / br.var() if br.var() > 0 else np.nan
    return out

def factor_alpha(nav: pd.Series, ff: pd.DataFrame) -> dict:
    r = nav.pct_change().dropna()
    x = ff.reindex(r.index).dropna(); y = r.reindex(x.index) - x["RF"]
    X = np.column_stack([np.ones(len(x)), x[["Mkt-RF", "SMB", "HML", "RMW", "CMA", "Mom"]].values])
    beta, *_ = np.linalg.lstsq(X, y.values, rcond=None)
    resid = y.values - X @ beta
    n, k = X.shape; L = 6
    XtX_inv = np.linalg.inv(X.T @ X); S = (X * resid[:, None]).T @ (X * resid[:, None])
    for l in range(1, L + 1):
        G = (X[l:] * resid[l:, None]).T @ (X[:-l] * resid[:-l, None]); S += (1 - l / (L + 1)) * (G + G.T)
    se = np.sqrt(np.diag(XtX_inv @ S @ XtX_inv))
    return {"alpha_ann": beta[0] * 252, "alpha_t": beta[0] / se[0], "beta_mkt": beta[1], "beta_smb": beta[2], "beta_hml": beta[3],
            "beta_rmw": beta[4], "beta_cma": beta[5], "beta_mom": beta[6], "r2": 1 - resid.var() / y.var()}
