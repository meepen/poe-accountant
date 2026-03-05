terraform {
  required_providers {
    cloudflare = {
      source  = "registry.terraform.io/cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

data "cloudflare_api_token_permission_groups_list" "all" {}

locals {
  permissions_map = {
    for perm in data.cloudflare_api_token_permission_groups_list.all.result : perm.name => perm.id...
  }
}

resource "cloudflare_r2_bucket" "bucket" {
  account_id = var.account_id
  name       = var.bucket_name
  location   = var.location
}

resource "cloudflare_api_token" "r2" {
  name = "${var.bucket_name}-token"

  policies = [{
    effect = "allow"

    permission_groups = [
      { id = local.permissions_map["Workers R2 Storage Bucket Item Write"][0] },
      { id = local.permissions_map["Workers R2 Storage Bucket Item Read"][0] }
    ]

    resources = jsonencode({
      "com.cloudflare.edge.r2.bucket.${var.account_id}_default_${cloudflare_r2_bucket.bucket.name}" = "*"
    })
  }]
}

resource "cloudflare_r2_custom_domain" "public_custom_domain" {
  count = var.public_custom_domain != null ? 1 : 0

  account_id  = var.account_id
  bucket_name = cloudflare_r2_bucket.bucket.name
  domain      = var.public_custom_domain
  enabled     = true

  zone_id = var.zone_id

  min_tls = "1.3"
}
