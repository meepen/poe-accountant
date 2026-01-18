variable "REGISTRY" {
  default = "poe-accountant"
}

variable "TAG" {
  default = "latest"
}

variable "CI" {
  default = false
}

function "cache_to" {
  params = [name]
  # Only push cache to registry if CI=true. Otherwise, do nothing.
  result = CI ? ["type=registry,ref=${REGISTRY}/cache:${name},mode=max"] : []
}

function "cache_from" {
  params = [name]
  result = ["type=registry,ref=${REGISTRY}/cache:${name}"]
}

group "default" {
  targets = [
    "frontend",
    "api",
    "background-processor"
  ]
}

target "root-config" {
  context = "."
  dockerfile-inline = <<EOT
    FROM alpine
    COPY pnpm-lock.yaml pnpm-workspace.yaml package.json /out/
  EOT
}

target "base-node" {
  context = "."
  dockerfile = "base/node/Dockerfile"
  secret = ["id=env,src=.env"]
  
  cache-to   = cache_to("base-node")
  cache-from = cache_from("base-node")

  contexts = {
    root-config = "target:root-config"
  }
}

target "frontend" {
  context = "./projects/frontend"
  tags = ["${REGISTRY}/frontend:${TAG}"]
  
  cache-to   = cache_to("frontend")
  cache-from = cache_from("frontend")

  contexts = {
    base = "target:base-node"
  }
}

target "api" {
  context = "./projects/api"
  tags = ["${REGISTRY}/api:${TAG}"]
  
  cache-to   = cache_to("api")
  cache-from = cache_from("api")

  contexts = {
    base = "target:base-node"
  }
}

target "background-processor" {
  context = "./projects/background-processor"
  tags = ["${REGISTRY}/background-processor:${TAG}"]
  
  cache-to   = cache_to("background-processor")
  cache-from = cache_from("background-processor")
  contexts = {
    base = "target:base-node"
  }
}
