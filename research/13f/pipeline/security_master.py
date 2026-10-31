"""
Step 4 — Security master: CUSIP → (ticker, name, security type) via OpenFIGI, plus the SEC CIK→ticker file.

13F INFOTABLE rows identify securities by CUSIP (and, since 2023, optionally FIGI) — never by ticker.
OpenFIGI's public mapping endpoint resolves a CUSIP to the current listed ticker and share class.
Limits without an API key: 25 requests/min, 10 identifiers per request (OPENFIGI_API_KEY lifts this).

Caveats recorded in the output:
  * OpenFIGI returns the *current* ticker; historical ticker changes are reconciled against the price
    vendor's symbol history in prices.py, and CUSIP changes (mergers, reorganisations) are chained in
    corporate_actions.py from the 13F issuer-name continuity + price-vendor metadata.
  * Non-equity rows (PRN principal amounts, options, warrants, ETFs, ADRs) are typed, not dropped,
    so the signal layer can decide what to include.
"""
from __future__ import annotations
import os, time, json
import pandas as pd
import requests
from config import SECURITY_MASTER, DERIVED_DIR

URL = "https://api.openfigi.com/v3/mapping"
KEY = os.environ.get("OPENFIGI_API_KEY", "")
BATCH = 100 if KEY else 10
PER_MIN = 250 if KEY else 25

def map_cusips(cusips: list[str]) -> pd.DataFrame:
    cache = DERIVED_DIR / "openfigi_cache.jsonl"
    seen: dict[str, list] = {}
    if cache.exists():
        for line in cache.read_text().splitlines():
            d = json.loads(line); seen[d["cusip"]] = d["data"]
    todo = [c for c in dict.fromkeys(cusips) if c not in seen]
    print(f"{len(seen):,} cached, {len(todo):,} to map")
    s = requests.Session(); s.headers["Content-Type"] = "application/json"
    if KEY: s.headers["X-OPENFIGI-APIKEY"] = KEY
    with cache.open("a") as fh:
        for i in range(0, len(todo), BATCH):
            chunk = todo[i:i + BATCH]
            body = [{"idType": "ID_CUSIP", "idValue": c, "exchCode": "US"} for c in chunk]
            for attempt in range(5):
                r = s.post(URL, data=json.dumps(body), timeout=60)
                if r.status_code == 429:
                    time.sleep(65); continue
                r.raise_for_status(); break
            for c, res in zip(chunk, r.json()):
                data = res.get("data", [])
                seen[c] = data
                fh.write(json.dumps({"cusip": c, "data": data}) + "\n")
            time.sleep(60 / PER_MIN + 0.1)
    rows = []
    for c, data in seen.items():
        if not data:
            rows.append({"cusip": c, "ticker": None, "figi_name": None, "security_type": None, "market_sector": None, "composite_figi": None, "mapped": False})
            continue
        d = data[0]
        rows.append({"cusip": c, "ticker": d.get("ticker"), "figi_name": d.get("name"), "security_type": d.get("securityType"),
                     "market_sector": d.get("marketSector"), "composite_figi": d.get("compositeFIGI"), "mapped": True})
    return pd.DataFrame(rows)

def main() -> None:
    cusips = pd.read_parquet(DERIVED_DIR / "universe_cusips.parquet")["CUSIP"].dropna().unique().tolist()
    sm = map_cusips(cusips)
    sm.to_parquet(SECURITY_MASTER, index=False)
    print(sm["mapped"].value_counts().to_dict(), sm["security_type"].value_counts().head(10).to_dict())

if __name__ == "__main__":
    main()
