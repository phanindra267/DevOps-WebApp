aws_region      = "us-east-1"
environment     = "prod"
vpc_cidr        = "10.100.0.0/16"
azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
public_subnets  = ["10.100.1.0/24", "10.100.2.0/24", "10.100.3.0/24"]
private_subnets = ["10.100.10.0/24", "10.100.11.0/24", "10.100.12.0/24"]
