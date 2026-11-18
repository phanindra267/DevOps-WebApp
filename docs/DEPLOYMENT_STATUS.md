# Deployment Status — CloudOps Sentinel (AWS ap-south-1)

## Verified facts

| Item | Value |
|---|---|
| AWS Account | `314510965803` |
| IAM User | `Kakumani_Phaneendra` |
| AdministratorAccess attached | ✅ Yes (`iam:ListAttachedUserPolicies` returns `AdministratorAccess`) |
| Configured region | `ap-south-1` (Mumbai) |
| CLI authentication | ✅ `sts:GetCallerIdentity` works |

## ⛔ Blocker: AWS Organizations SCP explicit deny

Every service API needed for deployment is denied by the **same** organization-level
Service Control Policy:

```
arn:aws:organizations::673576402218:policy/o-imhofhvg46/service_control_policy/p-6k0fjqz3
```

Denied actions observed:

| Service | Exact action | Result |
|---|---|---|
| EC2 | `ec2:DescribeVpcs`, `ec2:DescribeInstances`, `ec2:DescribeAvailabilityZones` | ❌ explicit deny in SCP |
| S3 | `s3:ListAllMyBuckets` | ❌ explicit deny in SCP |
| EKS | `eks:ListClusters` | ❌ explicit deny in SCP |
| CloudWatch | `cloudwatch:DescribeAlarms` | ❌ explicit deny in SCP |
| Service Quotas | `servicequotas:GetServiceQuota` | ❌ explicit deny in SCP |
| Cost Explorer | `ce:GetCostAndUsage` | ❌ explicit deny in SCP |
| IAM | `iam:ListUsers`, `iam:ListAttachedUserPolicies` | ✅ allowed |

**Why AdministratorAccess does not help:** an explicit deny in an SCP overrides every
identity-based policy. It applies to the entire account; no IAM user or role in this
account can bypass it. Only the AWS Organizations management account
(`673576402218`, org `o-imhofhvg46`) can change the SCP.

### Required correction (org administrator action)

Attach an SCP to account `314510965803` that does not explicitly deny these services,
or add an exception to `p-6k0fjqz3` for this account. After that, re-run:

```powershell
cd infrastructure\terraform\aws-complete
.\preflight.ps1     # must print "ALL CHECKS PASSED"
.\deploy.ps1        # guarded init/validate/plan/apply with approval step
```

## What is complete and ready

- ✅ Region standardized to `ap-south-1` across Terraform envs, variables, tfvars, backend default, and CloudFormation.
- ✅ `terraform.tfvars` prepared with low-cost dev defaults (t2.micro / t3.small / db.t3.micro, budget $20).
- ✅ `preflight.ps1` — refuses deployment while the SCP deny is active.
- ✅ `deploy.ps1` — preflight → init → fmt → validate → plan → **explicit approval** → apply → outputs.
- ✅ `terraform validate` passes; backend `go build` + `go test` pass; frontend production build passes.
- ✅ No credentials stored in any project file; `terraform.tfvars` is git-ignored.

## Still required before apply (do NOT invent)

These `XX` values must be supplied by you (they cannot be guessed safely):

| Variable | Why |
|---|---|
| `ami_id` | Must be a real Amazon Linux 2023 AMI ID in `ap-south-1` (SCP blocks `DescribeImages` discovery) |
| `ssh_allowed_cidr` | Your own public IP `/32` (never `0.0.0.0/0` in production) |
| `lambda_zip_path` | A real deployment ZIP, or remove the Lambda resources |
| `app_domain`, `acm_certificate_arn` | Real domain + ACM cert in `ap-south-1`, or keep the Ingress disabled |
| `alert_email` | A real inbox for CloudWatch/SNS alerts |
| `vpn_customer_gateway_ip` | Real on-prem VPN device IP, or remove the VPN resources |

## Deployment status

**NOT DEPLOYED.** No billable AWS resource was created. No `terraform apply` was run.
This report does not claim success — deployment is blocked by the SCP documented above.
