terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_hyperdrive_config" "api_worker" {
  for_each   = var.hyperdrive_configs

  account_id = var.account_id
  name       = "${var.project_name}-hyperdrive-config-${lower(each.key)}"
  origin     = {
    scheme     = each.value.scheme
    database   = each.value.database
    host       = each.value.host
    port       = each.value.port
    user       = each.value.user
    password   = each.value.password
  }
}
