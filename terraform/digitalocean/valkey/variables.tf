variable "cluster_name" {
  description = "Name of the cluster (used for Valkey naming)"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "valkey_name" {
  description = "Name of the Valkey database cluster"
  type        = string
  default     = null  # Will use cluster_name-valkey if not set
}

variable "valkey_version" {
  description = "Valkey version"
  type        = string
  default     = "7"
}

variable "valkey_size" {
  description = "Size of the Valkey database cluster"
  type        = string
}

variable "valkey_node_count" {
  description = "Number of Valkey nodes"
  type        = number
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = []
}
