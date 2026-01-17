variable "project_name" {
  description = "Name of the DigitalOcean project"
  type        = string
}

variable "project_description" {
  description = "Description of the DigitalOcean project"
  type        = string
}

variable "resource_urns" {
  description = "List of resource URNs to assign to the project"
  type        = list(string)
}
