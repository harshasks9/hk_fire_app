#!/bin/sh
# Re-run the steps downstream of copy returns (manager copy portfolios, Universe B-perf, scorecard, themes,
# strategies, current intelligence, report) without repeating the event studies and validation.
set -e
L=${HK13F_DATA:-../data}/derived/logs; mkdir -p "$L"
python3 copy_returns.py      > "$L/copy_returns.log" 2>&1
python3 universe_b.py        > "$L/universe_b.log" 2>&1
python3 scorecard.py         > "$L/scorecard.log" 2>&1
python3 theme_stages.py      > "$L/theme_stages.log" 2>&1
python3 strategies_q.py      > "$L/strategies.log" 2>&1
python3 intelligence.py      > "$L/intelligence.log" 2>&1
python3 report_build.py      > "$L/report_build.log" 2>&1
echo SECOND_PASS_DONE >> "$L/run_all.log"
