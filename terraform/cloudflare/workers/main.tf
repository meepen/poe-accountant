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
locals {
  source_files = setunion(
    fileset(var.worker_script_path, "src/**"),
    fileset(var.worker_script_path, "package.json"),
    fileset(var.worker_script_path, "pnpm-lock.yaml"),
    fileset(var.worker_script_path, "tsconfig.json")
  )
  source_hash = sha1(join("", [for f in local.source_files : filesha1("${var.worker_script_path}/${f}")]))
}

resource "local_file" "wrangler_config" {
  content = templatefile("${path.module}/wrangler.toml.tftpl", {
    project_name          = var.project_name
    account_id            = var.account_id
    environment_variables = var.environment_variables
    r2_bucket_bindings    = var.r2_bucket_bindings
    hyperdrive_configs    = var.hyperdrive_configs
    hyperdrive_ids        = { for k, v in cloudflare_hyperdrive_config.api_worker : k => v.id }
    custom_domains        = var.custom_domains
  })
  filename = "${var.worker_script_path}/wrangler.tf.toml"
}

resource "null_resource" "deploy_worker" {
  depends_on = [local_file.wrangler_config]
  triggers = {
    source_hash = local.source_hash
    config_hash = local_file.wrangler_config.content_sha1
  }

  provisioner "local-exec" {
    command = "cd ${var.worker_script_path} && pnpm wrangler deploy -c wrangler.tf.toml"
    environment = {
      CLOUDFLARE_API_TOKEN = var.api_token
    }
  }
}

resource "null_resource" "worker_secrets" {
  for_each = var.secrets

  triggers = {
    value     = each.value
    worker_id = null_resource.deploy_worker.id
  }

  provisioner "local-exec" {
    command     = "cd ${var.worker_script_path} && echo \"${each.value}\" | pnpm wrangler secret put ${each.key} -c wrangler.tf.toml"
    interpreter = ["/bin/bash", "-c"]
    environment = {
      CLOUDFLARE_API_TOKEN = var.api_token
    }
  }
}
