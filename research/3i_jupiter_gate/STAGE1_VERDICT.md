# Stage 1 verdict — 3I/ATLAS Jupiter Gate

## Data received

The MPC audit returned 7,110 ADES observations total. The raw response hash was:

`d6e1e918302ac0e885b23c0687df66b37d686335c1940e9cf195f526c3e10cee`

### Primary 48-hour gate

- 13 observations
- 13 unique timestamps
- 5 stations
- First observation: 2026-03-15 23:14:40.100 UTC
- Last observation: 2026-03-16 22:56:52 UTC
- Effective covered span: 23.7033 h
- Median timestamp gap: 26.43 min
- Maximum timestamp gap: 11.876 h
- Dominant station R59: 6/13 observations
- Number of preregistered 16.16 h cycles actually covered: 1.467

### Broader 96-hour window

- 30 observations
- 30 unique timestamps
- 9 stations
- Effective covered span: 81.4514 h
- Median timestamp gap: 16.56 min
- Maximum timestamp gap: 24.159 h
- Number of 16.16 h cycles covered: 5.040

## Preregistered Test 1: phase coherence

**Status: underpowered / not validly testable as written.**

The 48-hour selection contains only 13 measurements spanning 23.7 h, or 1.47 cycles at 16.16 h. A Lomb–Scargle peak constrained to 16.16 ± 0.10 h cannot be resolved from this baseline. The approximate independent period resolution is:

`ΔP ≈ P²/T ≈ 16.16² / 23.703 ≈ 11.0 h`

Even the intended full 48 h span would only give a resolution near 5.4 h, not ±0.10 h. Any numerically narrow peak would reflect grid oversampling or a strong prior, not independent frequency resolution.

The 96-hour window may support a **targeted fixed-frequency sensitivity analysis** at 16.16 h, but it must not be presented as satisfying the original period-search criterion.

## Preregistered Test 2: thermodynamic veto

**Status: not validly testable per-timestep as written.**

Thirteen sky-plane astrometric positions do not provide 13 independent three-dimensional thrust-vector measurements. The defensible replacement is to fit a frozen pre-2026-03-14 nongravitational orbit and evaluate the posterior for aggregate radial/transverse/normal acceleration using the 48-hour and 96-hour observations out of sample.

A valid replacement criterion would test whether the posterior probability of a sunward radial component is high, for example:

`P(a_R < 0 | data) > 0.99`

rather than counting the signs of noisy per-timestamp residual estimates.

## Overall preregistered outcome

Because both original conditions were required for a positive result, and neither can be validly evaluated as written from the available 48-hour data, the proper result is:

**INCONCLUSIVE / UNDERPOWERED — not positive, not a clean null.**

This does not end the analysis. Stage 2 can still answer a narrower and scientifically stronger question:

> Did observations after 2026-03-14 deviate significantly from a natural nongravitational orbit fitted only to pre-cutoff data?

## Stage 2

1. Fit gravity plus standard cometary nongravitational parameters to accepted observations before 2026-03-14.
2. Freeze the orbit and covariance.
3. Predict the 13 primary-window and 30 broader-window observations out of sample.
4. Compute station-weighted RA/Dec residuals and normalized chi values.
5. Compare the natural model against:
   - a one-time impulse near closest approach;
   - a constant additional radial/transverse/normal acceleration over the gate;
   - a fixed-frequency 16.16 h forcing term as a preregistered sensitivity test;
   - a fixed-frequency 7.136 h forcing term labeled exploratory.
6. Report effect sizes, covariance, likelihood improvement, and whether any apparent anomaly survives leave-one-station-out tests.
