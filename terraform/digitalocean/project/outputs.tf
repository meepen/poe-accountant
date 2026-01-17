output "project_id" {
  description = "ID of the DigitalOcean project"
  value       = digitalocean_project.main.id
}

output "project_name" {
  description = "Name of the DigitalOcean project"
  value       = digitalocean_project.main.name
}

output "project_description" {
  description = "Description of the DigitalOcean project"
  value       = digitalocean_project.main.description
}

output "project_purpose" {
  description = "Purpose of the DigitalOcean project"
  value       = digitalocean_project.main.purpose
}
