output "app_id" {
  value = digitalocean_app.poe_accountant.id
}

output "app_urn" {
  value = digitalocean_app.poe_accountant.urn
}

output "app_url" {
  value = digitalocean_app.poe_accountant.default_ingress
}

output "live_url" {
  value = digitalocean_app.poe_accountant.live_url
}
