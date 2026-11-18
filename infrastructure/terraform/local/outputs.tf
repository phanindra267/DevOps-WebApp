output "web_url" {
  description = "URL of the locally simulated Nginx web server."
  value       = "http://localhost:${var.web_host_port}"
}

output "public_network_id" {
  description = "ID of the simulated public subnet."
  value       = docker_network.public.id
}

output "private_network_id" {
  description = "ID of the simulated private subnet."
  value       = docker_network.private.id
}

output "web_volume_name" {
  description = "Name of the simulated EBS volume."
  value       = docker_volume.webdata.name
}

output "webserver_container_id" {
  description = "ID of the simulated EC2 web-server container."
  value       = docker_container.webserver.id
}

output "private_app_container_id" {
  description = "ID of the simulated private app container."
  value       = docker_container.private_app.id
}
