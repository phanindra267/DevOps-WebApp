# ==============================================================================
# INPUT VARIABLES
# Replace every "XX" with your own value. Secrets are marked `sensitive`.
# ==============================================================================

# ---------- Identity / naming ----------
variable "project_name" {
  description = "Project name prefix used for all resource names"
  type        = string
  default     = "XX"
}

variable "environment" {
  description = "Deployment environment: dev, staging or prod"
  type        = string
  default     = "XX"
}

variable "aws_region" {
  description = "AWS region, e.g. ap-south-1"
  type        = string
  default     = "XX"
}

variable "aws_account_id" {
  description = "12-digit AWS account ID used for budgets and cross-account policies"
  type        = string
  default     = "XX"
}

variable "owner" {
  description = "Owner / team tag"
  type        = string
  default     = "XX"
}

variable "student_name" {
  description = "Candidate name for academic tagging"
  type        = string
  default     = "XX"
}

variable "student_regno" {
  description = "Candidate registration number for academic tagging"
  type        = string
  default     = "XX"
}

# ---------- Networking (VPC / public / private / VPN) ----------
variable "vpc_cidr" {
  description = "Primary CIDR block of the VPC"
  type        = string
  default     = "XX"
}

variable "availability_zones" {
  description = "List of Availability Zones, e.g. [\"ap-south-1a\", \"ap-south-1b\"]"
  type        = list(string)
  default     = ["XX", "XX"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["XX", "XX"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["XX", "XX"]
}

variable "vpn_customer_gateway_ip" {
  description = "Public IP address of the on-premises / customer VPN gateway"
  type        = string
  default     = "XX"
}

variable "vpn_bgp_asn" {
  description = "BGP ASN of the customer gateway (65515 is the AWS default)"
  type        = number
  default     = 65000 # XX - replace if your on-prem router uses a different ASN
}

# ---------- VPC Peering (second VPC) ----------
variable "peer_vpc_id" {
  description = "ID of the accepter VPC to peer with (leave XX to create a demo peer VPC in this stack)"
  type        = string
  default     = "XX"
}

variable "peer_vpc_cidr" {
  description = "CIDR block of the peer VPC (must not overlap with vpc_cidr)"
  type        = string
  default     = "XX"
}

variable "peer_vpc_region" {
  description = "Region of the peer VPC (same region for this stack), e.g. ap-south-1"
  type        = string
  default     = "XX"
}

variable "ssh_allowed_cidr" {
  description = "CIDR allowed to SSH into EC2 (never use 0.0.0.0/0 in production)"
  type        = string
  default     = "XX"
}

# ---------- EC2 / web server ----------
variable "ami_id" {
  description = "AMI ID for the web instances (Amazon Linux 2 / Ubuntu)"
  type        = string
  default     = "XX"
}

variable "instance_type" {
  description = "Free-tier eligible EC2 type, e.g. t2.micro / t3.micro"
  type        = string
  default     = "XX"
}

variable "web_instance_count" {
  description = "Number of EC2 web servers"
  type        = number
  default     = 1 # XX - replace
}

variable "key_pair_name" {
  description = "Name of the EC2 SSH key pair to create"
  type        = string
  default     = "XX"
}

variable "ssh_private_key_output_path" {
  description = "Local path where the generated SSH private key is documented (key is also in state)"
  type        = string
  default     = "XX"
}

# ---------- S3 ----------
variable "artifacts_bucket_name" {
  description = "Base name of the S3 bucket for CI/CD artifacts"
  type        = string
  default     = "XX"
}

variable "state_bucket_name" {
  description = "Base name of the S3 bucket holding Terraform state"
  type        = string
  default     = "XX"
}

variable "logs_bucket_name" {
  description = "Base name of the S3 bucket for VPC / access logs"
  type        = string
  default     = "XX"
}

# ---------- IAM ----------
variable "devops_group_name" {
  description = "IAM group for DevOps engineers (RBAC)"
  type        = string
  default     = "XX"
}

variable "auditor_group_name" {
  description = "IAM group for security auditors (RBAC)"
  type        = string
  default     = "XX"
}

variable "developer_user_name" {
  description = "IAM user name for the developer identity"
  type        = string
  default     = "XX"
}

variable "deployer_role_name" {
  description = "IAM role assumed by CI/CD / EC2 for deployments"
  type        = string
  default     = "XX"
}

variable "mfa_device_name" {
  description = "Name of the virtual MFA device to attach to the developer user"
  type        = string
  default     = "XX"
}

# ---------- EKS (Kubernetes hosting) ----------
variable "eks_cluster_name" {
  description = "Name of the EKS control plane"
  type        = string
  default     = "XX"
}

variable "eks_cluster_version" {
  description = "Kubernetes version, e.g. 1.29"
  type        = string
  default     = "XX"
}

variable "eks_node_instance_type" {
  description = "Instance type for the managed node group"
  type        = string
  default     = "XX"
}

variable "eks_node_desired_size" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 1 # XX - replace
}

variable "eks_node_min_size" {
  description = "Minimum number of EKS worker nodes"
  type        = number
  default     = 1 # XX - replace
}

variable "eks_node_max_size" {
  description = "Maximum number of EKS worker nodes"
  type        = number
  default     = 3 # XX - replace
}

variable "eks_node_disk_size" {
  description = "EBS disk size (GiB) for each worker node"
  type        = number
  default     = 20 # XX - replace
}

# ---------- RDS (application database) ----------
variable "db_name" {
  description = "Name of the application database"
  type        = string
  default     = "XX"
}

variable "db_username" {
  description = "Master username for the database"
  type        = string
  default     = "XX"
}

variable "db_password" {
  description = "Master password for the database"
  type        = string
  default     = "XX"
  sensitive   = true
}

variable "db_instance_class" {
  description = "RDS instance class, e.g. db.t3.micro"
  type        = string
  default     = "XX"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GiB"
  type        = number
  default     = 20 # XX - replace
}

# ---------- Lambda / API Gateway ----------
variable "lambda_function_name" {
  description = "Name of the serverless function"
  type        = string
  default     = "XX"
}

variable "lambda_runtime" {
  description = "Lambda runtime, e.g. nodejs20.x / python3.12"
  type        = string
  default     = "XX"
}

variable "lambda_handler" {
  description = "Lambda handler entry point, e.g. index.handler"
  type        = string
  default     = "XX"
}

variable "lambda_zip_path" {
  description = "Path to the zipped Lambda deployment package"
  type        = string
  default     = "XX"
}

# ---------- Monitoring / alerting / cost ----------
variable "alert_email" {
  description = "Email address that receives CloudWatch / budget alerts"
  type        = string
  default     = "XX"
}

variable "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  type        = string
  default     = "XX"
}

variable "monthly_budget_amount" {
  description = "Monthly AWS budget limit in USD"
  type        = number
  default     = 100 # XX - replace
}

variable "cpu_alarm_threshold" {
  description = "CPU utilisation percentage that triggers an alarm"
  type        = number
  default     = 80 # XX - replace
}

# ---------- Ingress / TLS (used by the EKS Kubernetes manifests) ----------
variable "app_domain" {
  description = "FQDN used by the AWS Load Balancer Controller ingress"
  type        = string
  default     = "XX"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS termination"
  type        = string
  default     = "XX"
}

variable "common_tags" {
  description = "Extra tags applied to every supported resource"
  type        = map(string)
  default     = {}
}
