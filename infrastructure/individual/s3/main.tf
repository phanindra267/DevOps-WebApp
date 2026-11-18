# ==============================================================================
# COMPONENT 5: S3 BUCKET (individual, no CloudFormation)
# AWS equivalent: aws_s3_bucket with versioning, AES-256, public access block
# Local demo:     docker_container "registry:2" (object store) + docker_volume
#                 (persistent storage = versioning analog), no public exposure
# ==============================================================================
resource "docker_image" "registry" {
  name         = "registry:2"
  keep_locally = true
}

resource "docker_volume" "bucket" {
  name = var.bucket_name

  labels {
    label = "component"
    value = "s3"
  }
}

resource "docker_container" "s3_bucket" {
  name  = var.bucket_name
  image = docker_image.registry.image_id

  ports {
    internal = 5000
    external = var.host_port
    protocol = "tcp"
  }

  volumes {
    volume_name    = docker_volume.bucket.name
    container_path = "/var/lib/registry"
  }

  networks_advanced {
    name = var.network_name
  }

  labels {
    label = "component"
    value = "s3"
  }
}

variable "bucket_name" {
  type    = string
  default = "ca-s3-bucket"
}

variable "host_port" {
  type    = number
  default = 5002
}

variable "network_name" {
  description = "Network to attach the bucket to. S3 is a regional service (not inside a subnet); using the public network so its API is reachable, while access is still restricted."
  type        = string
  default     = "ca-public-subnet"
}

output "bucket_id" {
  value = docker_container.s3_bucket.id
}

output "bucket_url" {
  value = "http://localhost:${var.host_port}/v2/"
}

output "persistent_volume" {
  description = "Persistent volume (S3 object/version storage analog)"
  value       = docker_volume.bucket.name
}
