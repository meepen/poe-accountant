variable "project_name" {
  description = "Name of the project (used for resource naming)"
  type        = string
  default     = "poe-accountant"
}

variable "project_description" {
  description = "Description of the DigitalOcean project"
  type        = string
  default     = "Infrastructure for POE Accountant application"
}

variable "cluster_name" {
  description = "Name of the Kubernetes cluster"
  type        = string
  default     = null  # Will use project_name-cluster if not set
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
  default     = "nyc1"
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.33.1-do.3"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = null  # Will use [project_name, "terraform"] if not set
}

variable "valkey_name" {
  description = "Name of the Valkey database cluster"
  type        = string
  default     = null  # Will use cluster_name-valkey if not set
}

variable "valkey_version" {
  description = "Valkey version"
  type        = string
}

variable "valkey_size" {
  description = "Size of the Valkey database cluster"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "valkey_node_count" {
  description = "Number of Valkey nodes"
  type        = number
  default     = 1
}

variable "postgres_name" {
  description = "Name of the PostgreSQL database cluster"
  type        = string
  default     = null  # Will use cluster_name-postgres if not set
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "16"
}

variable "postgres_size" {
  description = "Size of the PostgreSQL database cluster"
  type        = string
  default     = "db-s-1vcpu-1gb"
}

variable "postgres_node_count" {
  description = "Number of PostgreSQL nodes"
  type        = number
  default     = 1
}

variable "database_name" {
  description = "Name of the application database"
  type        = string
  default     = null  # Will use project_name with underscores if not set
}

# Container Registry variables
variable "registry_name" {
  description = "Name of the container registry"
  type        = string
  default     = null  # Will use project_name-registry if not set
}

variable "registry_subscription_tier" {
  description = "Subscription tier for the container registry"
  type        = string
  default     = "basic"  # Basic tier is $5/month
}

# Cloudflare DNS variables
variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for DNS records"
  type        = string
  default     = null
}

variable "cloudflare_zone_name" {
  description = "Cloudflare zone name (domain) for DNS records"
  type        = string
}

variable "api_subdomain" {
  description = "Subdomain for the Application API"
  type        = string
}

variable "frontend_subdomain_name" {
  description = "Subdomain for the Application Frontend"
  type        = string
}

variable "do_token" {
  description = "DigitalOcean token"
  type        = string
  sensitive   = true
}

variable "email_address" {
  description = "Email address for ACME registration"
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS edit permissions"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "github_owner" {
  description = "GitHub owner/organization"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "poe-accountant"
}

variable "production_branch" {
  description = "Production branch name"
  type        = string
  default     = "main"
}

variable "pathofexile_client_id" {
  description = "Path of Exile OAuth Client ID"
  type        = string
}

variable "pathofexile_client_secret" {
  description = "Path of Exile OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "pathofexile_redirect_url" {
  description = "Path of Exile OAuth Redirect URL"
  type        = string
}
