terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

resource "cloudflare_pages_project" "frontend" {
  account_id        = var.account_id
  name              = var.project_name
  production_branch = var.production_branch
  
  source {
    type = "github"
    config {
      owner                         = var.github_owner
      repo_name                     = var.github_repo
      production_branch             = var.production_branch
      pr_comments_enabled           = true
      deployments_enabled           = true
      production_deployment_enabled = true
      preview_deployment_setting    = "all"
      preview_branch_includes       = ["*"]
      preview_branch_excludes       = [var.production_branch]
    }
  }

  build_config {
    build_command   = "pnpm -r build"
    destination_dir = "projects/frontend/project/dist"
    root_dir        = "."
  }

  deployment_configs {
    production {
      environment_variables = var.environment_variables
    }
    preview {
      environment_variables = var.environment_variables
    }
  }
}

resource "cloudflare_pages_domain" "frontend" {
  for_each     = toset(var.domain_names)
  account_id   = var.account_id
  project_name = cloudflare_pages_project.frontend.name
  domain       = each.value
}
