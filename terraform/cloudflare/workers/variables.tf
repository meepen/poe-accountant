variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "project_name" {
  description = "Name of the Cloudflare Pages project for the worker"
  type        = string
}

variable "github_owner" {
  description = "GitHub owner/organization"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
}

variable "production_branch" {
  description = "Production branch name"
  type        = string
  default     = "main"
}

variable "environment_variables" {
  description = "Environment variables for the worker"
  type        = map(string)
  default     = {}
}

variable "custom_domains" {
  description = "Custom domains for the worker"
  type        = list(string)
  default     = []
}
