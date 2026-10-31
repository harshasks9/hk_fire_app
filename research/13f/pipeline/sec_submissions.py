"""
Step 3 — Acceptance timestamps for every filing of every universe manager.

The structured data sets carry FILING_DATE only. The earliest moment a 13F was publicly available is its
EDGAR *acceptance* timestamp (filings accepted after 17:30 ET are disseminated the next business day;
filings accepted after 22:00 ET carry the next day's filing date). data.sec.gov/submissions/CIK##########.json
lists every filing of a CIK with acceptanceDateTime, form, accession number and report period.

Output: SUBMISSIONS_JSON_DIR/CIK##########.json (raw, as fetched — point-in-time evidence)
        DERIVED_DIR/filing_acceptance.parquet  (cik, accession, form, filing_date, acceptance_ts_et, period)
"""
from __future__ import annotations
import json, sys, time
from pathlib import Path
import pandas as pd
import requests
from config import SUBMISSIONS_JSON_DIR, DERIVED_DIR, SEC_USER_AGENT, SEC_RATE_LIMIT_PER_SEC

def fetch(session: requests.Session, cik: str) -> dict:
    cik10 = cik.zfill(10)
    out = SUBMISSIONS_JSON_DIR / f"CIK{cik10}.json"
    if out.exists():
        return json.loads(out.read_text())
    r = session.get(f"https://data.sec.gov/submissions/CIK{cik10}.json", timeout=60)
    r.raise_for_status()
    out.write_text(r.text)
    time.sleep(1 / SEC_RATE_LIMIT_PER_SEC)
    d = r.json()
    # older filings are paged into separate files
    for extra in d.get("filings", {}).get("files", []):
        name = extra["name"]
        p = SUBMISSIONS_JSON_DIR / name
        if not p.exists():
            rr = session.get(f"https://data.sec.gov/submissions/{name}", timeout=60)
            rr.raise_for_status()
            p.write_text(rr.text)
            time.sleep(1 / SEC_RATE_LIMIT_PER_SEC)
    return d

def frame(cik: str, d: dict) -> pd.DataFrame:
    parts = [pd.DataFrame(d["filings"]["recent"])]
    for extra in d.get("filings", {}).get("files", []):
        parts.append(pd.DataFrame(json.loads((SUBMISSIONS_JSON_DIR / extra["name"]).read_text())))
    f = pd.concat(parts, ignore_index=True)
    f = f[f["form"].str.startswith("13F")].copy()
    f["cik"] = cik.zfill(10)
    f["acceptance_ts_et"] = pd.to_datetime(f["acceptanceDateTime"]).dt.tz_localize(None)
    f["filing_date"] = pd.to_datetime(f["filingDate"])
    f["period"] = pd.to_datetime(f["reportDate"], errors="coerce")
    return f[["cik", "accessionNumber", "form", "filing_date", "acceptance_ts_et", "period"]].rename(columns={"accessionNumber": "accession"})

def main(ciks: list[str]) -> pd.DataFrame:
    if not SEC_USER_AGENT:
        sys.exit("set HK13F_SEC_CONTACT")
    s = requests.Session(); s.headers["User-Agent"] = SEC_USER_AGENT
    frames = []
    for cik in ciks:
        try:
            frames.append(frame(cik, fetch(s, cik)))
        except Exception as e:  # noqa: BLE001
            print(f"CIK {cik}: {e}")
    out = pd.concat(frames, ignore_index=True)
    out.to_parquet(DERIVED_DIR / "filing_acceptance.parquet", index=False)
    print(f"{len(out):,} 13F filings with acceptance timestamps for {out.cik.nunique()} CIKs")
    return out

if __name__ == "__main__":
    universe = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "universe.csv", dtype=str)
    main(sorted(set(universe["cik"].dropna())))
