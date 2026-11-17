# ==============================================================================
# MODULE: AWS IAM RBAC, ROLES, POLICIES & MFA ENFORCEMENT
# Aligns with INT 378 Practical Syllabus (Session 2026-27 - Experiment 2)
# Configures IAM Users, Groups, AssumeRole Trust, Custom Least-Privilege Policies,
# and enforces Multi-Factor Authentication (MFA) via policy conditions.
# ==============================================================================

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# 1. IAM Groups for Role-Based Access Control (RBAC)
resource "aws_iam_group" "devops_engineers" {
  name = "CloudOps-DevOpsEngineers"
}

resource "aws_iam_group" "security_auditors" {
  name = "CloudOps-SecurityAuditors"
}

# 2. IAM User with Developer Identity
resource "aws_iam_user" "developer_user" {
  name = "kakumani-developer"
  tags = {
    Candidate = "Kakumani Phaneendra"
    RegNo     = "12418953"
    Course    = "INT 378"
  }
}

# 3. Add User to DevOps Group
resource "aws_iam_group_membership" "devops_membership" {
  name  = "devops-group-membership"
  users = [aws_iam_user.developer_user.name]
  group = aws_iam_group.devops_engineers.name
}

# 4. Custom Least-Privilege Policy: Read-Only with MFA Requirement
resource "aws_iam_policy" "mfa_enforced_policy" {
  name        = "CloudOps-MFAEnforcedPolicy"
  description = "Enforces Multi-Factor Authentication before accessing cloud resources"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowViewAccountInfo"
        Effect   = "Allow"
        Action   = [
          "iam:ListVirtualMFADevices",
          "iam:ListUsers"
        ]
        Resource = "*"
      },
      {
        Sid      = "DenyAllWithoutMFA"
        Effect   = "Deny"
        NotAction = [
          "iam:CreateVirtualMFADevice",
          "iam:EnableMFADevice",
          "iam:ResyncMFADevice",
          "iam:ListAccountAliases",
          "iam:ListUsers"
        ]
        Resource = "*"
        Condition = {
          BoolIfExists = {
            "aws:MultiFactorAuthPresent" = "false"
          }
        }
      }
    ]
  })
}

# Attach MFA Policy to DevOps Group
resource "aws_iam_group_policy_attachment" "devops_mfa_attach" {
  group      = aws_iam_group.devops_engineers.name
  policy_arn = aws_iam_policy.mfa_enforced_policy.arn
}

# 5. IAM Role with STS AssumeRole Trust Policy (Role Assumption Testing)
resource "aws_iam_role" "cloudops_deployer_role" {
  name = "CloudOps-DeploymentRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      },
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_user.developer_user.arn
        }
      }
    ]
  })

  tags = {
    Role        = "CI/CD Pipeline Deployment"
    Environment = var.environment
  }
}

# 6. Least-Privilege Custom Policy Attached to Role
resource "aws_iam_policy" "deployer_least_privilege" {
  name        = "CloudOps-LeastPrivilegeDeploymentPolicy"
  description = "Allows deployment to ECS and S3 with restricted perimeters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ECSDeployment"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchMetricPublish"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "role_policy_attach" {
  role       = aws_iam_role.cloudops_deployer_role.name
  policy_arn = aws_iam_policy.deployer_least_privilege.arn
}

# Outputs
output "devops_group_arn" {
  value = aws_iam_group.devops_engineers.arn
}

output "deployer_role_arn" {
  value = aws_iam_role.cloudops_deployer_role.arn
}
