"""
Step 1b — Resolve the draft manager universe to SEC filing entities (CIKs).

For each draft row, search every 13F cover page ever filed (all filers, all archives) for the search
name, and report the candidate CIKs with their filing counts, first/last period and latest portfolio
value. The analyst then confirms the mapping in data/universe.csv (one row per manager-entity; a manager
may map to several CIKs over time — e.g. Elliott Management Corp → Elliott Investment Management L.P.).
"""
from __future__ import annotations
import sys
from pathlib import Path
import duckdb, pandas as pd
from config import SEC_DB

def main(draft: Path, out: Path) -> None:
    con = duckdb.connect(str(SEC_DB), read_only=True)
    d = pd.read_csv(draft).dropna(subset=["search_name"])
    rows = []
    for _, r in d.iterrows():
        pat = r["search_name"].upper().replace("&", "&")
        cands = con.execute("""
            SELECT s.cik, max(c.manager_name) AS name, count(*) AS filings,
                   min(s.period) AS first_period, max(s.period) AS last_period,
                   max(CASE WHEN s.period = (SELECT max(period) FROM submissions s2 WHERE s2.cik = s.cik) THEN p.table_value END) AS last_value
            FROM submissions s JOIN coverpages c USING (ACCESSION_NUMBER) LEFT JOIN summarypages p USING (ACCESSION_NUMBER)
            WHERE upper(c.manager_name) LIKE '%' || ? || '%' AND s.form = '13F-HR'
            GROUP BY s.cik ORDER BY filings DESC, last_value DESC NULLS LAST LIMIT 6
        """, [pat]).df()
        if cands.empty:
            rows.append({"manager": r["manager"], "search_name": r["search_name"], "cik": None, "entity_name": None, "filings": 0})
        for _, c in cands.iterrows():
            rows.append({"manager": r["manager"], "search_name": r["search_name"], "category": r["category"], "cik": c["cik"],
                         "entity_name": c["name"], "filings": int(c["filings"]), "first_period": c["first_period"],
                         "last_period": c["last_period"], "last_value": c["last_value"]})
    res = pd.DataFrame(rows)
    res.to_csv(out, index=False)
    print(res.to_string(max_rows=400, max_colwidth=48))

if __name__ == "__main__":
    base = Path(__file__).resolve().parents[1] / "data"
    main(base / "universe_draft.csv", base / "universe_candidates.csv")
