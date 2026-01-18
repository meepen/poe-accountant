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

    dynamic "worker" {
      for_each = var.workers
      content {
        name               = worker.key
        instance_count     = worker.value.instance_count
        instance_size_slug = worker.value.instance_size_slug

        image {
          registry_type = worker.value.registry_type
          repository    = worker.value.image_repository
          tag           = worker.value.image_tag
        }

        dynamic "env" {
          for_each = merge({ NODE_ENV = "production" }, worker.value.env)
          content {
            key   = env.key
            value = env.value
          }
        }
      }
    }

    dynamic "service" {
      for_each = var.services
      content {
        name               = service.key
        instance_count     = service.value.instance_count
        instance_size_slug = service.value.instance_size_slug
        http_port          = service.value.http_port

        image {
          registry_type = service.value.registry_type
          repository    = service.value.image_repository
          tag           = service.value.image_tag
        }

        dynamic "env" {
          for_each = service.value.env
          content {
            key   = env.key
            value = env.value
          }
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

    dynamic "ingress" {
      for_each = length(var.ingress_rules) > 0 ? [1] : []
      content {
        dynamic "rule" {
          for_each = var.ingress_rules
          content {
            component {
              name = rule.value.component_name
            }
            match {
              path {
                prefix = rule.value.path_prefix
              }
            }
          }
        }
      }
    }
  }
    
  project_id = var.project_id
}
