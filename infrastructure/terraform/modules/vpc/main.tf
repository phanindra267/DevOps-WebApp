module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = var.name
  cidr = var.cidr
  azs  = var.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets

  tags = {
    Owner = "CloudOps Sentinel"
  }
}

variable "name" { type = string }
variable "cidr" { type = string }
variable "azs" { type = list(string) }
variable "public_subnets" { type = list(string) }
variable "private_subnets" { type = list(string) }
