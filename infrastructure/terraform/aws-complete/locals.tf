# ==============================================================================
# LOCAL VALUES - derived names and shared tags
# ==============================================================================

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Random suffix keeps globally-unique S3 bucket names.
  bucket_suffix = random_id.suffix.hex

  state_bucket     = "${var.state_bucket_name}-${var.environment}-${local.bucket_suffix}"
  artifacts_bucket = "${var.artifacts_bucket_name}-${var.environment}-${local.bucket_suffix}"
  logs_bucket      = "${var.logs_bucket_name}-${var.environment}-${local.bucket_suffix}"

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      Owner       = var.owner
      ManagedBy   = "Terraform"
      Course      = "INT 378"
      Candidate   = var.student_name
      RegNo       = var.student_regno
    },
    var.common_tags,
  )
}
