variable "zone_id" {
  description = "The Cloudflare zone ID"
  type        = string
}

variable "records" {
  description = "List of DNS records to create"
  type = map(object({
    name     = optional(string)
    type     = string
    value    = string
    ttl      = optional(number, 3600)
    proxied  = optional(bool, false)
    priority = optional(number)
    comment  = optional(string)
  }))
}

variable "zone_name" {
  description = "The domain name for the zone (optional, used for data lookup if zone_id not provided)"
  type        = string
  default     = null
}
