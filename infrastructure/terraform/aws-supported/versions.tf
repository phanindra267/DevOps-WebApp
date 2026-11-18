# ==============================================================================
# CloudOps Sentinel - SUPPORTED-ONLY AWS STACK
# Account: 314510965803 | Region: ap-south-1
# ------------------------------------------------------------------------------
# Verified by read-only API probes against the actual account:
#   SUPPORTED : IAM (users/roles/policies), STS, Cost Explorer
#   NOT SUPPORTED (SCP explicit deny p-6k0fjqz3) :
#               EC2/VPC, S3, CloudWatch Logs/Alarms, SNS,
#               EKS, RDS, Lambda, API Gateway, Budgets
#
# This stack therefore contains ONLY IAM resources + Cost Explorer queries.
# No EC2, VPN, S3, EKS, RDS, Lambda, CloudWatch or Budgets resources.
# All key values are "XX" placeholders - replace before apply.
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      Owner       = var.owner
      ManagedBy   = "Terraform"
      Course      = "INT 378"
    }
  }
}
