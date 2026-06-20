using ArgParse
using CSV
using DataFrames
using Dates
using JLD2
using JSON
using NEOs
using PlanetaryEphemeris
using Printf
using Statistics

using NEOs: AbstractWeightingScheme, AbstractOpticalAstrometry, AbstractOpticalVector,
    OpticalADES, OpticalResidual, σsveres17, rexveres17, skipnanmean, indices

import NEOs: weights, corr, getid, update!

const PE = PlanetaryEphemeris
const EXPECTED_AUDIT_SHA256 = "d6e1e918302ac0e885b23c0687df66b37d686335c1940e9cf195f526c3e10cee"
const HIGH_FIDELITY_OBSERVATORIES = search_observatory_code.([
    "W68", "I41", "250", "X11", "T15", "T14", "I33", "705"
])

function parse_commandline()
    s = ArgParseSettings()
    s.prog = "frozen_orbit_test.jl"
    s.description = "Frozen pre-2026-03-14 orbit test for 3I/ATLAS"

    @add_arg_table! s begin
        "--directory", "-d"
            help = "Output directory"
            arg_type = String
            default = "stage2_artifacts"
        "--cutoff"
            help = "Last instant allowed into the fitted orbit"
            arg_type = String
            default = "2026-03-14T00:00:00"
        "--primary-start"
            help = "Primary gate start"
            arg_type = String
            default = "2026-03-15T00:00:00"
        "--primary-end"
            help = "Primary gate end (exclusive)"
            arg_type = String
            default = "2026-03-17T00:00:00"
        "--broad-start"
            help = "Broad gate start"
            arg_type = String
            default = "2026-03-14T00:00:00"
        "--broad-end"
            help = "Broad gate end (exclusive)"
            arg_type = String
            default = "2026-03-18T00:00:00"
        "--iterations"
            help = "Maximum orbit-growth iterations"
            arg_type = Int
            default = 20
    end

    return parse_args(s)
end

printitle(s::AbstractString, d::AbstractString = "=") =
    println(d ^ length(s), '\n', s, '\n', d ^ length(s))

chi(x::OpticalResidual) = sqrt(chi2(x))
logchi(x::OpticalResidual) = log(chi(x))

function initcond(A::AdmissibleRegion)
    vρ = sum(A.v_ρ_domain) / 2
    return [
        (A.ρ_domain[1], vρ, :log),
        (10^(sum(log10, A.ρ_domain) / 2), vρ, :log),
        (sum(A.ρ_domain) / 2, vρ, :linear),
        (A.ρ_domain[2], vρ, :linear),
    ]
end

"""Thoss et al. (2026) weighting used by the professional 3I/ATLAS NEOs.jl analysis."""
mutable struct Thoss26{T} <: AbstractWeightingScheme{T}
    weights::Vector{NTuple{2, T}}
    corr::Vector{T}
end

function Thoss26(optical::AbstractOpticalVector{T}) where {T <: Real}
    return Thoss26{T}(w8sthoss26(optical), corr.(optical))
end

weights(x::Thoss26) = x.weights
corr(x::Thoss26) = x.corr
getid(::Thoss26) = "Thoss et al. (2026)"

function update!(x::Thoss26{T}, optical::AbstractOpticalVector{T}) where {T <: Real}
    x.weights = w8sthoss26(optical)
    x.corr = corr.(optical)
    return nothing
end

function σsthoss26(obs::AbstractOpticalAstrometry{T}) where {T <: Real}
    σα, σδ = rms(obs)
    code = observatory(obs).code
    σ0 = code in ("250", "X11", "T15", "T14", "I33", "705") ? 0.1 : 1.0
    return (max(σα, σ0), max(σδ, σ0))
end

function w8sthoss26(optical::AbstractOpticalVector{T}) where {T <: Real}
    σs = σsthoss26.(optical)
    rex = rexveres17(optical)
    return @. tuple(1 / (rex * first(σs)), 1 / (rex * last(σs)))
end

function newobservations(OD::ODProblem, od::ODProblem, res::AbstractVector)
    trks = setdiff(OD.tracklets, od.tracklets)
    mags = Vector{Int}(undef, length(trks))
    for i in eachindex(mags)
        idxs = indices(trks[i])
        x = maximum(logchi, view(res, idxs))
        mags[i] = ceil(Int, x)
    end
    n = max(2, minimum(mags, init = typemax(Int)))
    cmax = exp(n)
    j0, jf = indexin(@view(od.optical[[begin, end]]), OD.optical)
    mask = @. chi(res) < cmax
    ja, jb = findfirst(mask), findlast(mask)
    return min(j0, ja):max(jf, jb), cmax
end

