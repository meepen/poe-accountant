output "name" {
  value = cloudflare_workers_script.api_worker.name
}

output "domain" {
  value = "${cloudflare_workers_script.api_worker.name}.workers.dev"
}

