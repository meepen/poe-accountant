output "postgres_id" {
  description = "ID of the PostgreSQL database cluster"
  value       = digitalocean_database_cluster.postgres.id
}

output "postgres_urn" {
  description = "URN of the PostgreSQL database cluster"
  value       = digitalocean_database_cluster.postgres.urn
}

output "cluster_urn" {
  description = "URN of the PostgreSQL database cluster"
  value       = digitalocean_database_cluster.postgres.urn
}

output "postgres_name" {
    description = "Name of the Postgres cluster"
    value = digitalocean_database_cluster.postgres.name
}

output "postgres_host" {
  description = "PostgreSQL database host"
  value       = digitalocean_database_cluster.postgres.host
}

output "postgres_port" {
  description = "PostgreSQL database port"
  value       = digitalocean_database_cluster.postgres.port
}

output "postgres_uri" {
  description = "PostgreSQL connection URI"
  value       = digitalocean_database_cluster.postgres.uri
  sensitive   = true
}

output "postgres_private_uri" {
  description = "PostgreSQL private connection URI"
  value       = digitalocean_database_cluster.postgres.private_uri
  sensitive   = true
}

output "postgres_username" {
  description = "PostgreSQL database username"
  value       = digitalocean_database_cluster.postgres.user
}

output "postgres_password" {
  description = "PostgreSQL database password"
  value       = digitalocean_database_cluster.postgres.password
  sensitive   = true
}

output "database_name" {
  description = "Application database name"
  value       = digitalocean_database_db.app_database.name
}
