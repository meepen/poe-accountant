variable "cluster_name" {
  description = "Name of the cluster (used for registry naming)"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "registry_name" {
  description = "Name of the container registry"
  type        = string
  default     = null  # Will use cluster_name-registry if not set
}

variable "registry_subscription_tier" {
  description = "Subscription tier for the container registry"
  type        = string
  default     = "basic"  # Basic tier is $5/month
}
