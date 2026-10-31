"""
Step 7 — The normalised manager–security–quarter dataset (point-in-time).

For every universe CIK and every report period:
  * the ORIGINAL snapshot = the earliest-accepted 13F-HR for that (cik, period). This is what an outside
    investor could first see, and it is the only version that generates signals.
  * later 13F-HR for the same period, and every 13F-HR/A (RESTATEMENT or NEW HOLDINGS), are kept as
    amendment events with their own acceptance timestamps, and the original rows carry `amended_later`.
  * rows are aggregated to one line per (filing, CUSIP, put/call flag): the SEC table splits a position
    across investment-discretion / other-manager lines, which are not separate positions.
  * VALUE is converted to dollars. Filings accepted before 2023-01-03 reported thousands. After that date a
    minority of filers kept reporting thousands for a while; the unit of each filing is checked against the
    cross-sectional median implied price (value / shares) of the same CUSIPs in the same period and
    corrected when it is off by a factor of ~1000 (logged in filings.unit_fix).
  * portfolio weight = value / total long equity value of the filing (PUTCALL empty, SSHPRNAMTTYPE = SH).
  * quarter-over-quarter change compares split-adjusted shares with the previous period's ORIGINAL snapshot.
    Split adjustment uses the price vendor's split factors (splits.parquet, from prices.py) when present;
    until then, `shares_prev_raw` is kept and `split_suspect` flags changes that look like 2:1 … 50:1 splits.
Outputs: DERIVED_DIR/filings.parquet, DERIVED_DIR/holdings.parquet, DERIVED_DIR/universe_cusips.parquet
"""
from __future__ import annotations
from pathlib import Path
import numpy as np, pandas as pd, duckdb
from config import SEC_DB, SEC_PARQUET_DIR, DERIVED_DIR, VALUE_IN_DOLLARS_FROM, PRICES_DIR

ROUND_SPLITS = np.array([2, 3, 4, 5, 6, 7, 8, 10, 15, 20, 25, 30, 40, 50, 1/2, 1/3, 1/4, 1/5, 1/6, 1/8, 1/10, 1/15, 1/20, 1/25, 1/50, 3/2, 4/3, 5/4, 2/3, 3/4, 4/5])

def load_filings(con, ciks: list[str]) -> pd.DataFrame:
    acc = pd.read_parquet(DERIVED_DIR / "filing_acceptance.parquet")
    sub = con.execute("""
        SELECT s.ACCESSION_NUMBER AS accession, s.cik, s.form, s.filing_date, s.period, s.archive,
               c.is_amendment, c.amendment_no, c.amendment_type, c.manager_name, c.conf_denied_expired,
               p.entries, p.table_value, p.confidential_omitted, p.other_managers
        FROM submissions s LEFT JOIN coverpages c USING (ACCESSION_NUMBER) LEFT JOIN summarypages p USING (ACCESSION_NUMBER)
        WHERE s.cik IN (SELECT UNNEST(?)) AND s.form IN ('13F-HR', '13F-HR/A')
    """, [ciks]).df()
    sub["period"] = pd.to_datetime(sub["period"]); sub["filing_date"] = pd.to_datetime(sub["filing_date"])
    f = sub.merge(acc[["accession", "acceptance_ts_et"]], on="accession", how="left")
    # Fallback when data.sec.gov lacks a timestamp: assume end of the filing day (conservative for the trader).
    f["acceptance_fallback"] = f["acceptance_ts_et"].isna()
    f["acceptance_ts_et"] = f["acceptance_ts_et"].fillna(f["filing_date"] + pd.Timedelta(hours=23, minutes=59))
    # Earliest-accepted 13F-HR per (cik, period) is the original snapshot.
    f = f.sort_values(["cik", "period", "acceptance_ts_et"])
    orig = f[f["form"] == "13F-HR"].groupby(["cik", "period"]).head(1)["accession"]
    f["is_original"] = f["accession"].isin(orig)
    f["amended_later"] = False
    g = f.groupby(["cik", "period"])["accession"].transform("count")
    f.loc[f["is_original"] & (g > 1), "amended_later"] = True
    return f

