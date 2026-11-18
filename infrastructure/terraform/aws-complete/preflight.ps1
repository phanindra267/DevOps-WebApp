# ==============================================================================
# AWS Preflight Check - run BEFORE terraform apply
# Verifies that the SCP explicit-deny blocker is resolved and permissions work.
# Never prints credentials. Read-only API calls only.
# ==============================================================================

$ErrorActionPreference = 'Continue'
$region = 'ap-south-1'
$account = '314510965803'

Write-Host "AWS Preflight - account $account / region $region" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------------"

$id = aws sts get-caller-identity --output json 2>$null | ConvertFrom-Json
if ($id.Account -ne $account) { Write-Host "FAIL: wrong account $($id.Account)" -ForegroundColor Red; exit 1 }
Write-Host "PASS: identity $($id.Arn)" -ForegroundColor Green

$checks = @(
  @{ n = 'EC2 DescribeVpcs';      c = "aws ec2 describe-vpcs --region $region --query 'length(Vpcs)' --output text" },
  @{ n = 'S3 ListBuckets';        c = "aws s3api list-buckets --query 'length(Buckets)' --output text" },
  @{ n = 'IAM ListUsers';         c = "aws iam list-users --query 'length(Users)' --output text" },
  @{ n = 'EKS ListClusters';      c = "aws eks list-clusters --region $region --query 'length(clusters)' --output text" },
  @{ n = 'CloudWatch DescribeAlarms'; c = "aws cloudwatch describe-alarms --region $region --query 'length(MetricAlarms)' --output text" },
  @{ n = 'ServiceQuotas';         c = "aws service-quotas get-service-quota --service-code ec2 --quota-code L-1216C47A --region $region --query 'Quota.Value' --output text" }
)

$failed = 0
foreach ($check in $checks) {
  $out = & cmd /c "$($check.c) 2>&1"
  if ($LASTEXITCODE -eq 0) {
    Write-Host ("PASS: {0,-26} {1}" -f $check.n, ($out -join ' ')) -ForegroundColor Green
  } else {
    $deny = ($out | Where-Object { $_ -match 'explicit deny|not authorized|AccessDenied' } | Select-Object -First 1)
    Write-Host ("FAIL: {0,-26} {1}" -f $check.n, $deny) -ForegroundColor Red
    $failed++
  }
}

Write-Host "-------------------------------------------------------------"
if ($failed -gt 0) {
  Write-Host "BLOCKED: $failed permission check(s) failed. An AWS Organizations SCP is denying access." -ForegroundColor Yellow
  Write-Host "Ask the org administrator to fix SCP p-6k0fjqz3 (org o-imhofhvg46) for account $account." -ForegroundColor Yellow
  Write-Host "DO NOT run terraform apply until all checks pass." -ForegroundColor Yellow
  exit 2
}
Write-Host "ALL CHECKS PASSED - safe to run terraform apply." -ForegroundColor Green
