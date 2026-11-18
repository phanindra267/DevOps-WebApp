<#
  Capture REAL screenshots of the locally running CloudOps Sentinel stack.
  Uses headless Chrome with an isolated profile and a space-free temp output
  path (Chrome headless cannot accept a screenshot path containing spaces).
  No external services, no credentials, no AWS.
#>
$ErrorActionPreference = 'Continue'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$outDir = Join-Path (Get-Location) 'evidence\screenshots'
$tmpRoot = 'C:\Users\phani\AppData\Local\Temp\opencode\captures'
New-Item -ItemType Directory -Force -Path $outDir, $tmpRoot | Out-Null

$targets = @(
  @{ name='01_dashboard';      url='http://localhost:3000/' },
  @{ name='02_login';          url='http://localhost:3000/login' },
  @{ name='03_syllabus';       url='http://localhost:3000/syllabus' },
  @{ name='04_cost_finops';    url='http://localhost:3000/cost' },
  @{ name='05_prometheus';     url='http://localhost:9090/graph' },
  @{ name='06_prom_targets';   url='http://localhost:9090/targets' },
  @{ name='07_grafana';        url='http://localhost:3001/login' },
  @{ name='08_jenkins';        url='http://localhost:8085/' },
  @{ name='09_jenkins_job';    url='http://localhost:8085/job/cloudops-local-pipeline/' },
  @{ name='10_terraform_web';  url='http://localhost:8088/' },
  @{ name='11_node_exporter';  url='http://localhost:9100/' },
  @{ name='12_cadvisor';       url='http://localhost:8087/' },
  @{ name='13_api_health';     url='http://localhost:8080/api/v1/health' }
)

$i = 0
foreach ($t in $targets) {
  $i++
  $profile = Join-Path $tmpRoot "profile-$i"
  $tmpShot = Join-Path $tmpRoot "shot-$i.png"
  $dest = Join-Path $outDir "$($t.name).png"
  New-Item -ItemType Directory -Force -Path $profile | Out-Null
  Remove-Item $tmpShot -ErrorAction SilentlyContinue

  $argsList = @(
    '--headless=old', '--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox',
    '--no-first-run', '--hide-scrollbars', "--user-data-dir=$profile",
    '--window-size=1440,900', "--screenshot=$tmpShot", $t.url
  )
  try {
    $p = Start-Process -FilePath $chrome -ArgumentList $argsList -PassThru -WindowStyle Hidden `
      -RedirectStandardOutput (Join-Path $tmpRoot "out-$i.log") `
      -RedirectStandardError (Join-Path $tmpRoot "err-$i.log")
    if (-not $p.WaitForExit(30000)) {
      Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
      Write-Host "TIMEOUT $($t.name)"
    }
    Start-Sleep -Milliseconds 800
    if (Test-Path $tmpShot) {
      Copy-Item $tmpShot $dest -Force
      $len = (Get-Item $dest).Length
      Write-Host ("CAPTURED {0} ({1} bytes)" -f $t.name, $len)
    } else {
      Write-Host "FAILED $($t.name): $($t.url)"
    }
  } catch {
    Write-Host "ERROR $($t.name): $($_.Exception.Message)"
  }
}
Write-Host "Screenshots saved to: $outDir"
