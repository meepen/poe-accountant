output "bucket_name" {
  value = cloudflare_r2_bucket.bucket.name
}

output "bucket_domain" {
  value = cloudflare_r2_bucket.bucket.id
}

output "access_key_id" {
  value = cloudflare_api_token.r2.id
}

output "secret_access_key" {
  value     = sha256(cloudflare_api_token.r2.value)
  sensitive = true
}

output "public_custom_domain" {
  value = var.public_custom_domain
}
