# Practical 5 + Practical 1 simulated locally with the Docker provider.
#
# AWS concept               -> local Docker equivalent
# ------------------------------------------------------------------
# VPC / public subnet      -> docker_network "tf-local-public"
# VPC / private subnet     -> docker_network "tf-local-private"
# EBS volume               -> docker_volume "tf-local-webdata"
# EC2 instance             -> docker_container "tf-local-webserver"
# Security group isolation -> separate bridge networks (no route between them)
# Nginx web server         -> custom image built from ./web (Nginx + index.html)

resource "docker_network" "public" {
  name   = "${var.resource_prefix}public"
  driver = "bridge"
}

resource "docker_network" "private" {
  name   = "${var.resource_prefix}private"
  driver = "bridge"
}

resource "docker_volume" "webdata" {
  name = "${var.resource_prefix}webdata"
}

# Base image, kept locally (mirrors pulling an AMI).
resource "docker_image" "nginx" {
  name         = "nginx:alpine"
  keep_locally = true
}

# Custom web-server image: built from the local Dockerfile in ./web.
resource "docker_image" "webserver" {
  name = var.web_image_tag

  build {
    context    = "${path.module}/web"
    dockerfile = "Dockerfile"
  }

  keep_locally = true
}

# Lightweight image for the isolated "private subnet" app.
resource "docker_image" "alpine" {
  name         = "alpine:latest"
  keep_locally = true
}

# Simulated EC2 instance in the public subnet, serving the custom page on 8088.
resource "docker_container" "webserver" {
  name  = "${var.resource_prefix}webserver"
  image = docker_image.webserver.image_id

  ports {
    internal = var.web_container_port
    external = var.web_host_port
    protocol = "tcp"
  }

  networks_advanced {
    name = docker_network.public.id
  }

  # Demonstrate the persistent EBS-style volume without hiding index.html.
  volumes {
    volume_name    = docker_volume.webdata.name
    container_path = "/usr/share/nginx/html/data"
  }
}

# Simulated private instance: isolated, no published ports, sleeps indefinitely.
resource "docker_container" "private_app" {
  name    = "${var.resource_prefix}private-app"
  image   = docker_image.alpine.image_id
  command = ["sleep", "infinity"]

  networks_advanced {
    name = docker_network.private.id
  }
}
