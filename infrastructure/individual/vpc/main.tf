# ==============================================================================
# COMPONENT 1: VPC  (individual, no CloudFormation)
# AWS equivalent: aws_vpc
# Local demo:     docker_network  "virtual private cloud" boundary
# ==============================================================================
resource "docker_network" "vpc" {
  name   = var.vpc_name
  driver = "bridge"

  labels {
    label = "component"
    value = "vpc"
  }
}

variable "vpc_name" {
  description = "Name of the VPC / network boundary"
  type        = string
  default     = "ca-vpc"
}

output "vpc_id" {
  description = "VPC / network ID"
  value       = docker_network.vpc.id
}

output "vpc_name" {
  value = docker_network.vpc.name
}
