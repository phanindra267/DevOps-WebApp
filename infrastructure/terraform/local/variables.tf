variable "resource_prefix" {
  description = "Prefix applied to every local resource name so nothing clashes with the existing cloudops-* containers."
  type        = string
  default     = "tf-local-"
}

variable "web_host_port" {
  description = "Host port published by the simulated EC2 web server (AWS-style port mapping)."
  type        = number
  default     = 8088
}

variable "web_container_port" {
  description = "Port Nginx listens on inside the container."
  type        = number
  default     = 80
}

variable "web_image_tag" {
  description = "Local tag for the custom Nginx image built from ./web."
  type        = string
  default     = "tf-local-webserver:latest"
}
