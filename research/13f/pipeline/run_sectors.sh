#!/bin/sh
# After the sector map exists: industry hit-rates, specialist tests, Strategy H, final report build.
set -e
L=${HK13F_DATA:-../data}/derived/logs
python3 scorecard.py            > "$L/scorecard.log" 2>&1
python3 extra_tests.py sectors  > "$L/extra_sectors.log" 2>&1
python3 -c "
import pandas as pd
from strategies_q import run, OUT
t = run(['H'], tag='H'); base = pd.read_csv(OUT / 'summary_base.csv')
base = pd.concat([base[base['strategy'] != 'H'], t.assign(tag='base')], ignore_index=True)
order = ['A','B','C','D','E','F','G','H','I','J','PASSIVE']; base['o'] = base['strategy'].map({k: i for i, k in enumerate(order)}); base = base.sort_values('o').drop(columns='o')
base.to_csv(OUT / 'summary_base.csv', index=False); print(t.to_string())
" > "$L/strategy_H.log" 2>&1
python3 report_build.py         > "$L/report_build.log" 2>&1
echo SECTORS_DONE >> "$L/run_all.log"
