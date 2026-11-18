# ==============================================================================
# CloudOps Sentinel - guarded Terraform deployment (ap-south-1)
# 1) Runs preflight.ps1 -> refuses to deploy while the SCP deny is active
# 2) init / fmt / validate / plan
# 3) Asks for explicit approval before apply (billable infrastructure)
# ==============================================================================

Set-Location $PSScriptRoot

Write-Host "`n[1/5] AWS preflight check..." -ForegroundColor Cyan
& .\preflight.ps1
if ($LASTEXITCODE -ne 0) { Write-Host "Aborting: preflight failed." -ForegroundColor Red; exit 2 }

Write-Host "`n[2/5] terraform init..." -ForegroundColor Cyan
terraform init -input=false
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/5] terraform fmt + validate..." -ForegroundColor Cyan
terraform fmt -recursive
terraform validate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[4/5] terraform plan..." -ForegroundColor Cyan
terraform plan -var-file="terraform.tfvars" -out=tfplan
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[5/5] Review the plan above carefully." -ForegroundColor Yellow
$answer = Read-Host "Type 'yes' to APPLY (creates billable AWS resources), anything else to abort"
if ($answer -ne 'yes') { Write-Host "Aborted by user." -ForegroundColor Yellow; exit 0 }

terraform apply -input=false tfplan
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDeployment complete. Terraform outputs:" -ForegroundColor Green
terraform output
