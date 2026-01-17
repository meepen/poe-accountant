terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# Optional: Data source to lookup zone by name if zone_id is not provided
data "cloudflare_zone" "zone" {
  count = var.zone_name != null && var.zone_id == null ? 1 : 0
  name  = var.zone_name
}

locals {
  zone_id = var.zone_id != null ? var.zone_id : (var.zone_name != null ? data.cloudflare_zone.zone[0].id : null)
}

resource "cloudflare_record" "records" {
  for_each = var.records

  zone_id         = local.zone_id
  allow_overwrite = true
  name            = each.value.name
  type            = each.value.type
  content  = each.value.value
  ttl      = each.value.ttl
  proxied  = each.value.type == "CNAME" || each.value.type == "A" ? each.value.proxied : false
  priority = each.value.priority
  comment  = each.value.comment

  lifecycle {
    precondition {
      condition     = local.zone_id != null
      error_message = "Either zone_id or zone_name must be provided."
    }
  }
}
