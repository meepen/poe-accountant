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

variable "zone_id" {
  description = "Cloudflare Zone ID for the custom domain (required if public_custom_domain is set)"
  type        = string
  default     = null
}
