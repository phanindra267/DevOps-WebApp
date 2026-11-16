module "ecs_cluster" {
  source  = "terraform-aws-modules/ecs/aws"
  version = "5.1.0"

  name = var.name
  cluster_name = var.cluster_name

  tags = {
    Owner = "CloudOps Sentinel"
  }
}

variable "name" { type = string }
variable "cluster_name" { type = string }
