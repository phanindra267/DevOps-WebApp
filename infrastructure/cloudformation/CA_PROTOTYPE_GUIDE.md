# INT 378 CA Prototype — AWS CloudFormation Deployment Guide

Template: [`ca-prototype.yaml`](ca-prototype.yaml) — validated locally (13 resources, 10 parameters).

## What the template creates (all mandatory CA components)

| # | Requirement | Resource in template |
|---|---|---|
| 1 | Amazon VPC | `PrototypeVpc` (10.0.0.0/16, DNS enabled) |
| 2 | Public subnet + IGW + route table | `PublicSubnet`, `InternetGateway`, `PublicRouteTable`, `PublicDefaultRoute`, association |
| 3 | Private subnet + own route table | `PrivateSubnet`, `PrivateRouteTable`, association (no NAT — isolated, zero cost) |
| 4 | EC2 (Free Tier, Amazon Linux 2023) | `WebInstance` (t2.micro/t3.micro, user_data installs Nginx) in public subnet |
| 5 | S3 (encrypted, versioned, public access blocked) | `ArtifactsBucket` (AES-256, versioning, 4 block flags) |
| 6 | Reusable parameterized CloudFormation | 10 parameters, 10 outputs, `DependsOn` + `!Ref`/`!GetAtt`/`!Sub` dependencies |
| + | Least-privilege SG | HTTP/HTTPS from `0.0.0.0/0`, SSH from `SshLocationCidr` only |

**Deliberately excluded** (to stay free / simple): NAT Gateway (hourly charge), load balancer, EKS, RDS, Lambda, IAM users/groups.

## Free Tier / cost assessment (ap-south-1)

| Resource | Free Tier status | Est. monthly cost |
|---|---|---|
| VPC, subnets, route tables, IGW | Free | $0 |
| EC2 t2.micro / t3.micro | 750 hrs/month free for 12 months (new accounts) — **verify in Billing → Free Tier** | $0 within tier, else ~$7.5/mo (t3.micro on-demand ap-south-1) |
| EBS root volume (gp3, ≤30 GB from AMI) | Free Tier includes 30 GB | $0 within tier |
| S3 (versioned, AES-256) | 5 GB Standard free for 12 months | $0 within tier |
| Data transfer out | 100 GB/month free (aggregate) | $0 within tier |
| **NAT Gateway / LB / EKS** | Not free | **Not used** ✅ |

⚠️ Free Tier eligibility depends on account age and current AWS offers — verify at
`https://aws.amazon.com/free/` and Billing console before deploying. This is an estimate, not a quote.

## Deployment procedure (once permissions are authorized)

```powershell
# 1. Find a real Amazon Linux 2023 AMI in ap-south-1 and create/choose a key pair
aws ec2 describe-images --region ap-south-1 --owners amazon \
  --filters "Name=name,Values=al2023-ami-2026*" \
  --query 'Images[0].ImageId' --output text
aws ec2 create-key-pair --region ap-south-1 --key-name ca-key --query KeyMaterial --output text > ca-key.pem

# 2. Validate (requires cloudformation:ValidateTemplate)
aws cloudformation validate-template \
  --template-body file://infrastructure/cloudformation/ca-prototype.yaml \
  --region ap-south-1

# 3. Show the deployment plan / changeset (requires cloudformation:CreateChangeSet)
aws cloudformation create-change-set \
  --stack-name cloudops-ca --region ap-south-1 \
  --template-body file://infrastructure/cloudformation/ca-prototype.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --change-set-name ca-plan \
  --parameters \
    ParameterKey=AmiId,ParameterValue=<real-ami-id> \
    ParameterKey=KeyName,ParameterValue=ca-key \
    ParameterKey=SshLocationCidr,ParameterValue=<your-ip>/32
aws cloudformation describe-change-set --stack-name cloudops-ca --change-set-name ca-plan --region ap-south-1

# 4. Deploy (after reviewing the plan)
aws cloudformation create-stack \
  --stack-name cloudops-ca --region ap-south-1 \
  --template-body file://infrastructure/cloudformation/ca-prototype.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=AmiId,ParameterValue=<real-ami-id> \
    ParameterKey=KeyName,ParameterValue=ca-key \
    ParameterKey=SshLocationCidr,ParameterValue=<your-ip>/32 \
  --tags Key=Project,Value=INT378-CA

# 5. Wait and verify
aws cloudformation wait stack-create-complete --stack-name cloudops-ca --region ap-south-1
aws cloudformation describe-stacks --stack-name cloudops-ca --region ap-south-1 \
  --query 'Stacks[0].Outputs'
curl http://<PublicIp-from-outputs>     # Nginx page
```

