$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $Here '..\..')).Path
$Output = Join-Path $RepoRoot 'stage2_artifacts'
$JuliaScript = Join-Path $Here 'frozen_orbit_test.jl'
$PythonScript = Join-Path $Here 'analyze_residuals.py'

Write-Host '3I/ATLAS Jupiter Gate - Stage 2'
Write-Host ('Repository: ' + $RepoRoot)
Write-Host ('Output: ' + $Output)

$JuliaCommand = Get-Command julia -ErrorAction SilentlyContinue

if (-not $JuliaCommand) {
    Write-Host 'Julia 1.12 was not found. Installing it with winget...'
    & winget install --id Julialang.Julia.1.12 --exact --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        throw 'winget could not install Julia 1.12.'
    }

    $JuliaCandidate = Get-ChildItem -Path (Join-Path $env:LOCALAPPDATA 'Programs\Julia-*\bin\julia.exe') -ErrorAction SilentlyContinue |
        Sort-Object -Property FullName -Descending |
        Select-Object -First 1

    if ($JuliaCandidate) {
        $JuliaBin = Split-Path -Parent $JuliaCandidate.FullName
        $env:Path = $JuliaBin + ';' + $env:Path
    }

    $JuliaCommand = Get-Command julia -ErrorAction SilentlyContinue
}

if (-not $JuliaCommand) {
    throw 'Julia installation was not found. Close and reopen PowerShell, then rerun this script.'
}

Write-Host ('Using Julia: ' + $JuliaCommand.Source)

Write-Host 'Instantiating the Julia environment...'
& julia ('--project=' + $Here) -e 'import Pkg; Pkg.instantiate()'
if ($LASTEXITCODE -ne 0) {
    throw 'Julia package installation failed.'
}

Write-Host 'Running frozen pre-cutoff orbit determination...'
& julia -t auto ('--project=' + $Here) $JuliaScript -d $Output
if ($LASTEXITCODE -ne 0) {
    throw 'The frozen orbit calculation failed.'
}

Write-Host 'Installing Python analysis packages...'
& py -m pip install --upgrade pandas numpy scipy
if ($LASTEXITCODE -ne 0) {
    throw 'Python package installation failed.'
}

Write-Host 'Running residual and station-sensitivity analysis...'
& py $PythonScript --directory $Output
if ($LASTEXITCODE -ne 0) {
    throw 'Residual analysis failed.'
}

Write-Host ''
Write-Host 'Stage 2 complete. Upload this folder back to ChatGPT:'
Write-Host $Output
