output "hyperdrive_ids" {
  value = {
    for k, v in cloudflare_hyperdrive_config.api_worker : k => v.id
  }
}

