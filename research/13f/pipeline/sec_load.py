"""
Step 2 — Load the SEC Form 13F structured data sets into a point-in-time store.

Input : the quarterly archives in SEC_ZIP_DIR (see sec_download.py).
Output: SEC_PARQUET_DIR/<archive>.parquet   every INFOTABLE row of every filer, with ACCESSION_NUMBER
        SEC_DB (DuckDB)                     submission, coverpage, summarypage, othermanager tables

Nothing is filtered at this stage: Universe B (the point-in-time manager universe) needs every filer's
cover page and summary page, and the holdings of managers who are not in today's top 100.

Run:  python sec_load.py            (idempotent: archives already loaded are skipped)
"""
from __future__ import annotations
import sys, zipfile, tempfile, shutil
from pathlib import Path
import duckdb
from config import SEC_ZIP_DIR, SEC_PARQUET_DIR, SEC_DB

SMALL_TABLES = ["SUBMISSION", "COVERPAGE", "SUMMARYPAGE", "OTHERMANAGER", "OTHERMANAGER2", "SIGNATURE"]

DDL = {
    "submission": "ACCESSION_NUMBER VARCHAR, FILING_DATE DATE, SUBMISSIONTYPE VARCHAR, CIK VARCHAR, PERIODOFREPORT DATE, ARCHIVE VARCHAR",
}

def archive_key(zip_path: Path) -> str:
    return zip_path.stem.replace("_form13f", "")

def load_archive(con: duckdb.DuckDBPyConnection, zip_path: Path) -> None:
    key = archive_key(zip_path)
    out = SEC_PARQUET_DIR / f"{key}.parquet"
    done = con.execute("SELECT count(*) FROM loaded_archives WHERE archive = ?", [key]).fetchone()[0]
    if done and out.exists():
        print(f"skip {key}")
        return
    tmp = Path(tempfile.mkdtemp(prefix="sec13f_"))
    try:
        with zipfile.ZipFile(zip_path) as z:
            if z.testzip() is not None:
                raise zipfile.BadZipFile(f"{zip_path.name} failed integrity test")
            z.extractall(tmp)
        # Archives name their tables in upper case; be tolerant of a nested folder or case change.
        found = {f.name.upper(): f for f in tmp.rglob("*.tsv")}
        if "INFOTABLE.TSV" not in found:
            raise FileNotFoundError(f"{zip_path.name}: no INFOTABLE.tsv in {sorted(found)}")
        # INFOTABLE → Parquet, one file per archive. Values are kept exactly as reported (unit fix happens downstream).
        con.execute(f"""
            COPY (
              SELECT ACCESSION_NUMBER, INFOTABLE_SK, NAMEOFISSUER, TITLEOFCLASS, CUSIP, FIGI,
                     CAST(VALUE AS DOUBLE) AS VALUE, CAST(SSHPRNAMT AS DOUBLE) AS SSHPRNAMT, SSHPRNAMTTYPE,
                     PUTCALL, INVESTMENTDISCRETION, OTHERMANAGER,
                     CAST(VOTING_AUTH_SOLE AS DOUBLE) AS VOTING_AUTH_SOLE,
                     CAST(VOTING_AUTH_SHARED AS DOUBLE) AS VOTING_AUTH_SHARED,
                     CAST(VOTING_AUTH_NONE AS DOUBLE) AS VOTING_AUTH_NONE,
                     '{key}' AS ARCHIVE
              FROM read_csv('{found["INFOTABLE.TSV"]}', delim='\t', header=true, quote='', escape='',
                            all_varchar=true, ignore_errors=false, max_line_size=4000000)
            ) TO '{out}' (FORMAT PARQUET, COMPRESSION ZSTD)
        """)
        for t in SMALL_TABLES:
            f = found.get(f"{t}.TSV")
            if f is None:
                continue
            tbl = t.lower()
            con.execute(f"""
                CREATE TABLE IF NOT EXISTS {tbl} AS
                SELECT *, '{key}' AS ARCHIVE FROM read_csv('{f}', delim='\t', header=true, quote='', escape='',
                       all_varchar=true, max_line_size=4000000) LIMIT 0
            """)
            con.execute(f"""
                INSERT INTO {tbl} BY NAME
                SELECT *, '{key}' AS ARCHIVE FROM read_csv('{f}', delim='\t', header=true, quote='', escape='',
                       all_varchar=true, max_line_size=4000000)
            """)
        con.execute("INSERT INTO loaded_archives VALUES (?, now())", [key])
        n = con.execute(f"SELECT count(*) FROM read_parquet('{out}')").fetchone()[0]
        print(f"loaded {key}: {n:,} holdings rows")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

def main() -> None:
    con = duckdb.connect(str(SEC_DB))
    con.execute("CREATE TABLE IF NOT EXISTS loaded_archives (archive VARCHAR, loaded_at TIMESTAMP)")
    zips = sorted(SEC_ZIP_DIR.glob("*.zip"), key=lambda p: p.stat().st_mtime)
    if not zips:
        sys.exit(f"no archives in {SEC_ZIP_DIR}; run sec_download.py first")
    for z in zips:
        try:
            load_archive(con, z)
        except zipfile.BadZipFile:
            print(f"BAD ZIP {z.name} — re-download")
    # Typed views over the raw text tables
    con.execute("""
        CREATE OR REPLACE VIEW submissions AS
        SELECT ACCESSION_NUMBER, strptime(FILING_DATE, '%d-%b-%Y')::DATE AS filing_date, SUBMISSIONTYPE AS form,
               CIK AS cik, strptime(PERIODOFREPORT, '%d-%b-%Y')::DATE AS period, ARCHIVE AS archive
        FROM submission
    """)
    con.execute("""
        CREATE OR REPLACE VIEW coverpages AS
        SELECT ACCESSION_NUMBER, strptime(REPORTCALENDARORQUARTER, '%d-%b-%Y')::DATE AS period,
               ISAMENDMENT = 'Y' AS is_amendment, TRY_CAST(AMENDMENTNO AS INTEGER) AS amendment_no, AMENDMENTTYPE AS amendment_type,
               CONFDENIEDEXPIRED = 'Y' AS conf_denied_expired, FILINGMANAGER_NAME AS manager_name,
               FILINGMANAGER_CITY AS city, FILINGMANAGER_STATEORCOUNTRY AS state, REPORTTYPE AS report_type, ARCHIVE AS archive
        FROM coverpage
    """)
    con.execute("""
        CREATE OR REPLACE VIEW summarypages AS
        SELECT ACCESSION_NUMBER, TRY_CAST(OTHERINCLUDEDMANAGERSCOUNT AS INTEGER) AS other_managers,
               TRY_CAST(TABLEENTRYTOTAL AS INTEGER) AS entries, TRY_CAST(TABLEVALUETOTAL AS DOUBLE) AS table_value,
               ISCONFIDENTIALOMITTED = 'Y' AS confidential_omitted, ARCHIVE AS archive
        FROM summarypage
    """)
    print(con.execute("SELECT count(*) AS filings, min(filing_date), max(filing_date) FROM submissions").fetchall())

if __name__ == "__main__":
    main()
