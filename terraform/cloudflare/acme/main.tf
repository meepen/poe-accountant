provider "acme" {
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}

resource "tls_private_key" "acme" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Create or reuse an ACME account
resource "acme_registration" "me" {
  account_key_pem = tls_private_key.acme.private_key_pem
  email_address   = var.email_address
}


# Issue a cert via Cloudflare DNS-01 (reads CF_API_TOKEN from env)
resource "acme_certificate" "site" {
  account_key_pem = acme_registration.me.account_key_pem
  common_name     = var.domain_names[0]
  subject_alternative_names = var.domain_names

  dns_challenge {
    provider = "cloudflare"
  }
}
