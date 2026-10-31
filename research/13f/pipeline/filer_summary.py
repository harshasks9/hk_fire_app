"""
Step 7b — Per-filing summary statistics for EVERY 13F filer (the Universe B candidate pool).

For each original 13F-HR (all ~400k submissions): long-equity value, number of long equity positions,
top-10 weight, and — joined to the previous period's filing of the same CIK — counts of new positions
and full exits on CUSIP. Values are unit-corrected per filing with the same cross-sectional rule as
holdings_build.py, using the universe-wide median implied price per (period, CUSIP).

Output: DERIVED_DIR/filer_summary.parquet
"""
from __future__ import annotations
import duckdb, pandas as pd
from config import SEC_DB, SEC_PARQUET_DIR, DERIVED_DIR, VALUE_IN_DOLLARS_FROM

def main() -> None:
    con = duckdb.connect(str(SEC_DB), read_only=True)
    con.execute("PRAGMA threads=4"); con.execute("SET memory_limit='9GB'")
    con.execute(f"""
        CREATE TEMP TABLE orig AS
        SELECT cik, period, ACCESSION_NUMBER AS accession, filing_date,
               row_number() OVER (PARTITION BY cik, period ORDER BY filing_date, ACCESSION_NUMBER) AS rn
        FROM submissions WHERE form = '13F-HR'
    """)
    con.execute("DELETE FROM orig WHERE rn > 1")
    con.execute(f"""
        CREATE TEMP TABLE pos AS
        SELECT o.cik, o.period, o.accession, o.filing_date, i.CUSIP,
               SUM(CAST(i.VALUE AS DOUBLE)) * (CASE WHEN o.filing_date < DATE '{VALUE_IN_DOLLARS_FROM}' THEN 1000.0 ELSE 1.0 END) AS value,
               SUM(CAST(i.SSHPRNAMT AS DOUBLE)) AS shares
        FROM read_parquet('{SEC_PARQUET_DIR}/*.parquet') i JOIN orig o ON i.ACCESSION_NUMBER = o.accession
        WHERE i.SSHPRNAMTTYPE = 'SH' AND (i.PUTCALL IS NULL OR i.PUTCALL = '')
        GROUP BY 1,2,3,4,5
    """)
    # unit check per filing against the cross-sectional median implied price
    con.execute("""
        CREATE TEMP TABLE med AS
        SELECT period, CUSIP, median(value / shares) AS px_med FROM pos WHERE shares > 0 AND value > 0 GROUP BY 1,2
    """)
    con.execute("""
        CREATE TEMP TABLE unit AS
        SELECT accession, median(p.value / p.shares / m.px_med) AS ratio FROM pos p JOIN med m USING (period, CUSIP)
        WHERE p.shares > 0 AND p.value > 0 GROUP BY 1
    """)
    con.execute("""
        CREATE TEMP TABLE pos2 AS
        SELECT p.*, p.value * (CASE WHEN u.ratio BETWEEN 0.0005 AND 0.005 THEN 1000.0 WHEN u.ratio BETWEEN 200 AND 5000 THEN 0.001 ELSE 1.0 END) AS value_fixed,
               (CASE WHEN u.ratio BETWEEN 0.0005 AND 0.005 THEN 1000.0 WHEN u.ratio BETWEEN 200 AND 5000 THEN 0.001 ELSE 1.0 END) AS unit_fix
        FROM pos p LEFT JOIN unit u USING (accession)
    """)
    con.execute("""
        CREATE TEMP TABLE agg AS
        SELECT cik, period, accession, filing_date, max(unit_fix) AS unit_fix,
               SUM(value_fixed) AS long_value, COUNT(*) AS n_positions,
               SUM(CASE WHEN rk <= 10 THEN value_fixed END) / NULLIF(SUM(value_fixed), 0) AS top10_weight,
               MAX(value_fixed) / NULLIF(SUM(value_fixed), 0) AS top1_weight
        FROM (SELECT *, row_number() OVER (PARTITION BY accession ORDER BY value_fixed DESC) AS rk FROM pos2)
        GROUP BY 1,2,3,4
    """)
    # new / exit counts versus the same CIK's previous-period original filing
    con.execute("""
        CREATE TEMP TABLE periods AS SELECT DISTINCT period FROM orig ORDER BY period
    """)
    con.execute("""
        CREATE TEMP TABLE prevmap AS
        SELECT period, lag(period) OVER (ORDER BY period) AS prev_period FROM periods
    """)
    con.execute("""
        CREATE TEMP TABLE chg AS
        SELECT a.cik, a.period,
               SUM(CASE WHEN b.CUSIP IS NULL THEN 1 ELSE 0 END) AS n_new,
               SUM(CASE WHEN a.CUSIP IS NULL THEN 1 ELSE 0 END) AS n_exit
        FROM (SELECT p.cik, p.period, p.CUSIP, pm.prev_period FROM pos2 p JOIN prevmap pm USING (period)) a
        FULL OUTER JOIN (SELECT cik, period AS prev_period, CUSIP FROM pos2) b
          ON a.cik = b.cik AND a.prev_period = b.prev_period AND a.CUSIP = b.CUSIP
        WHERE a.cik IS NOT NULL OR b.cik IS NOT NULL
        GROUP BY 1,2
    """)
    con.execute(f"""
        COPY (
          SELECT g.*, c.n_new, c.n_exit,
                 EXISTS (SELECT 1 FROM orig o2 JOIN prevmap pm ON pm.period = g.period WHERE o2.cik = g.cik AND o2.period = pm.prev_period) AS prev_filed
          FROM agg g LEFT JOIN chg c ON c.cik = g.cik AND c.period = g.period
        ) TO '{DERIVED_DIR / "filer_summary.parquet"}' (FORMAT PARQUET, COMPRESSION ZSTD)
    """)
    s = pd.read_parquet(DERIVED_DIR / "filer_summary.parquet")
    print(f"{len(s):,} original filings, {s.cik.nunique():,} filers, periods {s.period.min()} → {s.period.max()}")

if __name__ == "__main__":
    main()
