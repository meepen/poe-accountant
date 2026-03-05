terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

data "cloudflare_api_token_permission_groups" "all" {}

resource "cloudflare_r2_bucket" "bucket" {
  account_id = var.account_id
  name       = var.bucket_name
  location   = var.location
}

resource "cloudflare_api_token" "r2" {
  name = "${var.bucket_name}-token"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Write"],
      data.cloudflare_api_token_permission_groups.all.r2["Workers R2 Storage Bucket Item Read"],
    ]
    resources = {
      "com.cloudflare.edge.r2.bucket.${var.account_id}_default_${cloudflare_r2_bucket.bucket.name}" = "*"
    }
  }
}

resource "null_resource" "public_custom_domain" {
  count = var.public_custom_domain != null && var.cloudflare_api_key != null && var.cloudflare_api_email != null ? 1 : 0

  triggers = {
    account_id  = var.account_id
    bucket_name = cloudflare_r2_bucket.bucket.name
    domain      = var.public_custom_domain
  }

  provisioner "local-exec" {
    command = <<-EOT
      set -euo pipefail
      API_BASE="https://api.cloudflare.com/client/v4/accounts/${var.account_id}/r2/buckets/${cloudflare_r2_bucket.bucket.name}/domains/custom"

      curl -fsS -X POST "$API_BASE" \
        -H "X-Auth-Email: ${var.cloudflare_api_email}" \
        -H "X-Auth-Key: ${var.cloudflare_api_key}" \
        -H "Content-Type: application/json" \
        --data '{"domain":"${var.public_custom_domain}","enabled":true}' >/dev/null || true

      curl -fsS -X PUT "$API_BASE/${var.public_custom_domain}" \
        -H "X-Auth-Email: ${var.cloudflare_api_email}" \
        -H "X-Auth-Key: ${var.cloudflare_api_key}" \
        -H "Content-Type: application/json" \
        --data '{"enabled":true}' >/dev/null
    EOT
  }
}
