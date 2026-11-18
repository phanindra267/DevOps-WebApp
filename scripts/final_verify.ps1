<#
  Final local verification for CloudOps Sentinel (INT 378).
  Checks every container and HTTP endpoint, saves real output to
  evidence/final_verification.txt. Local-only; no cloud calls.
#>
$ErrorActionPreference = 'Continue'
$root = (Get-Location).Path
$out = Join-Path $root 'evidence\final_verification.txt'
$lines = New-Object System.Collections.Generic.List[string]
function W($s) { $lines.Add([string]$s); Write-Host $s }

W "FINAL LOCAL VERIFICATION - $(Get-Date -Format o)"
W "ROOT: $root"
W ""
W "=== CONTAINERS ==="
W (docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | Out-String)

W "=== HTTP ENDPOINTS ==="
$urls = @(
  'http://localhost:3000/',
  'http://localhost:8080/api/v1/health',
  'http://localhost:8088/',
  'http://localhost:9090/-/healthy',
  'http://localhost:9100/metrics',
  'http://localhost:8087/metrics/',
  'http://localhost:3001/api/health',
  'http://localhost:8085/login',
  'http://localhost:5000/v2/'
)
foreach ($u in $urls) {
  try {
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 12
    W ("OK   {0,-52} {1} ({2} bytes)" -f $u, $r.StatusCode, $r.RawContentLength)
  } catch {
    W ("FAIL {0,-52} {1}" -f $u, $_.Exception.Message)
  }
}

W ""
W "=== PROMETHEUS TARGETS ==="
try {
  $t = (Invoke-WebRequest -Uri 'http://localhost:9090/api/v1/targets?state=active' -UseBasicParsing).Content | ConvertFrom-Json
  foreach ($x in $t.data.activeTargets) { W ("  {0,-18} {1}" -f $x.labels.job, $x.health) }
} catch { W "  ERROR $($_.Exception.Message)" }

W ""
W "=== GO TESTS ==="
Push-Location (Join-Path $root 'backend')
$gt = go test ./... 2>&1 | Out-String
Pop-Location
W $gt

W ""
W "=== DELIVERABLES ==="
foreach ($f in @(
  'CloudOps_Sentinel_INT378_Presentation_FINAL.pptx',
  'LOCAL_EXECUTION_GUIDE.md',
  'docs\PROJECT_REPORT.md',
  'evidence\jenkins\build_console.txt',
  'evidence\security\SUMMARY.md',
  'evidence\terraform\terraform_run.txt',
  'evidence\serverless\cost_report.md',
  'evidence\registry\registry_lifecycle.txt',
  'evidence\iam\iam_demo_output.txt'
)) {
  $p = Join-Path $root $f
  if (Test-Path $p) { W ("  OK   {0} ({1} bytes)" -f $f, (Get-Item $p).Length) }
  else { W ("  MISS {0}" -f $f) }
}

[IO.File]::WriteAllLines($out, $lines)
Write-Host "`nSaved $out"
