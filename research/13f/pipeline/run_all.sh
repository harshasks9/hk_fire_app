#!/bin/sh
# Reproduce every price-dependent step after the SEC store, universe, holdings, signals and themes exist.
# Usage: HK13F_DATA=... sh run_all.sh   (logs under $HK13F_DATA/derived/logs)
set -e
L=${HK13F_DATA:-../data}/derived/logs; mkdir -p "$L"
python3 prices_13f.py        > "$L/prices_13f.log" 2>&1
python3 copy_returns.py      > "$L/copy_returns.log" 2>&1
python3 universe_b.py        > "$L/universe_b.log" 2>&1
python3 event_study_q.py all > "$L/event_study_all.log" 2>&1
python3 scorecard.py         > "$L/scorecard.log" 2>&1
python3 theme_stages.py      > "$L/theme_stages.log" 2>&1
python3 strategies_q.py      > "$L/strategies.log" 2>&1
python3 validation.py events > "$L/validation_events.log" 2>&1
python3 validation.py strategies > "$L/validation_strategies.log" 2>&1
python3 intelligence.py      > "$L/intelligence.log" 2>&1
python3 report_build.py      > "$L/report_build.log" 2>&1
echo ALL_DONE >> "$L/run_all.log"
