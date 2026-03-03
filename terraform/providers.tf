terraform {
  backend "s3" {}

  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "~> 3.4"
    }
    external = {
      source = "hashicorp/external"
      version = "~> 2.3"
    }
    acme = {
      source  = "vancluever/acme"
      version = "~> 2.21"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
  }
}

provider "digitalocean" {
  token = var.do_token
}

provider "cloudflare" {
  api_key = var.cloudflare_api_key
  email   = var.cloudflare_api_email
}
