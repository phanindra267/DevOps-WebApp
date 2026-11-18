# ==============================================================================
# PROVIDERS & GLOBAL TAGS
# ==============================================================================

provider "aws" {
  region = var.aws_region

  # Optional: set "XX" -> your IAM role ARN to assume a role before provisioning.
  # assume_role {
  #   role_arn = var.deployer_role_arn
  # }

  default_tags {
    tags = local.common_tags
  }
}

provider "random" {}

provider "tls" {}
