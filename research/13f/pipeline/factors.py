"""
Step 6 — Fama-French daily factors (Mkt-RF, SMB, HML, RMW, CMA, Mom, RF) and the 49 industry portfolios.
Source: Kenneth French data library (CRSP-based; free for research with attribution).
Output: FACTORS_DIR/ff_daily.parquet, FACTORS_DIR/ind49_daily.parquet
"""
from __future__ import annotations
import io, zipfile
import pandas as pd
import requests
from config import FACTORS_DIR

LIB = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/ftp/"
FILES = {"ff3": "F-F_Research_Data_Factors_daily_CSV.zip", "ff5": "F-F_Research_Data_5_Factors_2x3_daily_CSV.zip",
         "mom": "F-F_Momentum_Factor_daily_CSV.zip", "ind49": "49_Industry_Portfolios_Daily_CSV.zip"}

def read_ff_csv(text: str, first_block_only: bool = True) -> pd.DataFrame:
    lines = text.splitlines()
    start = next(i for i, l in enumerate(lines) if l.startswith(",") or l.startswith(" ,") or (l[:1].isdigit() is False and "," in l and "Mkt" in l))
    rows = []
    for l in lines[start + 1:]:
        if not l.strip() or not l.split(",")[0].strip().isdigit():
            break
        rows.append(l)
    df = pd.read_csv(io.StringIO("\n".join([lines[start]] + rows)))
    df = df.rename(columns={df.columns[0]: "date"})
    df["date"] = pd.to_datetime(df["date"].astype(str), format="%Y%m%d")
    df.columns = [c.strip() for c in df.columns]
    return df.set_index("date") / 100.0

def load(name: str) -> str:
    cache = FACTORS_DIR / FILES[name]
    if not cache.exists():
        cache.write_bytes(requests.get(LIB + FILES[name], timeout=120).content)
    with zipfile.ZipFile(cache) as z:
        return z.read(z.namelist()[0]).decode("latin-1")

def main() -> None:
    ff5 = read_ff_csv(load("ff5")); mom = read_ff_csv(load("mom"))
    ff = ff5.join(mom, how="left")
    ff.reset_index().to_parquet(FACTORS_DIR / "ff_daily.parquet", index=False)
    ind = read_ff_csv(load("ind49"))  # first block = value-weighted daily returns
    ind.reset_index().to_parquet(FACTORS_DIR / "ind49_daily.parquet", index=False)
    print(ff.tail(2)); print(ff.index.min(), ff.index.max(), ind.shape)

if __name__ == "__main__":
    main()
