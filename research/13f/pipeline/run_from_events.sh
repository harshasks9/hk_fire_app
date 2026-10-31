#!/bin/sh
set -e
L=${HK13F_DATA:-../data}/derived/logs; mkdir -p "$L"
python3 event_study_q.py all > "$L/event_study_all.log" 2>&1
python3 scorecard.py         > "$L/scorecard.log" 2>&1
python3 theme_stages.py      > "$L/theme_stages.log" 2>&1
python3 strategies_q.py      > "$L/strategies.log" 2>&1
python3 validation.py events > "$L/validation_events.log" 2>&1
python3 validation.py strategies > "$L/validation_strategies.log" 2>&1
python3 intelligence.py      > "$L/intelligence.log" 2>&1
python3 report_build.py      > "$L/report_build.log" 2>&1
echo ALL_DONE >> "$L/run_all.log"
