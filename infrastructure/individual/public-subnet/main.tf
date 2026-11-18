# ==============================================================================
# COMPONENT 2: PUBLIC SUBNET (individual, no CloudFormation)
# AWS equivalent: aws_subnet with MapPublicIpOnLaunch=true + IGW route
# Local demo:     docker_network with published ports (internet reachable)
# ==============================================================================
resource "docker_network" "public_subnet" {
  name   = var.subnet_name
  driver = "bridge"

  ipam_config {
    subnet = var.subnet_cidr
  }

  labels {
    label = "component"
    value = "public-subnet"
  }
}

variable "subnet_name" {
  type    = string
  default = "ca-public-subnet"
}

variable "subnet_cidr" {
  description = "CIDR of the public subnet"
  type        = string
  default     = "172.23.1.0/24"
}

output "subnet_id" {
  value = docker_network.public_subnet.id
}

output "subnet_cidr" {
  value = var.subnet_cidr
}
