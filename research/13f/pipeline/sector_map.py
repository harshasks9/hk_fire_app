"""
Step 4b — Ticker → SIC code → Fama-French 49 industry (sector benchmarks and industry-matched tests).

Sources: sec.gov/include/ticker.txt (ticker → CIK, current), data.sec.gov/submissions/CIK##########.json
(`sic` per registrant), Kenneth French's Siccodes49.txt. Only tickers present in the security master are
resolved. Tickers of delisted companies are usually absent from ticker.txt; those keep industry = NaN and
fall back to the market benchmark (counted and reported).
Output: DERIVED_DIR/sector_map.parquet (ticker, cik, sic, ff49, ff49_name)
"""
from __future__ import annotations
import json, re, sys, time
import pandas as pd, requests
from config import DERIVED_DIR, FACTORS_DIR, SUBMISSIONS_JSON_DIR, SECURITY_MASTER, SEC_USER_AGENT, SEC_RATE_LIMIT_PER_SEC

def load_sic49() -> list[tuple[int, int, int, str]]:
    rows, cur, name = [], None, None
    for line in (FACTORS_DIR / "Siccodes49.txt").read_text().splitlines():
        m = re.match(r"^\s*(\d+)\s+(\w+)\s+(.*)$", line)
        if m and not line.startswith(" "):
            cur, name = int(m.group(1)), m.group(2); continue
        m2 = re.match(r"^\s*(\d{4})-(\d{4})", line)
        if m2 and cur:
            rows.append((int(m2.group(1)), int(m2.group(2)), cur, name))
    return rows

def sic_to_ff49(sic: int | None, table) -> tuple[int | None, str | None]:
    if sic is None or pd.isna(sic):
        return None, None
    for lo, hi, k, name in table:
        if lo <= int(sic) <= hi:
            return k, name
    return 49, "Other"

def main() -> None:
    if not SEC_USER_AGENT:
        sys.exit("set HK13F_SEC_CONTACT")
    tick = pd.read_csv(DERIVED_DIR.parent / "sec" / "ticker.txt", sep="\t", header=None, names=["ticker", "cik"], dtype=str)
    tick["ticker"] = tick["ticker"].str.upper().str.replace(".", "-", regex=False)
    sm = pd.read_parquet(SECURITY_MASTER)
    want = tick[tick["ticker"].isin(sm["ticker"].dropna().str.upper())].drop_duplicates("ticker")
    s = requests.Session(); s.headers["User-Agent"] = SEC_USER_AGENT
    cache = DERIVED_DIR / "sic_cache.json"
    sic = json.loads(cache.read_text()) if cache.exists() else {}
    todo = [c for c in want["cik"].unique() if c not in sic]
    print(f"{len(want)} tickers, {len(todo)} CIKs to fetch")
    for i, cik in enumerate(todo, 1):
        p = SUBMISSIONS_JSON_DIR / f"CIK{cik.zfill(10)}.json"
        try:
            if p.exists():
                d = json.loads(p.read_text())
            else:
                r = s.get(f"https://data.sec.gov/submissions/CIK{cik.zfill(10)}.json", timeout=60)
                time.sleep(1 / SEC_RATE_LIMIT_PER_SEC)
                if r.status_code != 200:
                    sic[cik] = None; continue
                d = r.json()
            sic[cik] = int(d["sic"]) if d.get("sic") else None
        except Exception:  # noqa: BLE001
            sic[cik] = None
        if i % 500 == 0:
            cache.write_text(json.dumps(sic)); print(f"  {i}/{len(todo)}")
    cache.write_text(json.dumps(sic))
    table = load_sic49()
    want["sic"] = want["cik"].map(sic)
    ff = want["sic"].apply(lambda x: sic_to_ff49(x, table))
    want["ff49"] = [a for a, _ in ff]; want["ff49_name"] = [b for _, b in ff]
    want.to_parquet(DERIVED_DIR / "sector_map.parquet", index=False)
    print(want["ff49_name"].value_counts().head(12).to_dict(), "unmapped:", want["sic"].isna().sum())

if __name__ == "__main__":
    main()
