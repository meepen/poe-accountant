output "project_id" {
  description = "ID of the DigitalOcean project"
  value       = module.project.project_id
}

output "frontend_domain" {
  description = "URL of the Frontend on Cloudflare Pages"
  value       = module.frontend.domain
}

output "valkey_id" {
  description = "ID of the Valkey database cluster"
  value       = module.valkey.cluster_urn
}

output "valkey_host" {
  description = "Valkey database host"
  value       = module.valkey.valkey_host
}

output "valkey_port" {
  description = "Valkey database port"
  value       = module.valkey.valkey_port
}

output "valkey_password" {
  description = "Valkey database password"
  value       = module.valkey.valkey_password
  sensitive   = true
}

output "postgres_id" {
  description = "ID of the PostgreSQL database cluster"
  value       = module.postgres.cluster_urn
}

output "postgres_host" {
  description = "PostgreSQL database host"
  value       = module.postgres.postgres_host
}

output "postgres_port" {
  description = "PostgreSQL database port"
  value       = module.postgres.postgres_port
}

output "postgres_username" {
  description = "PostgreSQL database username"
  value       = module.postgres.postgres_username
}

output "postgres_password" {
  description = "PostgreSQL database password"
  value       = module.postgres.postgres_password
  sensitive   = true
}

output "database_name" {
  description = "Application database name"
  value       = module.postgres.database_name
}

output "registry_id" {
  description = "ID of the container registry"
  value       = module.registry.registry_id
}

output "registry_name" {
  description = "Name of the container registry"
  value       = module.registry.registry_name
}

output "registry_endpoint" {
  description = "Endpoint URL of the container registry"
  value       = module.registry.registry_endpoint
}

output "api_domain" {
  description = "URL of the API on Cloudflare Workers"
  value       = module.api.domain
}
