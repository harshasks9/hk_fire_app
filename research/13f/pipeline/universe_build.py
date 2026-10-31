"""
Step 1c — Build data/universe.csv (one row per manager × SEC filing entity) from the analyst's decisions
in data/universe_decisions.csv and the filer evidence in the SEC tables. Every row links to EDGAR.
"""
from __future__ import annotations
from pathlib import Path
import duckdb, pandas as pd
from config import SEC_DB

def main() -> None:
    base = Path(__file__).resolve().parents[1] / "data"
    dec = pd.read_csv(base / "universe_decisions.csv", dtype=str)
    con = duckdb.connect(str(SEC_DB), read_only=True)
    rows = []
    for _, r in dec.iterrows():
        for cik in r["ciks"].split(";"):
            cik = cik.strip().zfill(10)
            ev = con.execute("""
                SELECT max(c.manager_name) AS entity_name, count(*) AS filings_13f_hr, min(s.period) AS first_period, max(s.period) AS last_period
                FROM submissions s JOIN coverpages c USING (ACCESSION_NUMBER) WHERE s.cik = ? AND s.form = '13F-HR'""", [cik]).df().iloc[0]
            rows.append({**r.to_dict(), "cik": cik, "entity_name": ev["entity_name"], "filings_13f_hr": int(ev["filings_13f_hr"]),
                         "first_period": ev["first_period"], "last_period": ev["last_period"],
                         "edgar_url": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={cik}&type=13F-HR&dateb=&owner=include&count=40"})
    u = pd.DataFrame(rows).drop(columns=["ciks"])
    u.to_csv(base / "universe.csv", index=False)
    a = u[u["universe_a"] == "1"]
    print(f"{u.manager_id.nunique()} managers / {len(u)} filing entities; Universe A = {a.manager_id.nunique()} managers, {len(a)} entities")
    print(u[u.filings_13f_hr == 0])

if __name__ == "__main__":
    main()
