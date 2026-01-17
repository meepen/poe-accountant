output "pages_project_name" {
  value = cloudflare_pages_project.frontend.name
}

output "pages_dev_domain" {
  value = cloudflare_pages_project.frontend.subdomain
}

output "pages_url" {
  value = "https://${cloudflare_pages_project.frontend.subdomain}"
}
