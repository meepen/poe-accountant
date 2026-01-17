terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

resource "digitalocean_container_registry" "main" {
  name                   = var.registry_name != null ? var.registry_name : "${var.cluster_name}-registry"
  subscription_tier_slug = var.registry_subscription_tier
  region                 = var.region
}

# Request Docker credentials for the registry you just created
resource "digitalocean_container_registry_docker_credentials" "creds" {
  depends_on = [resource.digitalocean_container_registry.main]
  registry_name  = digitalocean_container_registry.main.name
  write          = false          # true = push & pull; false = pull only
}
