# AWS Resources Checklist — CloudOps Sentinel

> Verified inventory of every AWS resource defined in the IaC.
> All configurable values are the literal placeholder `XX` — replace before `apply`.
> Verified AWS account: `314510965803` (CLI identity), region `ap-south-1`.

## 1. Networking — `infrastructure/terraform/aws-complete/network.tf`, `peering.tf`, `security.tf`

| # | AWS resource | Terraform | CloudFormation | Purpose |
|---|---|---|---|---|
| 1 | VPC (main) | `aws_vpc.this` | `AWS::EC2::VPC` | Isolated network `XX` |
| 2 | Internet Gateway | `aws_internet_gateway.this` | `AWS::EC2::InternetGateway` | Public subnet internet access |
| 3 | Public subnets (multi-AZ) | `aws_subnet.public` | `AWS::EC2::Subnet` | Web tier, auto public IP |
| 4 | Private subnets (multi-AZ) | `aws_subnet.private` | `AWS::EC2::Subnet` | EKS nodes + RDS, no public IP |
| 5 | NAT Gateway + EIP | `aws_nat_gateway.this`, `aws_eip.nat` | `AWS::EC2::NatGateway`, `EIP` | Private egress |
| 6 | Route tables + associations | `aws_route_table.public/private`, `aws_route.*` | `AWS::EC2::RouteTable` | public→IGW, private→NAT |
| 7 | Network ACL | `aws_network_acl.public` | — | Stateless defence in depth |
| 8 | S3 gateway endpoint | `aws_vpc_endpoint.s3` | `AWS::EC2::VPCEndpoint` | Private S3 access |
| 9 | Customer Gateway | `aws_customer_gateway.this` | `AWS::EC2::CustomerGateway` | On-prem VPN device (XX IP) |
| 10 | VPN Gateway | `aws_vpn_gateway.this` | `AWS::EC2::VPNGateway` | VPC side of IPsec |
| 11 | Site-to-Site VPN connection | `aws_vpn_connection.this` | `AWS::EC2::VPNConnection` | IPsec tunnels + BGP |
| 12 | VPN route propagation | `aws_vpn_gateway_route_propagation.private` | `AWS::EC2::VPNGatewayRoutePropagation` | Learn on-prem routes |
| 13 | Peer VPC + VPC Peering | `peering.tf` (`aws_vpc_peering_connection`) | `AWS::EC2::VPCPeeringConnection` | VPC-to-VPC connectivity |
| 14 | VPC Flow Logs | `aws_flow_log.this` | — | Network telemetry → CloudWatch |
| 15 | Security groups (web/app/db/EKS) | `security.tf`, `eks.tf` | `AWS::EC2::SecurityGroup` | Tiered least privilege |

## 2. Compute — `ec2.tf`, `eks.tf`

| # | AWS resource | Terraform | CloudFormation | Purpose |
|---|---|---|---|---|
| 16 | EC2 web servers (Nginx) | `aws_instance.web` | `AWS::EC2::Instance` | Web app, SSH/RDP, user_data |
| 17 | SSH key pair | `tls_private_key.ssh`, `aws_key_pair.generated` | KeyName param | Remote access |
| 18 | Encrypted EBS data volume | `aws_ebs_volume.data`, `aws_volume_attachment.data` | — | Persistent storage |
| 19 | Elastic IP | `aws_eip.web` | `AWS::EC2::EIP` | Stable public endpoint |
| 20 | EKS control plane | `aws_eks_cluster.this` | `AWS::EKS::Cluster` | Kubernetes hosting |
| 21 | EKS managed node group | `aws_eks_node_group.this` | `AWS::EKS::Nodegroup` | Worker nodes (private subnets) |
| 22 | EKS add-ons | `aws_eks_addon.this` (vpc-cni, coredns, kube-proxy) | `AWS::EKS::Addon` | Cluster essentials |

## 3. Storage — `s3.tf`

| # | AWS resource | Terraform | CloudFormation | Purpose |
|---|---|---|---|---|
| 23 | S3 Terraform state bucket | `aws_s3_bucket.state` | `AWS::S3::Bucket` | Remote state (versioned, AES-256) |
| 24 | S3 artifacts bucket | `aws_s3_bucket.artifacts` | `AWS::S3::Bucket` | CI/CD artifacts + lifecycle |
| 25 | S3 logs bucket | `aws_s3_bucket.logs` | `AWS::S3::Bucket` | Logs + lifecycle |
| 26 | Bucket policies / public access block | 3 × `aws_s3_bucket_public_access_block`, TLS policy | `PublicAccessBlockConfiguration` | Security/compliance |

