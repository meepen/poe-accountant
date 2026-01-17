output "cert_pem" {
  value     = "${acme_certificate.site.certificate_pem}${acme_certificate.site.issuer_pem}"
  sensitive = true
}

output "key_pem" {
  value     = acme_certificate.site.private_key_pem
  sensitive = true
}
