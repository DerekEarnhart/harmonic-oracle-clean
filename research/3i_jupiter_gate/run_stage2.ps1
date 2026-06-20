$ErrorActionPreference = 'Stop'

$Here = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = (Resolve-Path (Join-Path $Here '..\..')).Path
$Output = Join-Path $RepoRoot 'stage2_artifacts'
$JuliaScript = Join-Path $Here 'frozen_orbit_test.jl'
$PythonScript = Join-Path $Here 'analyze_residuals.py'
$JuliaLog = Join-Path $Output 'julia_stage2.log'

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

function Run-JuliaLogged {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [Parameter(Mandatory = $true)][string]$LogPath
    )

    # Windows PowerShell 5.1 converts native stderr into PowerShell error records.
    # Temporarily allow those records so Julia can finish and we can inspect its exit code.
    $PreviousErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & $script:JuliaExe @Arguments 2>&1 | Tee-Object -FilePath $LogPath -Append
        $ExitCode = $LASTEXITCODE
    }
    finally {
        $ErrorActionPreference = $PreviousErrorActionPreference
    }

    return $ExitCode
}

Write-Host '3I/ATLAS Jupiter Gate - Stage 2'
Write-Host ('Repository: ' + $RepoRoot)
Write-Host ('Output: ' + $Output)

New-Item -ItemType Directory -Force -Path $Output | Out-Null

$Drive = Get-PSDrive -Name C
$FreeGB = [math]::Round($Drive.Free / 1GB, 2)
Write-Host ('Free space on C: ' + $FreeGB + ' GB')
if ($FreeGB -lt 2.0) {
    throw 'At least 2 GB of free C: drive space is required before running Stage 2.'
}

$OsInfo = Get-CimInstance Win32_OperatingSystem
$FreeRamGB = [math]::Round(($OsInfo.FreePhysicalMemory * 1KB) / 1GB, 2)
Write-Host ('Available physical memory: ' + $FreeRamGB + ' GB')
if ($FreeRamGB -lt 1.25) {
    throw 'Available RAM is too low. Restart Windows, do not open a browser, then run this script first. At least 1.25 GB free is required; 2 GB or more is strongly preferred.'
}
if ($FreeRamGB -lt 2.0) {
    Write-Warning 'Available RAM is limited. Keep all browsers and large applications closed while Stage 2 runs.'
}

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

        if ($MsiProcess.ExitCode -notin @(0, 3010)) {
            throw ('Official Juliaup MSI installation failed with exit code ' + $MsiProcess.ExitCode + '.')
        }

        Refresh-JuliaPaths
        $JuliaExe = Find-LocalExecutable -Name 'julia'
        $JuliaupExe = Find-LocalExecutable -Name 'juliaup'
    }
}

if ($JuliaupExe) {
    Write-Host ('Using Juliaup: ' + $JuliaupExe)
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

# The first run exhausted memory because Julia launched many precompile workers.
# Force all package loading and computation into a single low-memory process.
$env:JULIA_NUM_THREADS = '1'
$env:JULIA_NUM_PRECOMPILE_TASKS = '1'
$env:JULIA_PKG_PRECOMPILE_AUTO = '0'
$env:OPENBLAS_NUM_THREADS = '1'
$env:OMP_NUM_THREADS = '1'

if (Test-Path $JuliaLog) {
    Remove-Item $JuliaLog -Force
}

Write-Host 'Instantiating packages without automatic parallel precompilation...'
$InstantiateArgs = @(
    '--startup-file=no',
    '--history-file=no',
    '--threads=1',
    ('--project=' + $Here),
    '-e',
    'import Pkg; Pkg.instantiate(; allow_autoprecomp=false)'
)
$InstantiateExit = Run-JuliaLogged -Arguments $InstantiateArgs -LogPath $JuliaLog
if ($InstantiateExit -ne 0) {
    throw ('Julia package setup failed. See ' + $JuliaLog)
}

Write-Host 'Loading NEOs serially as a memory-safe smoke test...'
$SmokeArgs = @(
    '--startup-file=no',
    '--history-file=no',
    '--threads=1',
    ('--project=' + $Here),
    '-e',
    'using NEOs'
)
$SmokeExit = Run-JuliaLogged -Arguments $SmokeArgs -LogPath $JuliaLog
if ($SmokeExit -ne 0) {
    Write-Warning 'Normal package loading failed. Retrying without compiled package images.'
    $SmokeFallbackArgs = @(
        '--startup-file=no',
        '--history-file=no',
        '--threads=1',
        '--compiled-modules=no',
        '--pkgimages=no',
        ('--project=' + $Here),
        '-e',
        'using NEOs'
    )
    $SmokeExit = Run-JuliaLogged -Arguments $SmokeFallbackArgs -LogPath $JuliaLog
    if ($SmokeExit -ne 0) {
        throw ('NEOs could not load even in low-memory mode. See ' + $JuliaLog)
    }
    $UseSourceOnly = $true
} else {
    $UseSourceOnly = $false
}

Write-Host 'Running frozen pre-cutoff orbit determination with one Julia thread...'
$OrbitArgs = @(
    '--startup-file=no',
    '--history-file=no',
    '--threads=1'
)
if ($UseSourceOnly) {
    $OrbitArgs += '--compiled-modules=no'
    $OrbitArgs += '--pkgimages=no'
}
$OrbitArgs += ('--project=' + $Here)
$OrbitArgs += $JuliaScript
$OrbitArgs += '-d'
$OrbitArgs += $Output

$OrbitExit = Run-JuliaLogged -Arguments $OrbitArgs -LogPath $JuliaLog
if ($OrbitExit -ne 0) {
    throw ('The frozen orbit calculation failed. Upload ' + $JuliaLog + ' so the actual Julia error can be diagnosed.')
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
