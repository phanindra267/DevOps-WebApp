# Shared Terraform provider versions for the individual AWS components.
# Locally these are demonstrated with the Docker provider (no AWS cost).
# For real AWS, swap in the hashicorp/aws provider files in each component.
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}
