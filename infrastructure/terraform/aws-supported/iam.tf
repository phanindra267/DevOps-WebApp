# ==============================================================================
# IAM - USERS, ROLES, MFA, LEAST-PRIVILEGE POLICIES
# IAM reads are supported; iam:CreateGroup is explicitly denied by SCP
# p-kqaivh8o, so group-based RBAC resources were removed. Account RBAC is
# implemented with an assumable deployment role and least-privilege policies.
# ==============================================================================

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# ---------- Developer user ----------
resource "aws_iam_user" "developer" {
  name = var.developer_user_name

  tags = {
    Course = "INT 378"
    Owner  = var.owner
  }
}

# ---------- Virtual MFA device ----------
resource "aws_iam_virtual_mfa_device" "developer" {
  virtual_mfa_device_name = var.mfa_device_name
}

# ---------- MFA enforcement policy (deny all without MFA) ----------
resource "aws_iam_policy" "mfa_enforced" {
  name        = "${local.name_prefix}-MFAEnforcedPolicy"
  description = "Denies all access unless the caller authenticated with MFA"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowViewAccountInfo"
        Effect   = "Allow"
        Action   = ["iam:ListVirtualMFADevices", "iam:ListUsers"]
        Resource = "*"
      },
      {
        Sid       = "DenyAllWithoutMFA"
        Effect    = "Deny"
        NotAction = ["iam:CreateVirtualMFADevice", "iam:EnableMFADevice", "iam:ResyncMFADevice"]
        Resource  = "*"
        Condition = {
          BoolIfExists = { "aws:MultiFactorAuthPresent" = "false" }
        }
      },
    ]
  })
}

# MFA policy is created but intentionally NOT attached to a group (group
# creation is denied). It can be attached to an existing group manually by an
# administrator with the required permission.
resource "aws_iam_role_policy_attachment" "mfa_for_role" {
  role       = aws_iam_role.deployer.name
  policy_arn = aws_iam_policy.mfa_enforced.arn
}

# ---------- Deployment role (STS AssumeRole) ----------
resource "aws_iam_role" "deployer" {
  name = var.deployer_role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowDeveloperToAssumeRole"
        Effect    = "Allow"
        Action    = "sts:AssumeRole"
        Principal = { AWS = aws_iam_user.developer.arn }
      },
    ]
  })

  tags = {
    Environment = var.environment
    Owner       = var.owner
  }
}

# Least-privilege policy: CloudWatch metrics publish is NOT supported in this
# account, so the role is intentionally limited to IAM self-service only.
resource "aws_iam_policy" "deployer_least_privilege" {
  name        = "${local.name_prefix}-DeployerLeastPrivilege"
  description = "Least-privilege permissions supported by this account"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid      = "ReadOnlyIdentity"
      Effect   = "Allow"
      Action   = ["iam:ListUsers", "iam:ListRoles", "iam:ListGroups", "sts:GetCallerIdentity"]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "deployer" {
  role       = aws_iam_role.deployer.name
  policy_arn = aws_iam_policy.deployer_least_privilege.arn
}
