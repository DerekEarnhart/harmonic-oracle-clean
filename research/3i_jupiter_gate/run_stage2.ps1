$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $Here '..\..')).Path
$Output = Join-Path $RepoRoot 'stage2_artifacts'
$JuliaScript = Join-Path $Here 'frozen_orbit_test.jl'
$PythonScript = Join-Path $Here 'analyze_residuals.py'

function Find-LocalExecutable {
    param([Parameter(Mandatory = $true)][string]$Name)

    $Command = Get-Command $Name -ErrorAction SilentlyContinue
    if ($Command) {
        return $Command.Source
    }

    $Candidates = @(
        (Join-Path $env:USERPROFILE ('.juliaup\bin\' + $Name + '.exe')),
        (Join-Path $env:LOCALAPPDATA ('Microsoft\WindowsApps\' + $Name + '.exe'))
    )

    foreach ($Candidate in $Candidates) {
        if (Test-Path $Candidate) {
            return $Candidate
        }
    }

    return $null
}

function Refresh-JuliaPaths {
    $JuliaupBin = Join-Path $env:USERPROFILE '.juliaup\bin'
    $WindowsApps = Join-Path $env:LOCALAPPDATA 'Microsoft\WindowsApps'

    foreach ($PathEntry in @($JuliaupBin, $WindowsApps)) {
        if ((Test-Path $PathEntry) -and (-not (($env:Path -split ';') -contains $PathEntry))) {
            $env:Path = $PathEntry + ';' + $env:Path
        }
    }
}

Write-Host '3I/ATLAS Jupiter Gate - Stage 2'
Write-Host ('Repository: ' + $RepoRoot)
Write-Host ('Output: ' + $Output)

Refresh-JuliaPaths
$JuliaExe = Find-LocalExecutable -Name 'julia'
$JuliaupExe = Find-LocalExecutable -Name 'juliaup'

if (-not $JuliaExe) {
    Write-Host 'Julia was not found. Trying the official Microsoft Store Juliaup package...'

    & winget source update
    & winget install --name Julia --id 9NJNWW8PVKMN --exact --source msstore --accept-package-agreements --accept-source-agreements
    $WingetSucceeded = ($LASTEXITCODE -eq 0)

    Refresh-JuliaPaths
    $JuliaExe = Find-LocalExecutable -Name 'julia'
    $JuliaupExe = Find-LocalExecutable -Name 'juliaup'

    if ((-not $WingetSucceeded) -or ((-not $JuliaExe) -and (-not $JuliaupExe))) {
        Write-Host 'Microsoft Store installation was unavailable. Using the official Juliaup MSI fallback...'

        $MsiPath = Join-Path $env:TEMP 'Julia-x64.msi'
        Invoke-WebRequest -Uri 'https://install.julialang.org/Julia-x64.msi' -OutFile $MsiPath -UseBasicParsing

        $MsiProcess = Start-Process -FilePath 'msiexec.exe' -ArgumentList @(
            '/i',
            ('"' + $MsiPath + '"'),
            '/qn',
            '/norestart'
        ) -Wait -PassThru

        if ($MsiProcess.ExitCode -ne 0) {
            throw ('Official Juliaup MSI installation failed with exit code ' + $MsiProcess.ExitCode + '.')
        }

        Refresh-JuliaPaths
        $JuliaExe = Find-LocalExecutable -Name 'julia'
        $JuliaupExe = Find-LocalExecutable -Name 'juliaup'
    }
}

if ($JuliaupExe) {
    Write-Host ('Using Juliaup: ' + $JuliaupExe)
    Write-Host 'Ensuring the Julia 1.12 channel is installed...'

    & $JuliaupExe add 1.12
    if ($LASTEXITCODE -ne 0) {
        throw 'Juliaup could not install the Julia 1.12 channel.'
    }

    & $JuliaupExe default 1.12
    if ($LASTEXITCODE -ne 0) {
        throw 'Juliaup could not set Julia 1.12 as the default channel.'
    }

    Refresh-JuliaPaths
    $JuliaExe = Find-LocalExecutable -Name 'julia'
}

if (-not $JuliaExe) {
    throw 'Julia installation completed, but julia.exe could not be located. Close and reopen PowerShell, then rerun this script.'
}

Write-Host ('Using Julia: ' + $JuliaExe)
& $JuliaExe --version
if ($LASTEXITCODE -ne 0) {
    throw 'Julia was located but could not start.'
}

Write-Host 'Instantiating the Julia environment...'
& $JuliaExe ('--project=' + $Here) -e 'import Pkg; Pkg.instantiate()'
if ($LASTEXITCODE -ne 0) {
    throw 'Julia package installation failed.'
}

Write-Host 'Running frozen pre-cutoff orbit determination...'
& $JuliaExe -t auto ('--project=' + $Here) $JuliaScript -d $Output
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
