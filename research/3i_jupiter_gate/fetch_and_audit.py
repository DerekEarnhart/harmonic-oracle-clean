from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pandas as pd
import requests

MPC_URL = "https://data.minorplanetcenter.net/api/get-obs"
DESIGNATION = "3I"
CUTOFF = pd.Timestamp("2026-03-14T00:00:00Z")
GATE_END = pd.Timestamp("2026-03-18T00:00:00Z")
PRIMARY_START = pd.Timestamp("2026-03-15T00:00:00Z")
PRIMARY_END = pd.Timestamp("2026-03-17T00:00:00Z")
OUT = Path("artifacts")
OUT.mkdir(exist_ok=True)


def utc_series(df: pd.DataFrame) -> pd.Series:
    candidates = ["obsTime", "obstime", "obs_time", "date", "datetime"]
    for column in candidates:
        if column in df.columns:
            parsed = pd.to_datetime(df[column], utc=True, errors="coerce")
            if parsed.notna().any():
                return parsed
    raise RuntimeError(f"No usable observation-time field. Columns: {list(df.columns)}")


def main() -> None:
    payload = {"desigs": [DESIGNATION], "output_format": ["ADES_DF", "OBS_DF", "OBS80"]}
    response = requests.get(MPC_URL, json=payload, timeout=180)
    response.raise_for_status()
    raw_bytes = response.content
    (OUT / "mpc_response.json").write_bytes(raw_bytes)
    response_hash = hashlib.sha256(raw_bytes).hexdigest()

    records = response.json()
    if not records:
        raise RuntimeError("MPC returned no records")
    record = records[0]
    ades = pd.DataFrame(record.get("ADES_DF", []))
    obs = pd.DataFrame(record.get("OBS_DF", []))
    (OUT / "observations.obs80").write_text(record.get("OBS80", ""), encoding="utf-8")
    ades.to_csv(OUT / "ades_all.csv", index=False)
    obs.to_csv(OUT / "obs_all.csv", index=False)

    times = utc_series(ades)
    ades = ades.copy()
    ades["_time_utc"] = times
    ades = ades.loc[times.notna()].sort_values("_time_utc")

    pre = ades[ades["_time_utc"] < CUTOFF]
    gate96 = ades[(ades["_time_utc"] >= CUTOFF) & (ades["_time_utc"] < GATE_END)]
    gate48 = ades[(ades["_time_utc"] >= PRIMARY_START) & (ades["_time_utc"] < PRIMARY_END)]
    post = ades[ades["_time_utc"] >= GATE_END]

    pre.to_csv(OUT / "ades_pre_cutoff.csv", index=False)
    gate96.to_csv(OUT / "ades_gate_96h.csv", index=False)
    gate48.to_csv(OUT / "ades_gate_48h.csv", index=False)
    post.to_csv(OUT / "ades_post_gate.csv", index=False)

    station_col = next((c for c in ["stn", "station", "observatory"] if c in ades.columns), None)

    def summarize(frame: pd.DataFrame) -> dict:
        result = {
            "n": int(len(frame)),
            "first": None if frame.empty else frame["_time_utc"].min().isoformat(),
            "last": None if frame.empty else frame["_time_utc"].max().isoformat(),
        }
        if station_col:
            counts = frame[station_col].astype(str).value_counts()
            result["stations"] = int(counts.size)
            result["station_counts"] = {str(k): int(v) for k, v in counts.items()}
        if len(frame) > 1:
            unique_times = frame["_time_utc"].drop_duplicates().sort_values()
            gaps = unique_times.diff().dropna().dt.total_seconds()
            result["unique_times"] = int(len(unique_times))
            if not gaps.empty:
                result["median_gap_seconds"] = float(gaps.median())
                result["max_gap_seconds"] = float(gaps.max())
        return result

    report = {
        "designation": DESIGNATION,
        "mpc_endpoint": MPC_URL,
        "request_payload": payload,
        "response_sha256": response_hash,
        "ades_columns": list(ades.columns),
        "total": summarize(ades),
        "pre_cutoff_before_2026_03_14": summarize(pre),
        "gate_96h_2026_03_14_to_18": summarize(gate96),
        "gate_48h_2026_03_15_to_17": summarize(gate48),
        "post_gate_from_2026_03_18": summarize(post),
        "periods_to_test_hours": {
            "preregistered_primary": 16.16,
            "post_perihelion_sensitivity": 7.136,
        },
        "status": "data_audit_only_no_orbit_fit",
    }
    (OUT / "audit_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
