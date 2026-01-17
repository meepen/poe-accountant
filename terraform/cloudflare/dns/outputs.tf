output "records" {
  description = "The created DNS records"
  value = {
    for key, record in cloudflare_record.records : key => {
      id       = record.id
      name     = record.name
      type     = record.type
      value    = record.value
      ttl      = record.ttl
      proxied  = record.proxied
      priority = record.priority
      comment  = record.comment
      fqdn     = record.hostname
    }
  }
}

output "zone_id" {
  description = "The zone ID used for the records"
  value       = local.zone_id
}

output "record_count" {
  description = "Number of DNS records created"
  value       = length(cloudflare_record.records)
}
