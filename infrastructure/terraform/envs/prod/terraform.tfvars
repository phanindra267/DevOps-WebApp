aws_region      = "ap-south-1"
environment     = "prod"
vpc_cidr        = "10.100.0.0/16"
azs             = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]
public_subnets  = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
private_subnets = ["10.100.10.0/24", "10.100.11.0/24", "10.100.12.0/24"]
