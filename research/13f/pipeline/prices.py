"""
Step 5 — Daily adjusted prices from Tiingo (dividend- and split-adjusted close → total-return index).

Tiingo's /tiingo/daily/<ticker>/prices returns adjClose (splits + dividends), adjVolume, splitFactor,
divCash. Delisted tickers remain queryable, which is what makes the universe survivorship-free.
Requires TIINGO_TOKEN. Each ticker's history is cached as PRICES_DIR/<TICKER>.parquet.
"""
from __future__ import annotations
import sys, time
import pandas as pd
import requests
from config import PRICES_DIR, TIINGO_TOKEN

BASE = "https://api.tiingo.com/tiingo/daily"

def fetch_ticker(s: requests.Session, ticker: str, start: str = "2010-01-01") -> pd.DataFrame | None:
    out = PRICES_DIR / f"{ticker.upper().replace('/', '-')}.parquet"
    if out.exists():
        return pd.read_parquet(out)
    r = s.get(f"{BASE}/{ticker}/prices", params={"startDate": start, "format": "json", "token": TIINGO_TOKEN}, timeout=60)
    if r.status_code == 404 or (r.status_code == 200 and r.text.strip() in ("[]", "")):
        pd.DataFrame(columns=["date", "adjClose", "close", "volume", "adjVolume", "divCash", "splitFactor"]).to_parquet(out, index=False)
        return None
    if r.status_code == 429:
        time.sleep(30); return fetch_ticker(s, ticker, start)
    r.raise_for_status()
    df = pd.DataFrame(r.json())
    if df.empty:
        df = pd.DataFrame(columns=["date", "adjClose", "close", "volume", "adjVolume", "divCash", "splitFactor"])
    else:
        df["date"] = pd.to_datetime(df["date"]).dt.tz_localize(None).dt.normalize()
        df = df[["date", "adjClose", "adjOpen", "close", "volume", "adjVolume", "divCash", "splitFactor"]]
    df.to_parquet(out, index=False)
    return df

def main(tickers: list[str]) -> None:
    if not TIINGO_TOKEN:
        sys.exit("set TIINGO_TOKEN")
    s = requests.Session(); s.headers["Content-Type"] = "application/json"
    missing = [t for t in tickers if not (PRICES_DIR / f"{t.upper().replace('/', '-')}.parquet").exists()]
    print(f"{len(tickers)} tickers, {len(missing)} to fetch")
    for i, t in enumerate(missing, 1):
        try:
            fetch_ticker(s, t)
        except Exception as e:  # noqa: BLE001
            print(f"{t}: {e}")
        if i % 200 == 0:
            print(f"  {i}/{len(missing)}")

if __name__ == "__main__":
    main([t for t in pd.read_parquet(sys.argv[1])["ticker"].dropna().unique()])
