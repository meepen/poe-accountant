output "name" {
  value = cloudflare_pages_project.api_worker.name
}

output "subdomain" {
  value = cloudflare_pages_project.api_worker.subdomain
}

output "url" {
  value = var.custom_domain != null ? "https://${var.custom_domain}" : "https://${cloudflare_pages_project.api_worker.subdomain}"
}
