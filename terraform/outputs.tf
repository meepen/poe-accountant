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

output "api_hyperdrive_id" {
  value = module.api.hyperdrive_ids["HYPERDRIVE"]
}

output "r2_bucket_name" {
  value = module.r2.bucket_name
}

output "r2_cdn_bucket_name" {
  value = module.r2_cdn.bucket_name
}

output "r2_access_key_id" {
  value = module.r2.access_key_id
}

output "r2_secret_access_key" {
  value     = module.r2.secret_access_key
  sensitive = true
}

output "postgres_password" {
  description = "PostgreSQL database password"
  value       = module.postgres.postgres_password
  sensitive   = true
}

output "valkey_uri" {
  description = "Valkey connection URI"
  value       = module.valkey.valkey_uri
  sensitive   = true
}

output "postgres_url" {
  description = "PostgreSQL connection URL"
  value       = module.postgres.postgres_uri
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
output "api_domain_name" { value = local.full_api_domain_name }

output "assets_domain_name" { value = local.full_assets_domain_name }

output "cdn_public_base_url" {
  value = "https://${module.r2_cdn.public_custom_domain}"
}

output "valkey_proxy_url" {
  description = "URL of the Valkey Proxy on DigitalOcean App Platform"
  value       = module.apps.live_url
}

output "wrangler_deploy_token" {
  description = "Cloudflare API Token for Wrangler Deploy"
  value       = cloudflare_api_token.wrangler_deploy.value
  sensitive   = true
}
