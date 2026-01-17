terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

resource "digitalocean_database_cluster" "valkey" {
  name       = var.valkey_name != null ? var.valkey_name : "${var.cluster_name}-valkey"
  engine     = "valkey"
  version    = var.valkey_version
  size       = var.valkey_size
  region     = var.region
  node_count = var.valkey_node_count

  tags = var.tags
}
