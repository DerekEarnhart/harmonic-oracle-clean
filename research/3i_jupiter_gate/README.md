# 3I/ATLAS Jupiter Gate retrospective audit

This branch contains a reproducible first-stage audit for the March 2026 Jupiter encounter.

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

It reports observation counts, station counts, timestamps, and cadence gaps.

## Decision gate

- If the 48-hour window has too few independent epochs or is dominated by a single station, report the preregistration as underpowered.
- If cadence and station diversity are adequate, proceed to Stage 2.

## Stage 2 — frozen orbit fit

Fit the natural nongravitational orbit using only accepted astrometry before 2026-03-14, propagate it through the encounter, and compare later astrometry out of sample with covariance preserved.

The preregistered primary period remains 16.16 h. A 7.136 h post-perihelion period may be tested only as a labeled exploratory sensitivity analysis.

## Important limitation

The published article did not preserve the exact mathematical definition of the harmonic residual H or the original frozen monitor inputs. The faithful reconstruction must therefore publish a transparent replacement metric rather than claim bit-for-bit replication.
