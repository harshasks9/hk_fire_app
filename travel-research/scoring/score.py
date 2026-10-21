"""Weighted scoring and sensitivity analysis for the December 2026 workation research.

Usage:  python3 score.py            (reads destinations.csv and hotels.csv next to this file)

Each input row scores five criteria from 1 to 10. Scores for attributes that could not be
supported by evidence are capped at 5 in the input files, and the row's `confidence`
column (high / medium / low) is carried through to the output.
"""

import csv
import pathlib

HERE = pathlib.Path(__file__).parent
CRITERIA = ["romance", "work", "hotel", "travel", "value"]

SCENARIOS = {
    "base":          {"romance": 25, "work": 25, "hotel": 20, "travel": 20, "value": 10},
    "romance_first": {"romance": 45, "work": 15, "hotel": 20, "travel": 10, "value": 10},
    "work_first":    {"romance": 15, "work": 45, "hotel": 20, "travel": 10, "value": 10},
    "travel_first":  {"romance": 15, "work": 20, "hotel": 15, "travel": 40, "value": 10},
    "value_first":   {"romance": 20, "work": 20, "hotel": 15, "travel": 15, "value": 30},
}


def weighted(row, weights):
    return sum(float(row[c]) * w for c, w in weights.items()) / 100


def run(name):
    path = HERE / f"{name}.csv"
    rows = list(csv.DictReader(path.open()))
    out = []
    for row in rows:
        result = {"name": row["name"], "confidence": row.get("confidence", "")}
        for scenario, weights in SCENARIOS.items():
            result[scenario] = round(weighted(row, weights), 2)
        out.append(result)
    out.sort(key=lambda r: r["base"], reverse=True)

    print(f"\n== {name} ==")
    header = ["rank", "name", "confidence"] + list(SCENARIOS)
    print(" | ".join(header))
    for i, r in enumerate(out, 1):
        print(" | ".join([str(i), r["name"], r["confidence"]] + [f"{r[s]:.2f}" for s in SCENARIOS]))

    print("\nWinner by scenario:")
    for scenario in SCENARIOS:
        best = max(out, key=lambda r: r[scenario])
        runner = sorted(out, key=lambda r: r[scenario], reverse=True)[1]
        print(f"  {scenario:14s} {best['name']} ({best[scenario]:.2f}), margin {best[scenario] - runner[scenario]:.2f} over {runner['name']}")

    with (HERE / f"{name}-results.csv").open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["rank", "name", "confidence"] + list(SCENARIOS))
        w.writeheader()
        for i, r in enumerate(out, 1):
            w.writerow({"rank": i, **r})


if __name__ == "__main__":
    for name in ("destinations", "hotels"):
        if (HERE / f"{name}.csv").exists():
            run(name)
