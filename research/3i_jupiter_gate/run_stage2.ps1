$ErrorActionPreference = "Stop"

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $Here "..\..")
$Output = Join-Path $RepoRoot "stage2_artifacts"

Write-Host "3I/ATLAS Jupiter Gate — Stage 2"
Write-Host "Repository: $RepoRoot"
Write-Host "Output: $Output"

if (-not (Get-Command julia -ErrorAction SilentlyContinue)) {
    Write-Host "Julia 1.12 is required. Installing with winget..."
    winget install --id Julialang.Julia.1.12 -e --accept-package-agreements --accept-source-agreements
    $JuliaCandidate = Get-ChildItem "$env:LOCALAPPDATA\Programs\Julia-*\bin\julia.exe" -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if ($JuliaCandidate) {
        $env:Path = "$(Split-Path $JuliaCandidate.FullName);$env:Path"
    }
}

if (-not (Get-Command julia -ErrorAction SilentlyContinue)) {
    throw "Julia installation was not found on PATH. Close and reopen PowerShell, then rerun this script."
}

Write-Host "Instantiating the Julia environment..."
julia --project="$Here" -e 'import Pkg; Pkg.instantiate()'

Write-Host "Running frozen pre-cutoff orbit determination..."
julia -t auto --project="$Here" (Join-Path $Here "frozen_orbit_test.jl") -d $Output

Write-Host "Installing Python analysis packages..."
py -m pip install --upgrade pandas numpy scipy

Write-Host "Running residual and station-sensitivity analysis..."
py (Join-Path $Here "analyze_residuals.py") --directory $Output

Write-Host ""
Write-Host "Stage 2 complete. Upload this folder back to ChatGPT:"
Write-Host $Output
