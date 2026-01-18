locals {
  cluster_name         = var.cluster_name != null ? var.cluster_name : "${var.project_name}-cluster"
  database_name        = var.database_name != null ? var.database_name : replace(var.project_name, "-", "_")
  tags                 = var.tags != null ? var.tags : [var.project_name, "terraform"]
  full_api_domain_name = "${var.api_subdomain}.${var.cloudflare_zone_name}"
}

module "project" {
  source = "./digitalocean/project"

  project_name        = var.project_name
  project_description = var.project_description
  resource_urns = [
    module.valkey.cluster_urn,
    module.postgres.cluster_urn,
    module.apps.app_urn
  ]
}

module "valkey" {
  source = "./digitalocean/valkey"

  cluster_name      = local.cluster_name
  region            = var.region
  valkey_name       = var.valkey_name
  valkey_version    = var.valkey_version
  valkey_size       = var.valkey_size
  valkey_node_count = var.valkey_node_count
  tags              = local.tags
}

module "postgres" {
  source = "./digitalocean/postgres"

  cluster_name         = local.cluster_name
  region               = var.region
  postgres_name        = var.postgres_name
  postgres_version     = var.postgres_version
  postgres_size        = var.postgres_size
  postgres_node_count  = var.postgres_node_count
  database_name        = local.database_name
  tags                 = local.tags
}

module "registry" {
  source = "./digitalocean/registry"

  cluster_name               = local.cluster_name
  region                     = var.region
  registry_name              = var.registry_name
  registry_subscription_tier = var.registry_subscription_tier
}

module "apps" {
  source = "./digitalocean/app"

  app_name = "${var.project_name}-ninja"
  region   = var.region
  project_id = module.project.project_id

  registry_name = module.registry.registry_name
  
  postgres_cluster_name = module.postgres.postgres_name

  domain_name = ""
  
  workers = {
    "background-processor" = {
      image_repository = "background-processor" 
      image_tag        = "latest"
      registry_type    = "DOCR"
      env = {
          "REDIS_HOST"        = module.valkey.valkey_host
          "REDIS_PORT"        = module.valkey.valkey_port
          "REDIS_PASSWORD"    = module.valkey.valkey_password
          "DATABASE_HOST"     = "$${db.HOSTNAME}"
          "DATABASE_PORT"     = "$${db.PORT}"
          "DATABASE_NAME"     = "$${db.DATABASE}"
          "DATABASE_USERNAME" = "$${db.USERNAME}"
          "DATABASE_PASSWORD" = "$${db.PASSWORD}"
      }
    }
  }

  services = {
    "valkey-proxy" = {
      image_repository = "valkey-proxy"
      image_tag        = "latest"
      registry_type    = "DOCR"
      http_port        = 80
      env = {
        "SRH_MODE"              = "env"
        "SRH_PORT"              = "80"
        "SRH_TOKEN"             = module.valkey.valkey_password
        "SRH_CONNECTION_STRING" = "rediss://:${module.valkey.valkey_password}@${module.valkey.valkey_host}:${module.valkey.valkey_port}?ssl=true"
      }
    }
  }

  ingress_rules = [
    {
      component_name = "valkey-proxy"
      path_prefix    = "/"
    }
  ]
}

module "frontend" {
  source = "./cloudflare/pages"

  account_id   = var.cloudflare_account_id
  project_name = "${var.project_name}-frontend"
  
  github_owner = var.github_owner
  github_repo  = var.github_repo

  domain_names = [
    "${var.frontend_subdomain_name}.${var.cloudflare_zone_name}",
    var.cloudflare_zone_name,
    "www.${var.cloudflare_zone_name}"
  ]
  production_branch = var.production_branch
  
  environment_variables = {
    VITE_API_URL = "https://${var.api_subdomain}.${var.cloudflare_zone_name}"
  }
}

module "api" {
  source = "./cloudflare/workers"

  account_id   = var.cloudflare_account_id
  project_name = "${var.project_name}-api"
  
  github_owner = var.github_owner
  github_repo  = var.github_repo
  
  custom_domains = [local.full_api_domain_name]
  
  environment_variables = {
    DATABASE_URL = module.postgres.postgres_uri
    VALKEY_URL   = module.apps.live_url
    VALKEY_TOKEN = module.valkey.valkey_password
  }
}

# Cloudflare DNS
module "cloudflare_dns" {
  source = "./cloudflare/dns"

  zone_id   = var.cloudflare_zone_id
  zone_name = var.cloudflare_zone_name

  records = {
    main = {
      name    = "@"
      type    = "CNAME"
      value   = module.frontend.domain
      proxied = true
      ttl     = 1
    }
    www = {
      name    = "www"
      type    = "CNAME"
      value   = module.frontend.domain
      proxied = true
      ttl     = 1
    }
    frontend = {
      name    = var.frontend_subdomain_name
      type    = "CNAME"
      value   = module.frontend.domain
      proxied = true
      ttl     = 1
    }

    api = {
      name    = var.api_subdomain
      type    = "CNAME"
      value   = module.api.domain
      proxied = true
      ttl     = 1
    }
  }
}
