# INT 378 CA — AWS CloudFormation Submission (Individual Work)

> **Status:** Templates complete, parameterized and fully validated offline. AWS deployment is
> blocked by an organization-level SCP (`p-6k0fjqz3`) — see `CA_PROTOTYPE_GUIDE.md`.
> This document presents the templates themselves as the individual CA deliverable.

## 1. Templates (all validated)

| Template | Resources | Parameters | Purpose |
|---|---|---|---|
| **`ca-prototype.yaml`** ⭐ | 13 | 10 | **Primary CA template** — VPC, public subnet+IGW, private subnet+route table, free-tier EC2+Nginx, secure S3 |
| `vpc.yaml` | 5 | 4 | Reusable standalone VPC + public/private subnets |
| `ec2-webserver.yaml` | 2 | 5 | EC2 + security group with user_data Nginx |
| `iam-rbac.yaml` | 3 | 0 | IAM group, user, MFA-enforcement policy |
| `ecs-cluster.yaml` | 1 | 1 | ECS cluster (IaC comparison) |
| `eks-cluster.yaml` | 9 | 13 | EKS control plane + node group + OIDC |
| `complete-stack.yaml` | 51 | 31 | Full-stack reference (VPN, peering, Lambda, monitoring, budgets) |

Validation performed offline:
- YAML parse: all 7 templates ✅
- Deep semantic check: all 7 templates ✅
  - every `Type` is a valid `AWS::Service::Resource`
  - every `!Ref` resolves to a declared Parameter / Resource / Condition / pseudo-parameter
  - every `!GetAtt` and `DependsOn` points to a declared resource
  - every `!Sub ${...}` symbol is declared
- `aws cloudformation validate-template` ❌ — denied by SCP (not a template error).

## 2. Mandatory requirement coverage (`ca-prototype.yaml`)

| # | CA requirement | Resources in template |
|---|---|---|
| 1 | Amazon VPC | `PrototypeVpc` — `10.0.0.0/16`, DNS support + hostnames |
| 2 | Public subnet + IGW + route table | `PublicSubnet` (`10.0.1.0/24`, `MapPublicIpOnLaunch: true`), `InternetGateway`, `AttachInternetGateway`, `PublicRouteTable`, `PublicDefaultRoute` (`0.0.0.0/0` → IGW), `PublicSubnetRouteAssociation` |
| 3 | Private subnet + own route table | `PrivateSubnet` (`10.0.2.0/24`), `PrivateRouteTable`, `PrivateSubnetRouteAssociation` — **no NAT** (isolated by design, zero cost) |
| 4 | Amazon EC2 (Free Tier, Amazon Linux) | `WebInstance` — `t2.micro`/`t3.micro`, `AmiId` parameter (real AL2023 AMI supplied at deploy), `KeyName` parameter, `UserData` installs+starts Nginx, placed in **public subnet** |
| 5 | Amazon S3 | `ArtifactsBucket` — `VersioningConfiguration: Enabled`, `BucketEncryption: AES256`, `PublicAccessBlockConfiguration` (all 4 flags true), `DeletionPolicy: Retain` |
| 6 | Parameterized/reusable | 10 parameters (`EnvironmentName`, `VpcCidr`, subnet CIDRs, AZ, `AmiId`, `InstanceType`, `KeyName`, `SshLocationCidr`, `BucketBaseName`), 10 outputs |

**Least privilege:** `WebSecurityGroup` allows HTTP(80) and HTTPS(443) from anywhere (needed for the web demo) and SSH(22) only from `SshLocationCidr` (operator-supplied IP/32). All outbound allowed for package updates.

**Cost control:** no NAT Gateway (hourly charge), no Load Balancer, no EKS, no RDS, no Lambda. EC2 t2/t3.micro + ≤30 GB EBS + 5 GB S3 are Free-Tier eligible for new accounts — verify at `https://aws.amazon.com/free/`.

## 3. Dependency graph (resource relationships)

```
InternetGateway ──AttachInternetGateway──> PrototypeVpc
PublicRouteTable ──PublicDefaultRoute─────> InternetGateway (DependsOn attach)
PublicSubnet ─────Association─────────────> PublicRouteTable
PrivateSubnet ───Association─────────────> PrivateRouteTable
WebInstance ─────SubnetId────────────────> PublicSubnet
WebInstance ─────SecurityGroupIds────────> WebSecurityGroup
ArtifactsBucket ──name uses──────────────> AWS::AccountId + AWS::Region (pseudo params)
```
All dependencies use `!Ref`, `!GetAtt`, `!Sub` and `DependsOn` as required.

## 4. How to deploy (when the SCP is lifted)

Full commands with change-set plan and cost notes are in `CA_PROTOTYPE_GUIDE.md`. Short version:

```powershell
aws cloudformation validate-template --template-body file://infrastructure/cloudformation/ca-prototype.yaml --region ap-south-1
aws cloudformation create-stack --stack-name cloudops-ca --region ap-south-1 \
  --template-body file://infrastructure/cloudformation/ca-prototype.yaml \
  --parameters ParameterKey=AmiId,ParameterValue=<real-AMI> ParameterKey=KeyName,ParameterValue=<key> \
               ParameterKey=SshLocationCidr,ParameterValue=<your-ip>/32
aws cloudformation wait stack-create-complete --stack-name cloudops-ca --region ap-south-1
aws cloudformation describe-stacks --stack-name cloudops-ca --region ap-south-1 --query 'Stacks[0].Outputs'
curl http://<PublicIp-output>
```

## 5. What was verified locally instead

Because AWS deployment is blocked, the same concepts were demonstrated locally (see `CA_DEMO_QUICKSTART.md`): Terraform's Docker provider created public/private bridge networks (VPC/subnets), containers (EC2), and a local registry (S3 analog). All 9 services and the Nginx web server were verified HTTP 200; Jenkins build #10 SUCCESS; 4 Prometheus targets UP; serverless 3/3 invocations.

## 6. Honest statement

No AWS resources were created in account `314510965803` — AWS denied every required action with
an explicit deny in SCP `p-6k0fjqz3`. I did not bypass the restriction. The templates are
submission-ready; deployment requires the org administrator to authorize the actions listed in
`CA_PROTOTYPE_GUIDE.md`.
