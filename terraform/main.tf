locals {
  cluster_name                    = var.cluster_name != null ? var.cluster_name : "${var.project_name}-cluster"
  database_name                   = var.database_name != null ? var.database_name : replace(var.project_name, "-", "_")
  tags                            = var.tags != null ? var.tags : [var.project_name, "terraform"]
  full_api_domain_name            = "${var.api_subdomain}.${var.cloudflare_zone_name}"
  full_assets_domain_name         = "${var.assets_subdomain}.${var.cloudflare_zone_name}"
  cdn_bucket_name                 = var.r2_cdn_bucket_name != null ? var.r2_cdn_bucket_name : "${var.project_name}-cdn"
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

  cluster_name        = local.cluster_name
  region              = var.region
  postgres_name       = var.postgres_name
  postgres_version    = var.postgres_version
  postgres_size       = var.postgres_size
  postgres_node_count = var.postgres_node_count
  database_name       = local.database_name
  tags                = local.tags
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

  app_name   = "${var.project_name}-ninja"
  region     = var.region
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
        "VALKEY_URL"                              = module.valkey.valkey_uri
        "DATABASE_URL"                            = module.postgres.postgres_uri
        "ASSETS_S3_BUCKET_NAME"       = module.r2.bucket_name
        "ASSETS_S3_ENDPOINT"          = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
        "ASSETS_S3_ACCESS_KEY_ID"     = module.r2.access_key_id
        "ASSETS_S3_SECRET_ACCESS_KEY" = module.r2.secret_access_key
        "CDN_S3_BUCKET_NAME"          = module.r2_cdn.bucket_name
        "CDN_S3_ENDPOINT"             = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
        "CDN_S3_ACCESS_KEY_ID"        = module.r2_cdn.access_key_id
        "CDN_S3_SECRET_ACCESS_KEY"    = module.r2_cdn.secret_access_key
        "CDN_BASE_URL"                = "https://${local.full_assets_domain_name}"
        "PATHOFEXILE_CLIENT_ID"                   = var.pathofexile_client_id
        "PATHOFEXILE_CLIENT_SECRET"               = var.pathofexile_client_secret
        "PATHOFEXILE_CONTACT_EMAIL"               = var.pathofexile_contact_email
        "PATHOFEXILE_APP_VERSION"                 = var.pathofexile_app_version
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
    var.cloudflare_zone_name,
    "www.${var.cloudflare_zone_name}"
  ]
  production_branch = var.production_branch

  environment_variables = {
    VITE_API_BASE_URL = "https://${var.api_subdomain}.${var.cloudflare_zone_name}"
    VITE_CDN_BASE_URL = "https://${local.full_assets_domain_name}"
  }
}

module "api" {
  source = "./cloudflare/workers"

  account_id   = var.cloudflare_account_id
  zone_id      = var.cloudflare_zone_id
  project_name = "${var.project_name}-api"


  custom_domains = [local.full_api_domain_name]

  environment_variables = {
    VALKEY_PROXY_URL = module.apps.live_url
    CORS_ORIGIN      = "https://${var.cloudflare_zone_name}"
    FRONTEND_URL     = "https://${var.cloudflare_zone_name}"

    PATHOFEXILE_CLIENT_ID    = var.pathofexile_client_id
    PATHOFEXILE_REDIRECT_URL = var.pathofexile_redirect_url

    ASSETS_S3_ENDPOINT    = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
    ASSETS_S3_BUCKET_NAME = module.r2.bucket_name
  }

  secrets = {
    DATABASE_URL = module.postgres.postgres_uri
    VALKEY_TOKEN = module.valkey.valkey_password

    PATHOFEXILE_CLIENT_SECRET = var.pathofexile_client_secret

    ASSETS_S3_ACCESS_KEY_ID     = module.r2.access_key_id
    ASSETS_S3_SECRET_ACCESS_KEY = sha256(module.r2.secret_access_key)
  }

  hyperdrive_configs = {
    "HYPERDRIVE" = {
      scheme   = "postgres"
      database = local.database_name
      host     = module.postgres.postgres_host
      port     = module.postgres.postgres_port
      user     = module.postgres.postgres_username
      password = module.postgres.postgres_password
    }
  }

  r2_bucket_bindings = {
    BUCKET = module.r2.bucket_name
  }

  worker_script_path = abspath("${path.module}/../projects/api/project")
  api_token          = cloudflare_api_token.wrangler_deploy.value
}

module "r2" {
  source = "./cloudflare/r2"

  account_id  = var.cloudflare_account_id
  bucket_name = var.r2_bucket_name
}

module "r2_cdn" {
  source = "./cloudflare/r2"

  account_id  = var.cloudflare_account_id
  bucket_name = local.cdn_bucket_name

  public_custom_domain = local.full_assets_domain_name
  cloudflare_api_key   = var.cloudflare_api_key
  cloudflare_api_email = var.cloudflare_api_email
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
  }
}

# Cloudflare API Token for Wrangler Deploy
data "cloudflare_api_token_permission_groups" "all" {}
data "cloudflare_user" "me" {}

resource "cloudflare_api_token" "wrangler_deploy" {
  name = "wrangler-deploy-token"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.account["Workers Scripts Write"],
      data.cloudflare_api_token_permission_groups.all.account["Workers R2 Storage Write"],
      data.cloudflare_api_token_permission_groups.all.account["Account Settings Read"],
      data.cloudflare_api_token_permission_groups.all.user["User Details Read"],
      data.cloudflare_api_token_permission_groups.all.user["Memberships Read"],
      data.cloudflare_api_token_permission_groups.all.zone["Workers Routes Write"],
      data.cloudflare_api_token_permission_groups.all.zone["Zone Read"],
      data.cloudflare_api_token_permission_groups.all.zone["DNS Write"]
    ]
    resources = {
      "com.cloudflare.api.account.${var.cloudflare_account_id}"   = "*"
      "com.cloudflare.api.account.zone.${var.cloudflare_zone_id}" = "*"
      "com.cloudflare.api.user.${data.cloudflare_user.me.id}"     = "*"
    }
  }
}
