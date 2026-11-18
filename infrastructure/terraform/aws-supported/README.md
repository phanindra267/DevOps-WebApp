# AWS Supported-Only Terraform Stack — DEPLOYED ✅

Account `314510965803`, region `ap-south-1`. This stack contains **only what the account actually supports**, verified by live API probes on 2026-11-18.

## Verified support matrix (from live AWS API responses)

| Feature | Supported? | In stack? |
|---|---|---|
| IAM users, roles, policies, MFA, policy attachments | ✅ YES | ✅ Included & deployed |
| STS (GetCallerIdentity, AssumeRole) | ✅ YES | ✅ Used |
| Cost Explorer `ce:GetCostAndUsage` | ✅ YES | ℹ️ CLI-only (no Terraform data source) |
| IAM **groups** (`iam:CreateGroup`) | ❌ denied by SCP `p-kqaivh8o` | ❌ Removed |
| EC2 / VPC / Subnets / Security Groups / AMIs | ❌ denied by SCP `p-6k0fjqz3` | ❌ Removed |
| S3 | ❌ denied by SCP `p-6k0fjqz3` | ❌ Removed |
| Site-to-Site VPN | ❌ denied (EC2 dependency) | ❌ Removed |
| CloudWatch Logs / Alarms, SNS | ❌ denied by SCP `p-6k0fjqz3` | ❌ Removed |
| EKS / RDS / Lambda / API Gateway / Budgets | ❌ denied by SCP `p-6k0fjqz3` | ❌ Removed |

An explicit deny in an AWS Organizations SCP cannot be overridden by AdministratorAccess — only the org admin (org `o-imhofhvg46`) can change it.

## Deployed resources (verified via `aws iam get-*`)

| Resource | ARN / ID |
|---|---|
| IAM user | `arn:aws:iam::314510965803:user/kakumani-developer-int378` |
| IAM role | `arn:aws:iam::314510965803:role/CloudOps-DeploymentRole-INT378` |
| IAM policy (MFA enforce) | `arn:aws:iam::314510965803:policy/cloudops-sentinel-dev-MFAEnforcedPolicy` |
| IAM policy (least privilege) | `arn:aws:iam::314510965803:policy/cloudops-sentinel-dev-DeployerLeastPrivilege` |
| Virtual MFA device | `arn:aws:iam::314510965803:mfa/CloudOps-DevMFA-INT378` |
| 2 role-policy attachments | attached to the deployer role |

`terraform state list` confirms 9 entries; `terraform apply` reported *Apply complete! Resources: 1 added, 0 changed, 0 destroyed* on the final run (the rest were created in the first run).

## Usage

```powershell
cd infrastructure\terraform\aws-supported
Copy-Item terraform.tfvars.example terraform.tfvars   # replace every XX
terraform init
terraform validate
terraform plan -var-file="terraform.tfvars"
terraform apply -var-file="terraform.tfvars"
```

> The full-featured stack (EC2/VPN/S3/EKS/RDS/Lambda) remains in
> `infrastructure/terraform/aws-complete/` as reference for when the SCPs are lifted.
