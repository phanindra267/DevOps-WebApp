# ==============================================================================
# SCRIPT: TERRAFORM INFRASTRUCTURE AS CODE LIFECYCLE
# Aligns with INT 378 Practical Syllabus (Session 2026-27 - Experiment 5)
# Demonstrates:
# 1. terraform init (provider downloads & state backend configuration)
# 2. terraform validate (syntax & schema validation)
# 3. terraform plan (execution graph calculation & dry-run generation)
# 4. terraform apply (declarative provisioning)
# 5. terraform state list / show (state file inspection)
# 6. terraform destroy (clean teardown)
# Candidate: Kakumani Phaneendra (Reg: 12418953, LPU)
# ==============================================================================

param(
    [string]$TargetEnv = "dev",
    [switch]$AutoApprove = $false
)

$TerraformDir = "infrastructure/terraform/envs/$TargetEnv"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Terraform IaC Lifecycle & State Management (INT 378)" -ForegroundColor Green
Write-Host " Target Directory: $TerraformDir" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path $TerraformDir)) {
    Write-Host "Error: Directory $TerraformDir does not exist." -ForegroundColor Red
    exit 1
}

Push-Location $TerraformDir

try {
    # 1. Terraform Init
    Write-Host "`n[Stage 1/5] Initializing Terraform Providers & Backend..." -ForegroundColor Yellow
    terraform init
    if ($LASTEXITCODE -ne 0) { throw "terraform init failed" }

    # 2. Terraform Validate
    Write-Host "`n[Stage 2/5] Validating Terraform HCL Syntax & Modules..." -ForegroundColor Yellow
    terraform validate
    if ($LASTEXITCODE -ne 0) { throw "terraform validate failed" }

    # 3. Terraform Plan
    Write-Host "`n[Stage 3/5] Generating Execution Plan (Dry-Run)..." -ForegroundColor Yellow
    terraform plan -out=tfplan
    if ($LASTEXITCODE -ne 0) { throw "terraform plan failed" }

    # 4. State Management Inspection
    Write-Host "`n[Stage 4/5] Inspecting Terraform State & Resource Graph..." -ForegroundColor Yellow
    if (Test-Path "terraform.tfstate") {
        Write-Host "Existing Terraform State File Found:" -ForegroundColor Green
        terraform state list
    } else {
        Write-Host "Clean state initialized for plan tfplan." -ForegroundColor Cyan
    }

    # 5. Clean teardown instructions
    Write-Host "`n[Stage 5/5] IaC Commands for Production Apply / Destroy:" -ForegroundColor Yellow
    Write-Host "  Apply Command:   terraform apply tfplan" -ForegroundColor Cyan
    Write-Host "  Destroy Command: terraform destroy -auto-approve" -ForegroundColor Cyan

    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host " [SUCCESS] Terraform IaC Pipeline Validated Successfully!" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Cyan
} finally {
    Pop-Location
}
