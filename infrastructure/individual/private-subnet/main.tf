# ==============================================================================
# COMPONENT 3: PRIVATE SUBNET (individual, no CloudFormation)
# AWS equivalent: aws_subnet with its own route table, no internet route
# Local demo:     docker_network with internal=true (no external egress/ingress)
# ==============================================================================
resource "docker_network" "private_subnet" {
  name     = var.subnet_name
  driver   = "bridge"
  internal = true   # no NAT / no internet route - matches AWS private subnet

  ipam_config {
    subnet = var.subnet_cidr
  }

  labels {
    label = "component"
    value = "private-subnet"
  }
}

variable "subnet_name" {
  type    = string
  default = "ca-private-subnet"
}

variable "subnet_cidr" {
  description = "CIDR of the private subnet"
  type        = string
  default     = "172.24.2.0/24"
}

output "subnet_id" {
  value = docker_network.private_subnet.id
}

output "subnet_cidr" {
  value = var.subnet_cidr
}
