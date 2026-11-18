variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "XX"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "XX"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "owner" {
  description = "Owner tag"
  type        = string
  default     = "XX"
}

variable "developer_user_name" {
  description = "IAM developer user name"
  type        = string
  default     = "XX"
}

variable "deployer_role_name" {
  description = "Deployment role name (assumable by the developer user)"
  type        = string
  default     = "XX"
}

variable "mfa_device_name" {
  description = "Virtual MFA device name"
  type        = string
  default     = "XX"
}
