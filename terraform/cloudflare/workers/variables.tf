variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "project_name" {
  description = "Name of the Cloudflare Pages project for the worker"
  type        = string
}

variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the worker"
  type        = map(string)
  default     = {}
}

variable "r2_bucket_bindings" {
  description = "R2 bucket bindings for the worker"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Secrets for the worker"
  type        = map(string)
  default     = {}
}

variable "custom_domains" {
  description = "Custom domains for the worker"
  type        = list(string)
  default     = []
}

variable "hyperdrive_configs" {
  description = "Hyperdrive configuration for the worker"
  type = map(object({
    scheme   = string
    database = string
    host     = string
    port     = number
    user     = string
    password = string
  }))
  default = {}
}

variable "worker_script_path" {
  description = "Path to the worker script directory"
  type        = string
}

variable "api_token" {
  description = "Cloudflare API Token for Wrangler"
  type        = string
  sensitive   = true
}
