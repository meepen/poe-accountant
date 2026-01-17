terraform {
  required_providers {
    digitalocean = {
      source = "digitalocean/digitalocean"
    }
  }
}

resource "digitalocean_app" "poe_accountant" {
  spec {
    name   = var.app_name
    region = var.region

    # Backend Worker (Ninja)
    worker {
      name               = "ninja"
      instance_count     = 1
      instance_size_slug = "basic-xxs"

      image {
        registry_type = "DOCR"
        repository    = var.image_repository
        tag           = var.image_tag
      }

      
      dynamic "env" {
        for_each = merge({ NODE_ENV = "production" }, var.environment_variables)
        content {
            key   = env.key
            value = env.value
        }
      }
    }
    
    # Database attachment (Postgres)
    database {
        name = "db"
        cluster_name = var.postgres_cluster_name
        engine = "PG"
        production = true
    }
    
    # Domain
    dynamic "domain" {
        for_each = var.domain_name != "" ? [1] : []
        content {
            name = var.domain_name
            type = "PRIMARY"
        }
    }
  }
    
  project_id = var.project_id
}
