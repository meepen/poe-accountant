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

resource "cloudflare_workers_script" "api_worker" {
  account_id = var.account_id
  name       = var.project_name
  content    = file("../projects/api/project/dist/index.js")
  module     = true
  
  dynamic "hyperdrive_config_binding" {
    for_each = var.hyperdrive_configs
    content {
      binding = hyperdrive_config_binding.key
      id = cloudflare_hyperdrive_config.api_worker[hyperdrive_config_binding.key].id
    }
  }

  dynamic "plain_text_binding" {
    for_each = var.environment_variables
    content {
      name = plain_text_binding.key
      text = plain_text_binding.value
    }
  }

  dynamic "secret_text_binding" {
    for_each = var.secrets
    content {
      name = secret_text_binding.key
      text = secret_text_binding.value
    }
  }

  compatibility_date  = "2026-01-18"
  compatibility_flags = ["nodejs_compat"]
}

resource "cloudflare_workers_domain" "api_worker" {
  for_each   = toset(var.custom_domains)
  account_id = var.account_id
  zone_id    = var.zone_id

  service    = cloudflare_workers_script.api_worker.name
  hostname   = each.value
}
