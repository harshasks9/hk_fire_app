"""
Step 1 — Download every SEC Form 13F structured data set archive.

Source index: https://www.sec.gov/data-research/sec-markets-data/form-13f-data-sets
Archives are named by filing-date window (2013q2 … 2023q4 quarterly, then 01mar2024-31may2024 … style).
A window contains every 13F-HR / 13F-HR/A / 13F-NT accepted in that window, for every filer.

Requires HK13F_SEC_CONTACT="Name email@domain" (SEC fair-access policy). Idempotent.
"""
from __future__ import annotations
import re, sys, time
import requests
from config import SEC_ZIP_DIR, SEC_USER_AGENT

INDEX = "https://www.sec.gov/data-research/sec-markets-data/form-13f-data-sets"

def main() -> None:
    if not SEC_USER_AGENT:
        sys.exit("set HK13F_SEC_CONTACT to 'Name email@domain' — SEC refuses undeclared automated clients")
    s = requests.Session()
    s.headers["User-Agent"] = SEC_USER_AGENT
    html = s.get(INDEX, timeout=60).text
    paths = sorted(set(re.findall(r'href="(/files/[^"]*form13f\.zip)"', html)))
    print(f"{len(paths)} archives listed")
    for p in paths:
        out = SEC_ZIP_DIR / p.rsplit("/", 1)[-1]
        if out.exists() and out.stat().st_size > 0:
            continue
        r = s.get("https://www.sec.gov" + p, timeout=900)
        r.raise_for_status()
        out.write_bytes(r.content)
        print(f"{out.name}: {len(r.content)/1e6:.1f} MB")
        time.sleep(0.5)

if __name__ == "__main__":
    main()
