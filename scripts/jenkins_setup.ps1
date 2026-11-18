<#
  Local-only Jenkins job bootstrap for CloudOps Sentinel (INT 378).
  Creates a Scripted Pipeline job that runs REAL local stages: git checkout
  from the mounted repo, Go unit tests, Trivy FS scan, Docker image build,
  local deploy health check and Terraform validation. No AWS/cloud/paid APIs.

  NOTE: Docker CLI inside Jenkins talks to the HOST Docker daemon, so any
  -v path must be a HOST path. HOST_REPO below is the Docker Desktop host path
  of this repository (forward slashes are accepted by Docker Desktop).
#>
$ErrorActionPreference = 'Stop'
$base  = 'http://localhost:8085'
$pair  = 'admin:admin123'
$auth  = 'Basic ' + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$hdr   = @{ Authorization = $auth }
$job   = 'cloudops-local-pipeline'

# CSRF crumb (same HTTP session/cookie)
$crumbResp = Invoke-RestMethod -Uri "$base/crumbIssuer/api/json" -Headers $hdr -TimeoutSec 20 -SessionVariable js
$hdr['Jenkins-Crumb'] = $crumbResp.crumb
Write-Host "Crumb field: $($crumbResp.crumbRequestField)"

$script = @'
node {
  def HOST_REPO = 'C:/Users/phani/Downloads/INT 378'
  // Build context is resolved by the Docker CLI INSIDE Jenkins, where the repo is mounted at /workspace
  def HOST_BUILD = '/workspace/backend'
  echo 'LOCAL PIPELINE START - CloudOps Sentinel INT 378 (no cloud resources)'
  stage('1. Checkout (local Git)') {
    sh 'rm -rf "$WORKSPACE/src" && git clone --quiet /workspace "$WORKSPACE/src" && echo CHECKOUT_OK && ls "$WORKSPACE/src"'
  }
  stage('2. Unit Tests (Go in local container)') {
    sh "docker run --rm -v \"$HOST_REPO/backend\":/src -v '/run/desktop/mnt/host/c/Users/phani/go/pkg/mod:/go/pkg/mod' -w /src -e GOPROXY=off golang:1.24-alpine go test ./..."
  }
  stage('3. DevSecOps Scan (Trivy, local)') {
    sh "docker run --rm -v \"$HOST_REPO/backend\":/src -v cloudops_trivy_cache:/root/.cache/trivy aquasec/trivy:latest fs --skip-db-update --scanners vuln --exit-code 0 --format table /src | head -40"
  }
  stage('4. Docker Build (local image)') {
    sh "docker build -t int378-backend-jenkins:local \"$HOST_BUILD\""
  }
  stage('5. Local Deploy Health Check') {
    sh 'curl -fsS http://backend:8080/api/v1/health'
  }
  stage('6. IaC Validate (Terraform, local)') {
    sh "docker run --rm --entrypoint sh -v \"$HOST_REPO/infrastructure/terraform/local\":/src -w /tmp hashicorp/terraform:1.16.1 -c 'cp -r /src /tmp/tf && cd /tmp/tf && rm -rf .terraform .terraform.lock.hcl tfplan terraform.tfstate && terraform init -input=false -backend=false && terraform validate -no-color'"
  }
  echo 'LOCAL PIPELINE COMPLETE'
}
'@

$xml = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job">
  <actions/>
  <description>Local-only DevSecOps pipeline - CloudOps Sentinel INT 378</description>
  <keepDependencies>false</keepDependencies>
  <properties/>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsFlowDefinition" plugin="workflow-cps">
    <script><![CDATA[$script]]></script>
    <sandbox>true</sandbox>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
"@

try {
  Invoke-RestMethod -Uri "$base/job/$job/api/json" -Headers $hdr -TimeoutSec 15 | Out-Null
  Write-Host "Job '$job' exists - updating configuration"
  Invoke-RestMethod -Uri "$base/job/$job/config.xml" -Method Post -Headers $hdr -ContentType 'application/xml' -Body $xml -TimeoutSec 30 -WebSession $js | Out-Null
} catch {
  Write-Host "Creating job '$job'"
  Invoke-RestMethod -Uri "$base/createItem?name=$job" -Method Post -Headers $hdr -ContentType 'application/xml' -Body $xml -TimeoutSec 30 -WebSession $js | Out-Null
}

Write-Host "Triggering build..."
Invoke-RestMethod -Uri "$base/job/$job/build" -Method Post -Headers $hdr -TimeoutSec 30 -WebSession $js | Out-Null
Write-Host "BUILD_TRIGGERED"