function station_codes_from_pre_cutoff(pre_raw)
    df = DataFrame(pre_raw)
    df.veres = σsveres17.(pre_raw)
    gdf = groupby(df, :stn)
    cdf = combine(gdf, nrow, [:rmsra, :rmsdec, :veres] .=> skipnanmean,
                  renamecols = false)
    sort!(cdf, [:veres, :rmsra, :rmsdec])

    idx = findlast(<(1), cdf.veres)
    stations = isnothing(idx) ? eltype(cdf.stn)[] : collect(cdf[1:idx, :stn])
    union!(stations, HIGH_FIDELITY_OBSERVATORIES)
    codes = Set(getfield.(stations, :code))
    delete!(codes, "703")
    return codes, cdf
end

function split_windows(optical, cutoff, primary_start, primary_end, broad_start, broad_end)
    pre = filter(x -> date(x) < cutoff, optical)
    primary = filter(x -> primary_start <= date(x) < primary_end, optical)
    broad = filter(x -> broad_start <= date(x) < broad_end, optical)
    return pre, primary, broad
end

function fit_frozen_orbit(pre, params; niter::Int = 20)
    OD = ODProblem(gravityonly!, pre, weights = Thoss26, debias = Eggl20)

    printitle("Initial orbit determination", "*")
    discovery_obs_idx = findfirst(x -> !isempty(x.disc), pre)
    tracklet_idx = if isnothing(discovery_obs_idx)
        findfirst(x -> length(indices(x)) >= 3, OD.tracklets)
    else
        findfirst(x -> discovery_obs_idx in indices(x), OD.tracklets)
    end
    isnothing(tracklet_idx) && error("No usable initial tracklet was found")

    idxs = indices(OD.tracklets[tracklet_idx])
    od = ODProblem(gravityonly!, pre[idxs], weights = Thoss26, debias = Eggl20)
    orbit = tsaiod(od, params; initcond)
    iszero(orbit) && error("Initial orbit determination failed")

    cmax = 0.0
    for i in 1:niter
        printitle("Orbit-growth iteration $i/$niter (cmax=$cmax)", "*")
        if i > 1
            orbit = orbitdetermination(od, orbit, params)
            iszero(orbit) && error("Orbit determination failed at iteration $i")
        end
        noptical(orbit) == length(pre) && break

        _, _, res = propres(OD, orbit(), epoch(orbit) + PE.J2000, params)
        isempty(res) && error("Residual propagation returned no residuals")
        next_idxs, cmax = newobservations(OD, od, res)
        NEOs.update!(od, pre[next_idxs])
    end

    printitle("Fit standard cometary nongravitational model", "*")
    ODNG = ODProblem(nongravs!, pre, weights = Thoss26, debias = Eggl20)
    orbitNG = orbitdetermination(ODNG, orbit, params)
    iszero(orbitNG) && error("Nongravitational orbit determination failed")
    return orbitNG
end

function residual_dataframe(label::String, optical, orbitNG, params)
    if isempty(optical)
        return DataFrame(
            window = String[], obstime_utc = String[], station = String[],
            ra_residual_sigma = Float64[], dec_residual_sigma = Float64[],
            ra_residual_arcsec = Float64[], dec_residual_arcsec = Float64[],
            chi2 = Float64[], chi = Float64[], flagged_outlier = Bool[]
        ), OpticalResidual[]
    end

    OD = ODProblem(nongravs!, optical, weights = Thoss26, debias = Eggl20)
    _, _, res = propres(OD, orbitNG(), epoch(orbitNG) + PE.J2000, params)
    length(res) == length(optical) || error("Residual count mismatch for $label")

    ra_sigma = Float64.(ra.(res))
    dec_sigma = Float64.(dec.(res))
    ra_arcsec = ra_sigma ./ Float64.(wra.(res))
    dec_arcsec = dec_sigma ./ Float64.(wdec.(res))
    chi2_values = Float64.(chi2.(res))

    df = DataFrame(
        window = fill(label, length(optical)),
        obstime_utc = string.(date.(optical)),
        station = [observatory(x).code for x in optical],
        ra_residual_sigma = ra_sigma,
        dec_residual_sigma = dec_sigma,
        ra_residual_arcsec = ra_arcsec,
        dec_residual_arcsec = dec_arcsec,
        chi2 = chi2_values,
        chi = sqrt.(chi2_values),
        flagged_outlier = Bool.(isoutlier.(res)),
    )
    return df, res
end

function residual_summary(df::DataFrame)
    isempty(df) && return Dict("n" => 0)
    return Dict(
        "n" => nrow(df),
        "stations" => length(unique(df.station)),
        "chi2_sum" => sum(df.chi2),
        "chi2_mean_per_observation" => mean(df.chi2),
        "median_abs_ra_arcsec" => median(abs.(df.ra_residual_arcsec)),
        "median_abs_dec_arcsec" => median(abs.(df.dec_residual_arcsec)),
        "max_chi" => maximum(df.chi),
        "flagged_outliers" => count(df.flagged_outlier),
    )
