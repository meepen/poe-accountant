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

variable "image_repository" {
  description = "Repository name for the image"
  type        = string
}

variable "image_tag" {
  description = "Tag for the image"
  type        = string
}

variable "environment_variables" {
    description = "Map of environment variables to inject into services"
    type = map(string)
    default = {}
}
