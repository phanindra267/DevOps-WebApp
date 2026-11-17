# ==============================================================================
# MODULE: S3 OBJECT STORAGE & STATE BACKEND
# Aligns with INT 378 Practical Syllabus (Session 2026-27 - Experiment 5)
# Provisions AWS S3 Bucket with Versioning, Server-Side Encryption (AES256),
# Public Access Block, and Lifecycle Rules for Artifact & Terraform State Storage.
# ==============================================================================

variable "bucket_name" {
  description = "Unique name for the S3 bucket"
  type        = string
  default     = "cloudops-sentinel-artifacts-int378"
}

variable "environment" {
  description = "Deployment environment (dev, prod)"
  type        = string
  default     = "dev"
}

# 1. AWS S3 Bucket
resource "aws_s3_bucket" "artifacts" {
  bucket        = "${var.bucket_name}-${var.environment}"
  force_destroy = false

  tags = {
    Name        = "CloudOps Sentinel Storage"
    Environment = var.environment
    Course      = "INT 378"
    ManagedBy   = "Terraform"
  }
}

# 2. Versioning Configuration
resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

# 3. Server-Side Encryption (Least-Privilege & Compliance)
resource "aws_s3_bucket_server_side_encryption_configuration" "encryption" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. Strict Public Access Block (DevSecOps Principle)
resource "aws_s3_bucket_public_access_block" "public_block" {
  bucket = aws_s3_bucket.artifacts.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Outputs
output "bucket_id" {
  description = "S3 Bucket Name / ID"
  value       = aws_s3_bucket.artifacts.id
}

output "bucket_arn" {
  description = "ARN of the S3 Bucket"
  value       = aws_s3_bucket.artifacts.arn
}
