output "developer_user_arn" {
  description = "IAM developer user ARN"
  value       = aws_iam_user.developer.arn
}

output "deployer_role_arn" {
  description = "Deployment role ARN (assumable by the developer user)"
  value       = aws_iam_role.deployer.arn
}

output "mfa_device_serial" {
  description = "Virtual MFA device serial (ARN)"
  value       = aws_iam_virtual_mfa_device.developer.arn
}

