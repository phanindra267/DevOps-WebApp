# ==============================================================================
# DATA SOURCES
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}
data "aws_region" "current" {}

# Random suffix used to keep S3 bucket names globally unique.
resource "random_id" "suffix" {
  byte_length = 4
}

# TLS certificate for the EKS OIDC thumbprint (IRSA trust).
data "tls_certificate" "eks_oidc" {
  url = aws_eks_cluster.this.identity[0].oidc[0].issuer
}
