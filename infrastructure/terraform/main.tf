module "backend" {
  source = "./modules/backend"
}

module "vpc" {
  source = "./modules/vpc"
}

module "ecs_cluster" {
  source = "./modules/ecs_cluster"
}
