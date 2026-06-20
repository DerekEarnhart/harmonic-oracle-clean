# 3I/ATLAS Jupiter Gate retrospective audit

This branch contains a reproducible retrospective audit for the March 2026 Jupiter encounter.

## Stage 1 — data availability

Run:

```bash
python -m pip install pandas requests
python research/3i_jupiter_gate/fetch_and_audit.py
```

The script downloads the MPC observation record for `3I`, stores the untouched response, computes its SHA-256 hash, and separates observations into:

- before 2026-03-14 00:00 UTC;
- the 96-hour March 14–18 window;
- the primary 48-hour March 15–17 window;
- observations after March 18.

The completed audit found only 13 observations spanning 23.7 hours in the nominal 48-hour gate. The preregistered 16.16 ± 0.10 h period test is therefore formally underpowered. See `STAGE1_VERDICT.md`.

## Stage 2 — frozen orbit residual screen

Stage 2 asks a narrower question that the data can support:

> Does a standard natural-comet orbit fitted using only observations before 2026-03-14 predict the later encounter observations within their astrometric errors?

The implementation is based on the professional `NEOs.jl` 3I/ATLAS orbit-determination workflow. It:

1. selects observatories using pre-cutoff data only;
2. excludes MPC station 703, following the source analysis's bias warning;
3. grows a gravity-only orbit from the discovery tracklet;
4. fits standard Marsden nongravitational parameters using only pre-cutoff data;
5. freezes that solution;
6. exports out-of-sample residuals for the primary and broad windows;
7. runs fixed-frequency and leave-one-station-out screening analyses.

### Windows command

From the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\research\3i_jupiter_gate\run_stage2.ps1
```

The runner installs Julia 1.12 with `winget` when necessary, instantiates the Julia environment, performs the orbit fit, and runs the Python residual analysis.

Outputs are written to:

```text
stage2_artifacts/
```

Important files:

```text
fit_summary.json
residuals_primary_48h.csv
residuals_broad_96h.csv
residual_analysis.json
3I_pre_cutoff_frozen_orbit.jld2
```

## Interpretation rules

- The original preregistered result remains **underpowered**, even if a fixed-frequency screen returns a small nominal p-value.
- A Stage-2 anomaly candidate must appear in the broad window and survive removal of every individual station.
- The current Stage-2 p-values are screening statistics. They use astrometric weights but do not yet include the propagated covariance of the fitted orbit or station-cluster correlations.
- No anomaly claim is permitted until a later covariance-aware fit confirms the residual excess.

The preregistered primary period remains 16.16 h. The 7.136 h post-perihelion period is labeled exploratory throughout.

## Important limitation

The published article did not preserve the exact mathematical definition of the harmonic residual H or the original frozen monitor inputs. This reconstruction therefore publishes transparent replacement metrics rather than claiming bit-for-bit replication.
