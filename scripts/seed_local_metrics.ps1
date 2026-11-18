<#
  Seed the local dashboard telemetry store with REAL samples read from the
  locally running Prometheus. No fabricated values: each point is an actual
  Prometheus query result, timestamped with its own query time.
  Requires an authenticated local session (admin/admin123 by default).
#>
$ErrorActionPreference = 'Stop'
$api = 'http://localhost:8080/api/v1'
$prom = 'http://localhost:9090/api/v1/query'

$login = Invoke-RestMethod -Uri "$api/login" -Method Post -ContentType 'application/json' `
  -Body '{"username":"admin","password":"admin123"}' -TimeoutSec 15
$hdr = @{ Authorization = "Bearer $($login.token)" }

$queries = @(
  @{ name = 'CPU (backend, seconds)';  expr = 'process_cpu_seconds_total{job="cloudops-backend"}' },
  @{ name = 'CPU (node, seconds)';     expr = 'process_cpu_seconds_total{job="node-exporter"}' },
  @{ name = 'Memory allocated (MB)';   expr = 'go_memstats_alloc_bytes/1048576'; scale = 1 },
  @{ name = 'HTTP requests (rate)';    expr = 'sum(rate(http_requests_total[5m]))' },
  @{ name = 'HTTP request duration';   expr = 'histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))' }
)

$inserted = 0
foreach ($q in $queries) {
  try {
    $r = Invoke-RestMethod -Uri "$prom" -Method Post -ContentType 'application/x-www-form-urlencoded' `
      -Body ("query=" + [uri]::EscapeDataString($q.expr)) -TimeoutSec 12
    if ($r.status -ne 'success' -or -not $r.data.result -or $r.data.result.Count -eq 0) {
      Write-Host "SKIP $($q.name): no Prometheus result"; continue
    }
    $v = [double]$r.data.result[0].value[1]
    if ([double]::IsNaN($v)) { Write-Host "SKIP $($q.name): NaN"; continue }
    if ($q.name -like 'Memory*') { $v = [math]::Round($v, 2) }
    elseif ($q.name -like 'CPU*') { $v = [math]::Round($v, 3) }
    else { $v = [math]::Round($v, 5) }
    $body = @{ source = 'prometheus'; name = $q.name; value = $v; labels = $q.expr } | ConvertTo-Json
    Invoke-RestMethod -Uri "$api/metrics-data" -Method Post -Headers $hdr `
      -ContentType 'application/json' -Body $body -TimeoutSec 12 | Out-Null
    Write-Host ("OK   {0,-28} {1}" -f $q.name, $v)
    $inserted++
  } catch {
    Write-Host "ERR  $($q.name): $($_.Exception.Message)"
  }
}
Write-Host "Inserted $inserted real Prometheus samples into local metric_records."
