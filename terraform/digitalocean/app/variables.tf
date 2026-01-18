variable "app_name" {
  description = "Name of the App Platform app"
  type        = string
}

variable "region" {
  description = "Region for the app"
  type        = string
}

variable "project_id" {
  description = "ID of the DigitalOcean project to assign resources to"
  type        = string
}

variable "postgres_cluster_name" {
    description = "Name of the Postgres cluster to attach"
    type = string
}

variable "domain_name" {
    description = "Domain name for the app"
    type = string
    default = ""
}


variable "workers" {
  description = "Map of worker components"
  type = map(object({
    image_repository   = string
    image_tag          = string
    registry_type      = optional(string, "DOCR")
    instance_count     = optional(number, 1)
    instance_size_slug = optional(string, "basic-xxs")
    env                = optional(map(string), {})
  }))
  default = {}
}


variable "services" {
  description = "Map of service components"
  type = map(object({
    image_repository   = string
    image_tag          = string
    registry_type      = optional(string, "DOCR")
    instance_count     = optional(number, 1)
    instance_size_slug = optional(string, "basic-xxs")
    http_port          = optional(number, 80)
    env                = optional(map(string), {})
  }))
  default = {}
}

variable "ingress_rules" {
  description = "List of ingress rules"
  type = list(object({
    component_name = string
    path_prefix    = optional(string, "/")
  }))
  default = []
}

variable "registry_name" {
  description = "Name of the DOCR registry"
  type        = string
}
