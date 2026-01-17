output "proxy_list" {
  description = "CIDR ranges for Cloudflare proxies"
  value       = local.cf_cidrs
}
