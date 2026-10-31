# Data dictionary

All derived tables are Parquet under `$HK13F_DATA/derived/`. Raw SEC tables are kept exactly as
published (text, one Parquet per archive for INFOTABLE; DuckDB `sec13f.duckdb` for the small tables).

## Raw: SEC Form 13F structured data sets

| Table | Grain | Notes |
|---|---|---|
| `submission` | one row per EDGAR submission (13F-HR, 13F-HR/A, 13F-NT) | `FILING_DATE` is the EDGAR filing date (no time). `PERIODOFREPORT` is the quarter end. |
| `coverpage` | one row per submission | `ISAMENDMENT`, `AMENDMENTTYPE` (RESTATEMENT / NEW HOLDINGS), `FILINGMANAGER_NAME`, confidential-treatment fields. |
| `summarypage` | one row per submission | `TABLEENTRYTOTAL`, `TABLEVALUETOTAL` (same unit convention as VALUE), `OTHERINCLUDEDMANAGERSCOUNT`. |
| `infotable` (Parquet) | one row per reported line | `CUSIP`, `VALUE`, `SSHPRNAMT`, `SSHPRNAMTTYPE` (SH/PRN), `PUTCALL`, `INVESTMENTDISCRETION`, `OTHERMANAGER`, voting authority. **VALUE is in thousands of dollars for filings accepted before 2023-01-03 and in dollars after** (SEC readme). |
| `othermanager` | per submission | other managers whose holdings are included in a combined report. |

Coverage: the structured data sets begin with XML filings accepted from late June 2013, so the first
complete cross-section is the period ended 2013-06-30 (filed Q3 2013). Filings for the period ended
2013-03-31 are only partly present and are excluded from the analysis window.

## Derived

### `filing_acceptance.parquet` (from data.sec.gov submissions API)
| column | description |
|---|---|
| `cik` | 10-digit filer CIK |
| `accession` | SEC accession number (0001234567-YY-NNNNNN) |
| `form` | 13F-HR, 13F-HR/A, 13F-NT, 13F-NT/A |
| `filing_date` | EDGAR filing date |
| `acceptance_ts_et` | EDGAR acceptance timestamp, US Eastern, no tz. **The earliest public availability.** |
| `period` | report period end |

### `filings.parquet`
One row per 13F-HR / 13F-HR/A of a universe CIK.
| column | description |
|---|---|
| `is_original` | earliest-accepted 13F-HR for (cik, period): the snapshot that generates signals |
| `amended_later` | an amendment or a later 13F-HR exists for the same (cik, period) |
| `amendment_type` | RESTATEMENT replaces the table; NEW HOLDINGS adds previously confidential rows |
| `unit_fix` | 1 (as reported), 1000 (filer still reported thousands after the 2023 switch), 0.001 (reported dollars before it) |
| `acceptance_fallback` | true when no data.sec.gov timestamp was found and 23:59 on the filing date was assumed |
| `entries`, `table_value`, `other_managers`, `confidential_omitted` | from the summary page |

### `holdings.parquet` — the manager–security–quarter dataset
One row per (original filing, CUSIP, put/call flag), plus synthetic `exited` rows.
| column | description |
|---|---|
| `cik`, `manager_name`, `accession`, `period`, `acceptance_ts_et` | filer, filing, quarter end, public availability |
| `CUSIP`, `issuer`, `class`, `FIGI` | security as reported |
| `security_type_raw` | equity / put / call / principal (from SSHPRNAMTTYPE and PUTCALL) |
| `is_equity_long` | SH rows with no put/call flag — the only rows that carry weight and status |
| `shares`, `value` | reported quantity and market value in **dollars** (unit-corrected) |
| `weight` | value / long-equity value of the filing |
| `shares_prev_raw`, `shares_prev`, `split_factor`, `split_suspect` | previous original snapshot's shares, split-adjusted when split data is present; suspects flagged when the ratio looks like a round split |
| `share_change`, `share_change_pct`, `weight_change` | split-adjusted change versus the previous period's original snapshot |
| `status` | new · increased · reduced · unchanged · exited · unknown_prev (manager did not file the previous period) · non_equity_or_option |
| `lines` | number of SEC lines aggregated into the row |

Positions are compared on **shares**, never on market value. No intra-quarter timing or execution
price is inferred. Options rows are typed and kept but never converted into directional exposure.

### `security_master.parquet` (OpenFIGI)
| column | description |
|---|---|
| `cusip`, `ticker`, `figi_name`, `security_type`, `market_sector`, `composite_figi`, `mapped` | current ticker and share class for a CUSIP; `mapped=false` when OpenFIGI has no record (typically delisted or foreign) |

### Prices (`prices/<TICKER>.parquet`, Tiingo)
`date, adjClose, close, volume, adjVolume, divCash, splitFactor`. `adjClose` is split- and dividend-adjusted, so
`adjClose[t]/adjClose[s] − 1` is the total return from s to t.

### Factors (`factors/ff_daily.parquet`, `factors/ind49_daily.parquet`, Kenneth French library)
Daily `Mkt-RF, SMB, HML, RMW, CMA, RF, Mom` as decimals; 49 value-weighted industry portfolios.
