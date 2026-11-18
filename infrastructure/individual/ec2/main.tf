# ==============================================================================
# COMPONENT 4: EC2 WEB SERVER (individual, no CloudFormation)
# AWS equivalent: aws_instance (t2.micro, Amazon Linux, Nginx via user_data)
# Local demo:     docker_container running nginx, published on a host port,
#                 attached to the public-subnet network
# ==============================================================================
resource "docker_image" "nginx" {
  name         = "nginx:alpine"
  keep_locally = true
}

resource "docker_container" "web_server" {
  name  = var.instance_name
  image = docker_image.nginx.image_id

  ports {
    internal = 80
    external = var.host_port
    protocol = "tcp"
  }

  networks_advanced {
    name = var.public_network_name
  }

  labels {
    label = "component"
    value = "ec2"
  }
}

variable "instance_name" {
  type    = string
  default = "ca-ec2-webserver"
}

variable "host_port" {
  description = "Host port mapped to the web server (like an EC2 public IP:80)"
  type        = number
  default     = 8089
}

variable "public_network_name" {
  description = "Public subnet network name"
  type        = string
  default     = "ca-public-subnet"
}

output "instance_id" {
  value = docker_container.web_server.id
}

output "web_url" {
  value = "http://localhost:${var.host_port}"
}
