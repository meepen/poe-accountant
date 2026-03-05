variable "account_id" {
  type = string
}

variable "bucket_name" {
  type = string
}

variable "location" {
  type    = string
  default = "WNAM"
}

variable "public_custom_domain" {
  description = "Optional custom domain to expose the bucket publicly"
  type        = string
  default     = null
}

variable "cloudflare_api_key" {
  description = "Cloudflare Global API key for R2 domain management"
  type        = string
  sensitive   = true
  default     = null
}

variable "cloudflare_api_email" {
  description = "Cloudflare account email for R2 domain management"
  type        = string
  default     = null
}
