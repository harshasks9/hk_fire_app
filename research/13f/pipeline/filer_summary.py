"""
Step 7b — Per-filing summary statistics for EVERY 13F filer (the Universe B candidate pool).

For each original 13F-HR (earliest-filed 13F-HR per CIK and period, ~390k filings): long-equity value,
number of long equity positions, top-10 and top-1 weight, and — against the same CIK's previous-period
original — counts of new positions and full exits on CUSIP. Values are unit-corrected per filing with
the cross-sectional median-implied-price rule used in holdings_build.py.

Memory discipline: the ~150M INFOTABLE rows are reduced period by period to a (cik, CUSIP) position
table on disk; nothing larger than one period's positions is held at once.
Output: DERIVED_DIR/filer_summary.parquet
"""
from __future__ import annotations
import duckdb, pandas as pd
from config import SEC_DB, SEC_PARQUET_DIR, DERIVED_DIR, VALUE_IN_DOLLARS_FROM

POS_DIR = DERIVED_DIR / "filer_positions"; POS_DIR.mkdir(exist_ok=True)

def main() -> None:
    con = duckdb.connect(str(SEC_DB), read_only=True)
    con.execute("PRAGMA threads=3"); con.execute("SET memory_limit='6GB'"); con.execute(f"SET temp_directory='{DERIVED_DIR / 'tmp'}'")
    con.execute("""
        CREATE TEMP TABLE orig AS
        SELECT cik, period, ACCESSION_NUMBER AS accession, filing_date, archive FROM (
          SELECT *, row_number() OVER (PARTITION BY cik, period ORDER BY filing_date, ACCESSION_NUMBER) AS rn
          FROM submissions WHERE form = '13F-HR') WHERE rn = 1
    """)
    periods = [r[0] for r in con.execute("SELECT DISTINCT period FROM orig ORDER BY period").fetchall()]
    for p in periods:
        out = POS_DIR / f"{p}.parquet"
        if out.exists():
            continue
        archives = [r[0] for r in con.execute("SELECT DISTINCT archive FROM orig WHERE period = ?", [p]).fetchall()]
        files = ", ".join(f"'{SEC_PARQUET_DIR / (a + '.parquet')}'" for a in archives)
        con.execute(f"""
            COPY (
              WITH pos AS (
                SELECT o.cik, o.accession, o.filing_date, i.CUSIP,
                       SUM(CAST(i.VALUE AS DOUBLE)) * (CASE WHEN o.filing_date < DATE '{VALUE_IN_DOLLARS_FROM}' THEN 1000.0 ELSE 1.0 END) AS value,
                       SUM(CAST(i.SSHPRNAMT AS DOUBLE)) AS shares
                FROM read_parquet([{files}]) i JOIN orig o ON i.ACCESSION_NUMBER = o.accession
                WHERE o.period = DATE '{p}' AND i.SSHPRNAMTTYPE = 'SH' AND (i.PUTCALL IS NULL OR i.PUTCALL = '')
                GROUP BY 1,2,3,4),
              med AS (SELECT CUSIP, median(value / shares) AS px_med FROM pos WHERE shares > 0 AND value > 0 GROUP BY 1),
              unit AS (SELECT accession, median(p.value / p.shares / m.px_med) AS ratio FROM pos p JOIN med m USING (CUSIP) WHERE p.shares > 0 AND p.value > 0 GROUP BY 1)
              SELECT p.cik, p.accession, p.filing_date, DATE '{p}' AS period, p.CUSIP, p.shares,
                     p.value * (CASE WHEN u.ratio BETWEEN 0.0005 AND 0.005 THEN 1000.0 WHEN u.ratio BETWEEN 200 AND 5000 THEN 0.001 ELSE 1.0 END) AS value,
                     (CASE WHEN u.ratio BETWEEN 0.0005 AND 0.005 THEN 1000.0 WHEN u.ratio BETWEEN 200 AND 5000 THEN 0.001 ELSE 1.0 END) AS unit_fix
              FROM pos p LEFT JOIN unit u USING (accession)
            ) TO '{out}' (FORMAT PARQUET, COMPRESSION ZSTD)
        """)
        print(p, flush=True)
    # summaries and new/exit counts, period by period against the previous period's positions
    rows = []
    prev = None
    for p in periods:
        cur = pd.read_parquet(POS_DIR / f"{p}.parquet")
        cur = cur.sort_values(["accession", "value"], ascending=[True, False])
        cur["rk"] = cur.groupby("accession").cumcount() + 1
        agg = cur.groupby(["cik", "accession", "filing_date", "period"]).agg(
            unit_fix=("unit_fix", "max"), long_value=("value", "sum"), n_positions=("CUSIP", "size"),
            top10_value=("value", lambda s: s.head(10).sum()), top1_value=("value", "max")).reset_index()
        agg["top10_weight"] = agg["top10_value"] / agg["long_value"]; agg["top1_weight"] = agg["top1_value"] / agg["long_value"]
        if prev is not None:
            ck = cur[["cik", "CUSIP"]].drop_duplicates(); pk = prev[["cik", "CUSIP"]].drop_duplicates()
            new = ck.merge(pk, how="left", indicator=True); n_new = new[new["_merge"] == "left_only"].groupby("cik").size()
            ex = pk.merge(ck, how="left", indicator=True); n_exit = ex[ex["_merge"] == "left_only"].groupby("cik").size()
            agg["n_new"] = agg["cik"].map(n_new).fillna(0); agg["n_exit"] = agg["cik"].map(n_exit).fillna(0)
            agg["prev_filed"] = agg["cik"].isin(pk["cik"])
            # exits only count when the filer filed the previous period; new only when it did
            agg.loc[~agg["prev_filed"], ["n_new", "n_exit"]] = float("nan")
        else:
            agg["n_new"] = float("nan"); agg["n_exit"] = float("nan"); agg["prev_filed"] = False
        rows.append(agg.drop(columns=["top10_value", "top1_value"]))
        prev = cur
    s = pd.concat(rows, ignore_index=True)
    s.to_parquet(DERIVED_DIR / "filer_summary.parquet", index=False)
    print(f"{len(s):,} original filings, {s.cik.nunique():,} filers, periods {s.period.min()} → {s.period.max()}")

if __name__ == "__main__":
    main()
