# ==============================================================================
# CloudOps Sentinel - COMPLETE AWS Infrastructure as Code (Terraform)
# INT 378 | Session 2026-27
# ------------------------------------------------------------------------------
# EVERY value that must be customised is written as the literal placeholder "XX".
# Replace every "XX" with your own value (see terraform.tfvars.example) before
# running `terraform apply`. Values that must be numbers for Terraform to parse
# are marked with a `# XX - replace` comment.
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}
