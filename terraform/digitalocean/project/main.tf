terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

resource "digitalocean_project" "main" {
  name        = var.project_name
  description = var.project_description
  purpose     = "Web Application"
}

# Assign resources to the project
resource "digitalocean_project_resources" "main" {
  project = digitalocean_project.main.id
  resources = var.resource_urns
}
