terraform {
  required_version = ">= 1.0"

  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0"
    }
  }
}

# Docker Desktop on Windows exposes the Linux engine over a named pipe.
provider "docker" {
  host = "npipe:////./pipe/dockerDesktopLinuxEngine"
}
