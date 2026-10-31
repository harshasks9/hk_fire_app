"""
Paths and constants shared by every pipeline step.

Large raw and derived data live outside the git tree (DATA_ROOT); the repo carries the
code, the data dictionaries, the manager universe, and the small summary outputs.
Override DATA_ROOT with the HK13F_DATA environment variable.
"""
from __future__ import annotations
import os
from pathlib import Path

REPO_DIR = Path(__file__).resolve().parents[1]
DATA_ROOT = Path(os.environ.get("HK13F_DATA", REPO_DIR / "data")).resolve()

SEC_ZIP_DIR = DATA_ROOT / "sec" / "zips"            # the 54 quarterly archives, as downloaded
SEC_PARQUET_DIR = DATA_ROOT / "sec" / "infotable"   # one Parquet file per archive, all filers
SEC_DB = DATA_ROOT / "sec" / "sec13f.duckdb"        # submissions, cover pages, summary pages, other managers
SUBMISSIONS_JSON_DIR = DATA_ROOT / "sec" / "submissions"  # data.sec.gov per-CIK JSON (acceptance timestamps)
SECURITY_MASTER = DATA_ROOT / "security_master.parquet"
PRICES_DIR = DATA_ROOT / "prices"
FACTORS_DIR = DATA_ROOT / "factors"
DERIVED_DIR = DATA_ROOT / "derived"
OUTPUT_DIR = REPO_DIR / "outputs"

# SEC fair-access policy: every request must carry a User-Agent naming a contact.
# Set HK13F_SEC_CONTACT to "Name email@domain"; the pipeline refuses to run against sec.gov without it.
SEC_USER_AGENT = os.environ.get("HK13F_SEC_CONTACT", "")
SEC_RATE_LIMIT_PER_SEC = 8      # SEC allows 10/s; stay under it

TIINGO_TOKEN = os.environ.get("TIINGO_TOKEN", "")

# The SEC changed the VALUE unit from thousands of dollars to dollars for filings accepted on/after 2023-01-03.
VALUE_IN_DOLLARS_FROM = "2023-01-03"

# Research window
FIRST_PERIOD = "2013-03-31"
EXECUTION_LAG_SESSIONS = 1      # trade on the next session after the filing's acceptance timestamp

for d in (SEC_ZIP_DIR, SEC_PARQUET_DIR, SUBMISSIONS_JSON_DIR, PRICES_DIR, FACTORS_DIR, DERIVED_DIR, OUTPUT_DIR):
    d.mkdir(parents=True, exist_ok=True)
