output "registry_id" {
  description = "ID of the container registry"
  value       = digitalocean_container_registry.main.id
}

output "registry_name" {
  description = "Name of the container registry"
  value       = digitalocean_container_registry.main.name
}

output "registry_endpoint" {
  description = "Endpoint URL of the container registry"
  value       = digitalocean_container_registry.main.endpoint
}

output "registry_server_url" {
  description = "Server URL of the container registry"
  value       = digitalocean_container_registry.main.server_url
}

output "registry_credentials" {
  description = "Credentials for registry authentication"
  value       = digitalocean_container_registry_docker_credentials.creds.docker_credentials
  sensitive   = true
}
