variable "cluster_name" {
  description = "Name of the cluster (used for PostgreSQL naming)"
  type        = string
}

variable "region" {
  description = "DigitalOcean region"
  type        = string
}

variable "postgres_name" {
  description = "Name of the PostgreSQL database cluster"
  type        = string
  default     = null  # Will use cluster_name-postgres if not set
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "17"
}

variable "postgres_size" {
  description = "Size of the PostgreSQL database cluster"
  type        = string
}

variable "postgres_node_count" {
  description = "Number of PostgreSQL nodes"
  type        = number
}

variable "database_name" {
  description = "Name of the application database"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = list(string)
  default     = []
}
