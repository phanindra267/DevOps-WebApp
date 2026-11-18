# run_trivy_scan.ps1
# Reusable, 100% LOCAL Trivy DevSecOps scan runner for INT 378 (Practical 7).
#
# What it does:
#   1. Locates the bundled Trivy binary at security/bin/trivy.exe
#   2. Runs three scans from the repository root:
#        a. filesystem / source repo      -> trivy_fs.json      + trivy_fs.txt
#        b. locally built backend image   -> trivy_image_backend.json + .txt
#        c. IaC / config in infrastructure -> trivy_iac.json     + trivy_iac.txt
#   3. Writes ALL reports into evidence/security/ (Trivy -o overwrites safely).
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File security\run_trivy_scan.ps1
#
# Notes:
#   - Fully offline after the first run (vulnerability DB is cached by Trivy).
#   - The first-ever run downloads the Trivy DB from mirror.gcr.io (internet needed once).
#   - Scans are read-only; this script never modifies application/infra source.
#   - Exit codes of the scans are NOT treated as fatal so all three always complete.
#     Review the JSON / SUMMARY.md for the actual security gate decision.

$ErrorActionPreference = 'Continue'

# --- Paths (resolved relative to this script, not the caller's location) ---
$SecurityDir = $PSScriptRoot
$RepoRoot    = Split-Path -Path $SecurityDir -Parent
$Trivy       = Join-Path $SecurityDir 'bin\trivy.exe'
$EvidenceDir = Join-Path $RepoRoot 'evidence\security'
$ImageName   = 'int378-backend'

# --- Preconditions ---
if (-not (Test-Path -LiteralPath $Trivy)) {
    Write-Error "Trivy binary not found at: $Trivy. Download trivy_<version>_windows-64bit.zip from https://github.com/aquasecurity/trivy/releases and extract trivy.exe into security/bin/."
    exit 1
}

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null

Write-Host "Using Trivy: $Trivy"
& $Trivy --version
Write-Host "Repository root: $RepoRoot"
Write-Host "Evidence dir:    $EvidenceDir"

Push-Location -LiteralPath $RepoRoot
try {
    # a. Filesystem / repository scan (vulnerabilities + secrets)
    Write-Host "`n[1/3] Filesystem scan of repository ..."
    & $Trivy fs --format json  -o (Join-Path $EvidenceDir 'trivy_fs.json') . 2>$null
    & $Trivy fs --format table -o (Join-Path $EvidenceDir 'trivy_fs.txt')  . 2>$null

    # b. Local container image scan
    Write-Host "[2/3] Image scan of '$ImageName' ..."
    & $Trivy image --format json  -o (Join-Path $EvidenceDir 'trivy_image_backend.json') $ImageName 2>$null
    & $Trivy image --format table -o (Join-Path $EvidenceDir 'trivy_image_backend.txt')  $ImageName 2>$null

    # c. Config / IaC scan
    Write-Host "[3/3] Config/IaC scan of 'infrastructure' ..."
    & $Trivy config --format json  -o (Join-Path $EvidenceDir 'trivy_iac.json') infrastructure 2>$null
    & $Trivy config --format table -o (Join-Path $EvidenceDir 'trivy_iac.txt')  infrastructure 2>$null
}
finally {
    Pop-Location
}

Write-Host "`nDone. Reports written to: $EvidenceDir"
Get-ChildItem -LiteralPath $EvidenceDir | Select-Object Name, Length
