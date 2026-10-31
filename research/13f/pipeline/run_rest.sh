#!/bin/sh
# Everything downstream of the full-sample event study: copy portfolios, Universe B-perf, scorecard, themes,
# strategies, validation (train/test event studies + strategy sensitivities), current intelligence, report.
set -e
L=${HK13F_DATA:-../data}/derived/logs; mkdir -p "$L"
python3 copy_returns.py      > "$L/copy_returns.log" 2>&1
python3 universe_b.py        > "$L/universe_b.log" 2>&1
python3 scorecard.py         > "$L/scorecard.log" 2>&1
python3 theme_stages.py      > "$L/theme_stages.log" 2>&1
python3 strategies_q.py      > "$L/strategies.log" 2>&1
python3 validation.py events > "$L/validation_events.log" 2>&1
python3 validation.py strategies > "$L/validation_strategies.log" 2>&1
python3 intelligence.py      > "$L/intelligence.log" 2>&1
python3 report_build.py      > "$L/report_build.log" 2>&1
echo REST_DONE >> "$L/run_all.log"