## 4. IAM / Security — `iam.tf`

| # | AWS resource | Terraform | CloudFormation | Purpose |
|---|---|---|---|---|
| 27 | IAM groups (RBAC) | `aws_iam_group.devops/auditors` | `AWS::IAM::Group` | Role-based access control |
| 28 | IAM user | `aws_iam_user.developer` | `AWS::IAM::User` | Developer identity |
| 29 | Virtual MFA device | `aws_iam_virtual_mfa_device.developer` | — | Multi-factor authentication |
| 30 | MFA-enforcement policy | `aws_iam_policy.mfa_enforced` | `AWS::IAM::ManagedPolicy` | Deny without MFA |
| 31 | Deployment role + least privilege | `aws_iam_role.deployer`, `aws_iam_policy.deployer_least_privilege` | `AWS::IAM::Role` | STS AssumeRole |
| 32 | EKS cluster & node roles | `aws_iam_role.eks_cluster/eks_node` | `AWS::IAM::Role` | EKS permissions |
| 33 | OIDC provider (IRSA) | `aws_iam_openid_connect_provider.eks` | `AWS::IAM::OIDCProvider` | Service account roles |
| 34 | Lambda execution role | `aws_iam_role.lambda` | `AWS::IAM::Role` | Serverless execution |
| 35 | Flow Logs role | `aws_iam_role.flow_logs` | — | VPC flow log writes |

## 6. Data / Serverless — `rds.tf`, `lambda.tf`

| # | AWS resource | Terraform | CloudFormation | Purpose |
|---|---|---|---|---|
| 36 | RDS PostgreSQL | `aws_db_instance.app` | — | Private encrypted database |
| 37 | DB subnet group | `aws_db_subnet_group.this` | — | Private subnet placement |
| 38 | AWS Lambda function | `aws_lambda_function.app` | `AWS::Lambda::Function` | Serverless app |
| 39 | API Gateway HTTP API | `aws_apigatewayv2_api.http`, stage, route, integration | — | Lambda front door |
| 40 | CloudWatch log groups (Lambda/API) | `aws_cloudwatch_log_group.*` | `AWS::Logs::LogGroup` | Function logs |

> Also: SAM template `serverless/template.yaml` defines a REST API + Lambda (`nodejs20.x`/`nodejs22.x` recommended — the existing `nodejs18.x` is deprecated).

## 6. Monitoring / Observability / Cost — `monitoring.tf`, `cost.tf`

| # | AWS resource | Terraform | CloudFormation | Purpose |
|---|---|---|---|---|
| 41 | CloudWatch log groups | `aws_cloudwatch_log_group.flow_logs` | `AWS::Logs::LogGroup` | Logs |
| 42 | SNS topic + email subscription | `aws_sns_topic.alerts` | `AWS::SNS::Topic` | Alert notifications |
| 43 | CloudWatch alarms (EC2/RDS CPU) | `aws_cloudwatch_metric_alarm.*` | `AWS::CloudWatch::Alarm` | Threshold alerts |
| 44 | CloudWatch dashboard | `aws_cloudwatch_dashboard.main` | `AWS::CloudWatch::Dashboard` | Executive view |
| 45 | AWS Budget (actual + forecast alerts) | `aws_budgets_budget.monthly` | `AWS::Budgets::Budget` | Cost control |
| 46 | Cost anomaly detector | `aws_ce_anomaly_monitor.ec2` | — | FinOps anomaly detection |

**Total: 46 distinct AWS resource types/resources covered across the Terraform and CloudFormation stacks.**

## Deployment status

- ⚠️ **Not deployed.** The verified AWS credentials have only `sts:GetCallerIdentity` permission; all `ec2:*`, `s3:*`, `iam:*`, `eks:*`, `ce:*`, `servicequotas:*` calls are denied (S3 `ListBuckets` has an explicit deny).
- ✅ Configs are validated: `terraform validate`, `terraform fmt -check`, CloudFormation YAML parse, Kubernetes YAML parse, Go build/test, frontend production build.
- To deploy: replace every `XX`, use an IAM principal with the required permissions (or request elevated access), then `terraform init && terraform apply`.