end

function main()
    args = parse_commandline()
    directory = args["directory"]
    mkpath(directory)

    cutoff = DateTime(args["cutoff"])
    primary_start = DateTime(args["primary-start"])
    primary_end = DateTime(args["primary-end"])
    broad_start = DateTime(args["broad-start"])
    broad_end = DateTime(args["broad-end"])
    niter = args["iterations"]

    started = now()
    printitle("3I/ATLAS frozen Jupiter-gate orbit test")
    println("• Started: $started")
    println("• Fit cutoff: $cutoff UTC")
    println("• Primary window: $primary_start to $primary_end UTC")
    println("• Broad window: $broad_start to $broad_end UTC")

    raw_optical = fetch_optical_ades("3I", MPC)
    sort!(raw_optical)
    pre_raw = filter(x -> date(x) < cutoff, raw_optical)
    codes, station_quality = station_codes_from_pre_cutoff(pre_raw)
    CSV.write(joinpath(directory, "pre_cutoff_station_quality.csv"), station_quality)

    optical = filter(x -> observatory(x).code in codes, raw_optical)
    sort!(optical)
    pre, primary, broad = split_windows(
        optical, cutoff, primary_start, primary_end, broad_start, broad_end
    )

    println("• Raw observations: $(length(raw_optical))")
    println("• Qualified pre-cutoff observations: $(length(pre))")
    println("• Qualified primary observations: $(length(primary))")
    println("• Qualified broad-window observations: $(length(broad))")
    length(pre) < 20 && error("Too few qualified pre-cutoff observations")

    params = Parameters(
        maxsteps = 10_000, order = 25, abstol = 1E-20, parse_eqs = true,
        coeffstol = Inf, bwdoffset = 0.05, fwdoffset = 0.05,
        gaussorder = 2, safegauss = false, refscale = :log,
        tsaorder = 2, adamiter = 500, adamQtol = 1E-5, mmovproject = false,
        jtlsorder = 2, jtlsmask = false, jtlsiter = 20, lsiter = 10,
        jtlsproject = false, significance = 0.99, verbose = true,
        outrej = true, χ2_rec = 7.0, χ2_rej = 8.0, fudge = 100.0,
        max_per = 20.0, marsden_coeffs = (0.0, 0.0, 0.0),
        marsden_scalings = (1E-9, 1E-9, 1E-9)
    )

    orbitNG = fit_frozen_orbit(pre, params; niter = niter)
    orbit_file = joinpath(directory, "3I_pre_cutoff_frozen_orbit.jld2")
    jldsave(orbit_file; orbitNG)

    primary_df, _ = residual_dataframe("primary_48h", primary, orbitNG, params)
    broad_df, _ = residual_dataframe("broad_96h", broad, orbitNG, params)
    CSV.write(joinpath(directory, "residuals_primary_48h.csv"), primary_df)
    CSV.write(joinpath(directory, "residuals_broad_96h.csv"), broad_df)

    summary = Dict(
        "status" => "frozen_pre_cutoff_model_completed",
        "designation" => "3I",
        "expected_stage1_response_sha256" => EXPECTED_AUDIT_SHA256,
        "run_started" => string(started),
        "run_finished" => string(now()),
        "cutoff_utc" => string(cutoff),
        "primary_window" => Dict("start" => string(primary_start), "end" => string(primary_end)),
        "broad_window" => Dict("start" => string(broad_start), "end" => string(broad_end)),
        "raw_observations" => length(raw_optical),
        "qualified_station_codes" => sort!(collect(codes)),
        "pre_cutoff_fit_observations" => length(pre),
        "primary_observations" => residual_summary(primary_df),
        "broad_observations" => residual_summary(broad_df),
        "orbit_summary" => sprint(show, orbitNG),
        "interpretation_limit" => "Screening residuals use astrometric weights; a final anomaly claim must also propagate fitted-orbit covariance and survive station sensitivity tests.",
        "preregistered_period_hours" => 16.16,
        "exploratory_period_hours" => 7.136,
    )

    open(joinpath(directory, "fit_summary.json"), "w") do io
        JSON.print(io, summary, 2)
    end

    println("• Frozen orbit: $orbit_file")
    println("• Primary residuals: $(joinpath(directory, "residuals_primary_48h.csv"))")
    println("• Broad residuals: $(joinpath(directory, "residuals_broad_96h.csv"))")
    println("• Summary: $(joinpath(directory, "fit_summary.json"))")
end

main()