**Stop / clean up after the demo** (to avoid charges):
```powershell
aws cloudformation delete-stack --stack-name cloudops-ca --region ap-south-1
```
(The S3 bucket has `DeletionPolicy: Retain` — delete it manually after saving any evidence.)

## ⛔ Current deployment status: BLOCKED by AWS Organizations SCP

Verified 2026-11-18 against account `314510965803` / region `ap-south-1`:

| Exact action needed | Result |
|---|---|
| `cloudformation:ValidateTemplate` | ❌ AccessDenied — explicit deny in SCP `p-6k0fjqz3` |
| `ec2:DescribeImages` | ❌ UnauthorizedOperation — same SCP |
| `ec2:DescribeKeyPairs` | ❌ UnauthorizedOperation — same SCP |
| `ec2:DescribeVpcs` / `ec2:DescribeSubnets` / `ec2:DescribeSecurityGroups` | ❌ same SCP |
| `s3:ListAllMyBuckets` | ❌ AccessDenied — same SCP |
| `cloudformation:CreateChangeSet` / `CreateStack` / `DeleteStack` | ❌ same SCP (implied by the above) |

SCP ARN: `arn:aws:organizations::673576402218:policy/o-imhofhvg46/service_control_policy/p-6k0fjqz3`

**Why AdministratorAccess does not help:** an explicit deny in an SCP overrides every identity-based policy, including AdministratorAccess. No credential, CLI flag, or Terraform change can bypass it.

### Permissions that need to be authorized by the org administrator

Ask the administrator of organization `o-imhofhvg46` (management account `673576402218`) to attach an SCP to account `314510965803` that **does not explicitly deny** these actions (or add an exception for this account):

```
cloudformation:ValidateTemplate
cloudformation:CreateChangeSet
cloudformation:DescribeChangeSet
cloudformation:CreateStack
cloudformation:DescribeStacks
cloudformation:DeleteStack
ec2:CreateVpc
ec2:CreateSubnet
ec2:CreateInternetGateway
ec2:AttachInternetGateway
ec2:CreateRouteTable
ec2:CreateRoute
ec2:AssociateRouteTable
ec2:CreateSecurityGroup
ec2:AuthorizeSecurityGroupIngress
ec2:AuthorizeSecurityGroupEgress
ec2:RunInstances
ec2:DescribeImages
ec2:DescribeKeyPairs
ec2:DescribeVpcs
ec2:DescribeSubnets
ec2:DescribeRouteTables
ec2:DescribeSecurityGroups
ec2:DescribeInstances
s3:CreateBucket
s3:PutBucketVersioning
s3:PutEncryptionConfiguration
s3:PutPublicAccessBlock
s3:PutBucketTagging
s3:ListAllMyBuckets
```

I did **not** bypass these restrictions and created **no** billable resources. The template is complete and locally validated; deployment is one command sequence away once the SCP is corrected.

## Local fallback (works today, zero AWS cost)

The same concepts are demonstrated locally with Docker (`docker compose up -d --build`) and the Terraform Docker provider (public/private bridge networks = VPC/subnets, container = EC2, Nginx web server on `localhost:8088`, local registry = S3 analog). All 9 services were verified healthy during this session.