def load_rows(con, accessions: list[str]) -> pd.DataFrame:
    return con.execute(f"""
        SELECT ACCESSION_NUMBER AS accession, NAMEOFISSUER AS issuer, TITLEOFCLASS AS class, CUSIP, FIGI,
               SUM(VALUE) AS value_raw, SUM(SSHPRNAMT) AS shares, MAX(SSHPRNAMTTYPE) AS amt_type,
               COALESCE(NULLIF(PUTCALL, ''), '') AS putcall, COUNT(*) AS lines,
               SUM(VOTING_AUTH_SOLE) AS vote_sole, SUM(VOTING_AUTH_SHARED) AS vote_shared, SUM(VOTING_AUTH_NONE) AS vote_none
        FROM read_parquet('{SEC_PARQUET_DIR}/*.parquet')
        WHERE ACCESSION_NUMBER IN (SELECT UNNEST(?))
        GROUP BY ACCESSION_NUMBER, NAMEOFISSUER, TITLEOFCLASS, CUSIP, FIGI, COALESCE(NULLIF(PUTCALL, ''), '')
    """, [accessions]).df()

def fix_units(rows: pd.DataFrame, filings: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    r = rows.merge(filings[["accession", "filing_date", "period"]], on="accession")
    r["value"] = np.where(r["filing_date"] < pd.Timestamp(VALUE_IN_DOLLARS_FROM), r["value_raw"] * 1000.0, r["value_raw"])
    eq = r[(r["amt_type"] == "SH") & (r["putcall"] == "") & (r["shares"] > 0)].copy()
    eq["px"] = eq["value"] / eq["shares"]
    med = eq.groupby(["period", "CUSIP"])["px"].median().rename("px_med")
    eq = eq.join(med, on=["period", "CUSIP"])
    eq["ratio"] = eq["px"] / eq["px_med"]
    per_filing = eq.groupby("accession")["ratio"].median()
    fix = pd.Series(1.0, index=per_filing.index)
    fix[(per_filing > 0.0005) & (per_filing < 0.005)] = 1000.0      # still reporting thousands after the switch
    fix[(per_filing > 200) & (per_filing < 5000)] = 0.001           # reported dollars before the switch
    r["unit_fix"] = r["accession"].map(fix).fillna(1.0)
    r["value"] = r["value"] * r["unit_fix"]
    filings = filings.merge(r.groupby("accession")["unit_fix"].first().rename("unit_fix"), on="accession", how="left")
    return r, filings

def main() -> None:
    con = duckdb.connect(str(SEC_DB), read_only=True)
    universe = pd.read_csv(Path(__file__).resolve().parents[1] / "data" / "universe.csv", dtype=str)
    ciks = sorted(set(universe["cik"].dropna().str.zfill(10)))
    filings = load_filings(con, ciks)
    rows = load_rows(con, filings["accession"].tolist())
    rows, filings = fix_units(rows, filings)
    rows["is_equity_long"] = (rows["amt_type"] == "SH") & (rows["putcall"] == "")
    tot = rows[rows["is_equity_long"]].groupby("accession")["value"].sum().rename("long_equity_value")
    rows = rows.join(tot, on="accession")
    rows["weight"] = np.where(rows["is_equity_long"], rows["value"] / rows["long_equity_value"], np.nan)
    rows = rows.merge(filings[["accession", "cik", "form", "is_original", "amended_later", "acceptance_ts_et", "manager_name"]], on="accession")

    # Quarter-over-quarter on ORIGINAL snapshots only, long equity only.
    o = rows[rows["is_original"] & rows["is_equity_long"]].copy()
    o = o.sort_values(["cik", "CUSIP", "period"])
    periods = sorted(o["period"].unique())
    prev_period = {p: (periods[i - 1] if i else pd.NaT) for i, p in enumerate(periods)}
    o["prev_period_expected"] = o["period"].map(prev_period)
    key = o[["cik", "CUSIP", "period", "shares", "value", "weight"]].rename(columns={"shares": "shares_prev_raw", "value": "value_prev", "weight": "weight_prev", "period": "prev_period_expected"})
    o = o.merge(key, on=["cik", "CUSIP", "prev_period_expected"], how="left")
    # Did the manager file an original for the previous period at all? (otherwise "new" is unknowable)
    filed_prev = filings[filings["is_original"]][["cik", "period"]].drop_duplicates().assign(prev_filed=True).rename(columns={"period": "prev_period_expected"})
    o = o.merge(filed_prev, on=["cik", "prev_period_expected"], how="left"); o["prev_filed"] = o["prev_filed"].fillna(False)

    # Split factors from the price vendor if available (cumulative split between period ends), else flag suspects.
    splits = PRICES_DIR.parent / "derived" / "splits.parquet"
    o["split_factor"] = 1.0
    if splits.exists():
        sp = pd.read_parquet(splits)  # columns: CUSIP, period_from, period_to, factor
        o = o.merge(sp.rename(columns={"period_from": "prev_period_expected", "period_to": "period"}), on=["CUSIP", "prev_period_expected", "period"], how="left")
        o["split_factor"] = o["factor"].fillna(1.0); o = o.drop(columns=["factor"])
    o["shares_prev"] = o["shares_prev_raw"] * o["split_factor"]
    ratio = o["shares"] / o["shares_prev"]
    o["split_suspect"] = o["shares_prev"].notna() & np.isclose(ratio.values[:, None], ROUND_SPLITS[None, :], rtol=0.02).any(axis=1) & (o["split_factor"] == 1.0)
    o["share_change"] = o["shares"] - o["shares_prev"]
    o["share_change_pct"] = o["share_change"] / o["shares_prev"]
    o["weight_change"] = o["weight"] - o["weight_prev"]
    o["status"] = np.select(
        [o["shares_prev"].isna() & o["prev_filed"], o["shares_prev"].isna() & ~o["prev_filed"],
         o["share_change_pct"] > 0.005, o["share_change_pct"] < -0.005],
        ["new", "unknown_prev", "increased", "reduced"], default="unchanged")

    # Exits: in previous original snapshot, absent from this one.
    cur_keys = o[["cik", "period", "CUSIP"]]
    prev = o[["cik", "period", "CUSIP", "shares", "value", "weight", "issuer"]].copy()
    nxt = {p: (periods[i + 1] if i + 1 < len(periods) else pd.NaT) for i, p in enumerate(periods)}
    prev["period"] = prev["period"].map(nxt)
    prev = prev.dropna(subset=["period"])
    prev = prev.merge(filed_prev.rename(columns={"prev_period_expected": "period", "prev_filed": "cur_filed"}), on=["cik", "period"], how="inner")
    exits = prev.merge(cur_keys.assign(present=True), on=["cik", "period", "CUSIP"], how="left")
    exits = exits[exits["present"].isna()].drop(columns=["present", "cur_filed"])
    exits = exits.rename(columns={"shares": "shares_prev", "value": "value_prev", "weight": "weight_prev"})
    exits["shares"] = 0.0; exits["value"] = 0.0; exits["weight"] = 0.0; exits["status"] = "exited"
    exits["share_change"] = -exits["shares_prev"]; exits["share_change_pct"] = -1.0; exits["weight_change"] = -exits["weight_prev"]
    exits = exits.merge(filings[filings["is_original"]][["cik", "period", "accession", "acceptance_ts_et", "manager_name", "amended_later"]], on=["cik", "period"], how="left")
    exits["is_equity_long"] = True; exits["is_original"] = True; exits["putcall"] = ""; exits["amt_type"] = "SH"
    holdings = pd.concat([o, exits], ignore_index=True, sort=False)
    holdings = holdings.drop(columns=[c for c in ["prev_period_expected", "prev_filed", "filing_date"] if c in holdings.columns])

    # Options and non-equity rows ride along, typed, for the option-treatment analysis.
    other = rows[rows["is_original"] & ~rows["is_equity_long"]].copy(); other["status"] = "non_equity_or_option"
    holdings = pd.concat([holdings, other], ignore_index=True, sort=False)
    holdings["security_type_raw"] = np.select([holdings["putcall"] == "Put", holdings["putcall"] == "Call", holdings["amt_type"] == "PRN"], ["put", "call", "principal"], default="equity")
    holdings.to_parquet(DERIVED_DIR / "holdings.parquet", index=False)
    filings.to_parquet(DERIVED_DIR / "filings.parquet", index=False)
    rows[rows["is_equity_long"]][["CUSIP", "issuer", "class"]].drop_duplicates("CUSIP").to_parquet(DERIVED_DIR / "universe_cusips.parquet", index=False)
    print(f"filings {len(filings):,} (originals {filings.is_original.sum():,}, amendments {(filings.form=='13F-HR/A').sum():,}); "
          f"holdings rows {len(holdings):,}; status counts {holdings.status.value_counts().to_dict()}; unit fixes {(filings.unit_fix!=1).sum()}")

if __name__ == "__main__":
    main()
