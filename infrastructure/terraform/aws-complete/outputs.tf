# ==============================================================================
# OUTPUTS
# ==============================================================================

output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "vpn_connection_id" {
  description = "Site-to-Site VPN connection ID"
  value       = aws_vpn_connection.this.id
}

output "vpc_peering_connection_id" {
  description = "VPC peering connection ID"
  value       = aws_vpc_peering_connection.this.id
}

output "peer_vpc_id" {
  description = "ID of the peer VPC (created demo or existing)"
  value       = local.peer_vpc_id
}

output "web_instance_ids" {
  description = "EC2 web server instance IDs"
  value       = aws_instance.web[*].id
}

output "web_public_ips" {
  description = "Public IPs of the EC2 web servers"
  value       = aws_instance.web[*].public_ip
}

output "web_eip" {
  description = "Stable Elastic IP of the first web server"
  value       = length(aws_eip.web) > 0 ? aws_eip.web[0].public_ip : null
}

output "ssh_key_name" {
  description = "EC2 SSH key pair name"
  value       = aws_key_pair.generated.key_name
}

output "ssh_private_key_pem" {
  description = "Generated SSH private key (store securely; save to var.ssh_private_key_output_path)"
  value       = tls_private_key.ssh.private_key_pem
  sensitive   = true
}

output "state_bucket" {
  description = "S3 bucket used as Terraform backend"
  value       = aws_s3_bucket.state.id
}

output "artifacts_bucket" {
  description = "S3 bucket for CI/CD artifacts"
  value       = aws_s3_bucket.artifacts.id
}

output "logs_bucket" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.logs.id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.this.name
}

output "eks_cluster_endpoint" {
  description = "EKS Kubernetes API server endpoint"
  value       = aws_eks_cluster.this.endpoint
}

output "eks_cluster_ca_certificate" {
  description = "Base64-encoded CA certificate for kubectl"
  value       = aws_eks_cluster.this.certificate_authority[0].data
}

output "eks_oidc_provider_url" {
  description = "OIDC issuer URL for IAM Roles for Service Accounts"
  value       = aws_iam_openid_connect_provider.eks.url
}

output "configure_kubectl" {
  description = "Command to configure kubectl for the new EKS cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${aws_eks_cluster.this.name}"
}

output "rds_endpoint" {
  description = "RDS PostgreSQL connection endpoint"
  value       = aws_db_instance.app.address
}

output "lambda_function_name" {
  description = "Deployed Lambda function name"
  value       = aws_lambda_function.app.function_name
}

output "api_gateway_url" {
  description = "Invoke URL of the HTTP API"
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "sns_alerts_topic" {
  description = "SNS topic used for monitoring alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_dashboard" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "monthly_budget" {
  description = "AWS budget name"
  value       = aws_budgets_budget.monthly.name
}
