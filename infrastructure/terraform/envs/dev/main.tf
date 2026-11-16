# ==============================================================================
# [SAFE LOCAL DEMO MODE] 
# This template is for academic demonstration & IaC comparison only.
# Running the CloudOps Sentinel local app does NOT execute this against AWS.
# Zero cloud costs will be incurred during local evaluation.
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source          = "../../modules/vpc"
  name            = "${var.environment}-cloudops-vpc"
  cidr            = var.vpc_cidr
  azs             = var.azs
  public_subnets  = var.public_subnets
  private_subnets = var.private_subnets
}

module "ecs_cluster" {
  source       = "../../modules/ecs_cluster"
  name         = "${var.environment}-cloudops-ecs"
  cluster_name = "${var.environment}-cluster"
}
