from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.stats import chi2


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Analyze frozen-orbit residuals")
    p.add_argument("--directory", default="stage2_artifacts")
    return p.parse_args()


def fixed_frequency_test(df: pd.DataFrame, period_hours: float) -> dict:
    if len(df) < 8:
        return {"status": "insufficient_rows", "n": int(len(df)), "period_hours": period_hours}

    t = pd.to_datetime(df["obstime_utc"], utc=True)
    hours = (t - t.min()).dt.total_seconds().to_numpy() / 3600.0
    w = 2.0 * np.pi / period_hours

    x0 = np.column_stack([np.ones(len(df)), hours])
    x1 = np.column_stack([np.ones(len(df)), hours, np.sin(w * hours), np.cos(w * hours)])

    delta = 0.0
    components = {}
    for col in ("ra_residual_sigma", "dec_residual_sigma"):
        y = df[col].to_numpy(dtype=float)
        b0, *_ = np.linalg.lstsq(x0, y, rcond=None)
        b1, *_ = np.linalg.lstsq(x1, y, rcond=None)
        sse0 = float(np.sum((y - x0 @ b0) ** 2))
        sse1 = float(np.sum((y - x1 @ b1) ** 2))
        delta += max(0.0, sse0 - sse1)
        components[col] = {
            "null_sse": sse0,
            "sinusoid_sse": sse1,
            "sin_coefficient": float(b1[-2]),
            "cos_coefficient": float(b1[-1]),
            "amplitude_sigma": float(np.hypot(b1[-2], b1[-1])),
        }

    return {
        "status": "screening_only",
        "n": int(len(df)),
        "stations": int(df["station"].nunique()),
        "covered_hours": float(hours.max() - hours.min()),
        "period_hours": period_hours,
        "delta_chi2_like": delta,
        "nominal_df": 4,
        "nominal_p_value": float(chi2.sf(delta, 4)),
        "components": components,
        "warning": "Nominal p-value assumes independent Gaussian normalized residuals and does not establish period resolution.",
    }


def overall_screen(df: pd.DataFrame) -> dict:
    if df.empty:
        return {"status": "no_rows"}
    q = float(df["chi2"].sum())
    dof = int(2 * len(df))
    return {
        "n": int(len(df)),
        "stations": int(df["station"].nunique()),
        "chi2_sum": q,
        "nominal_dof": dof,
        "nominal_p_value": float(chi2.sf(q, dof)),
        "median_chi": float(df["chi"].median()),
        "max_chi": float(df["chi"].max()),
        "warning": "This screening p-value omits propagated fitted-orbit covariance and station-level correlations.",
    }


def leave_one_station_out(df: pd.DataFrame, period: float) -> list[dict]:
    results: list[dict] = []
    for station in sorted(df["station"].unique()):
        reduced = df[df["station"] != station].copy()
        test = fixed_frequency_test(reduced, period)
        test["removed_station"] = station
        results.append(test)
    return results


def analyze_file(path: Path) -> dict:
    df = pd.read_csv(path)
    return {
        "file": path.name,
        "overall_residual_screen": overall_screen(df),
        "preregistered_16_16h": fixed_frequency_test(df, 16.16),
        "exploratory_7_136h": fixed_frequency_test(df, 7.136),
        "leave_one_station_out_16_16h": leave_one_station_out(df, 16.16),
    }


def main() -> None:
    args = parse_args()
    directory = Path(args.directory)
    primary = directory / "residuals_primary_48h.csv"
    broad = directory / "residuals_broad_96h.csv"

    missing = [str(p) for p in (primary, broad) if not p.exists()]
    if missing:
        raise FileNotFoundError(f"Missing Stage-2 residual files: {missing}")

    result = {
        "status": "screening_analysis_completed",
        "primary": analyze_file(primary),
        "broad": analyze_file(broad),
        "decision_rules": {
            "preregistered_result": "Remains underpowered regardless of a small nominal p-value.",
            "stage2_anomaly_candidate": "Requires broad-window residual excess, stability to removing any one station, and later covariance-aware confirmation.",
        },
    }

    out = directory / "residual_analysis.json"
    out.write_text(json.dumps(result, indent=2), encoding="utf-8")
    print(json.dumps(result, indent=2))
    print(f"Saved: {out}")


if __name__ == "__main__":
    main()
