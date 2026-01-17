data "cloudflare_ip_ranges" "cf" {}

locals {
  cf_cidrs = concat(data.cloudflare_ip_ranges.cf.ipv4_cidrs, data.cloudflare_ip_ranges.cf.ipv6_cidrs)
}
