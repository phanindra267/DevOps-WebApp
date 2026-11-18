# CloudOps Sentinel — Complete AWS Infrastructure (Terraform)

This directory contains a **single, self-contained Terraform stack** that provisions every AWS
resource required by the INT 378 practicals and syllabus: VPC with public/private subnets, NAT,
Site-to-Site VPN, security groups and NACLs, IAM (RBAC, MFA, roles, least privilege), EC2 Nginx web
servers, S3 buckets, an EKS cluster that hosts the application on Kubernetes, RDS PostgreSQL,
Lambda + API Gateway, CloudWatch monitoring and AWS Budgets.

> **Every key value is the literal placeholder `XX`.** Replace all `XX` occurrences with your own
> values before applying. Start by copying `terraform.tfvars.example` to `terraform.tfvars` and
> filling it in. Values that must be numbers are marked with a `# XX - replace` comment.
> `terraform.tfvars` is git-ignored — never commit real passwords, ARNs or key material.

## 1. Prerequisites

- Terraform `>= 1.5` (`terraform version`)
- AWS CLI configured with credentials (`aws configure` or an SSO/profile)
- An AWS free-tier account with permission to create VPC / EC2 / IAM / EKS / S3 / RDS resources

## 2. Provision the stack

```powershell
cd infrastructure\terraform\aws-complete
Copy-Item terraform.tfvars.example terraform.tfvars   # then edit: replace every XX
terraform init
terraform fmt -check
terraform validate
terraform plan  -out=tfplan
terraform apply tfplan
```

To tear everything down:

```powershell
terraform destroy
```

### Optional: remote state in S3

After the first apply, add a backend block to `versions.tf` and migrate state:

```hcl
backend "s3" {
  bucket  = "XX"   # use the state bucket output from this stack
  key     = "XX/cloudops-sentinel.tfstate"
  region  = "XX"
  encrypt = true
}
```

Then run `terraform init -migrate-state`.

## 3. Resource inventory

| File | AWS resources |
|---|---|
| `network.tf` | VPC, Internet Gateway, public/private subnets (multi-AZ), NAT Gateway + EIP, public/private route tables, S3 gateway endpoint, Customer Gateway, VPN Gateway, Site-to-Site VPN connection (BGP route propagation), VPC Flow Logs |
| `peering.tf` | VPC peering connection + routes in both directions. Leave `peer_vpc_id = "XX"` to auto-create a demo peer VPC, or supply an existing VPC ID/CIDR/region |
| `security.tf` | Tiered security groups (web → app → db), public-subnet network ACL with least-privilege rules |
| `iam.tf` | IAM groups/users (RBAC), virtual MFA device, MFA-enforcement policy, deployment role + least-privilege policy, instance profile, EKS cluster/node roles, OIDC provider (IRSA), Lambda role, Flow Logs role |
| `s3.tf` | State, artifacts and logs buckets — versioning, AES-256 encryption, public access block, TLS-only policy, lifecycle rules |
| `ec2.tf` | EC2 web servers with user_data Nginx + sample app, SSH key pair, encrypted EBS data volume, Elastic IP |
| `eks.tf` | EKS control plane, managed node group in private subnets, default add-ons (vpc-cni, CoreDNS, kube-proxy) |
| `rds.tf` | Private, encrypted RDS PostgreSQL with subnet group and backups |
| `lambda.tf` | Lambda function, API Gateway HTTP API, stage, integration, route and CloudWatch log groups |
| `monitoring.tf` | CloudWatch log groups, SNS alerts, EC2/RDS CPU alarms, executive dashboard |
| `cost.tf` | Monthly AWS Budget (actual + forecasted alerts) and EC2 cost anomaly detector |

## 4. Host the application on Kubernetes (EKS)

After `terraform apply` completes, configure `kubectl` and deploy the manifests in `kubernetes/eks/`:

```powershell
aws eks update-kubeconfig --region XX --name XX
kubectl apply -f kubernetes/eks/
kubectl get pods,svc,ingress -n cloudops-sentinel
```

The manifests include namespace, ConfigMap, Secret (`XX` placeholders), ServiceAccount with IRSA
annotation, backend/frontend Deployments, ClusterIP/NodePort Services, Ingress (AWS Load Balancer
Controller, TLS via ACM), HorizontalPodAutoscaler and a zero-trust NetworkPolicy.
Prometheus + Grafana can be added with Helm for observability on the same cluster.

## 5. CloudFormation equivalent

The same infrastructure is available as AWS-native CloudFormation templates in
`infrastructure/cloudformation/`. Compare HCL vs YAML, state handling and drift detection as
required by the IaC unit of the syllabus.

## 6. Security notes

- SSH ingress is restricted to `ssh_allowed_cidr` — never use `0.0.0.0/0` in production.
- All buckets block public access and enforce TLS; all volumes are encrypted.
- The MFA policy denies every action unless `aws:MultiFactorAuthPresent` is true.
- The generated SSH private key and DB password live in Terraform state — keep state encrypted
  and access-controlled (prefer the S3 backend with DynamoDB locking / state versioning).
