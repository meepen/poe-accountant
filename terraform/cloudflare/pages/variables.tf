variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "project_name" {
  description = "Name of the Pages project"
  type        = string
}

variable "production_branch" {
  description = "Production branch name"
  type        = string
  default     = "main"
}

variable "environment_variables" {
  description = "Environment variables for the project"
  type        = map(string)
  default     = {}
}

variable "github_owner" {
  description = "GitHub owner/organization"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "domain_names" {
  description = "Custom domain names for the Pages project"
  type        = list(string)
}
