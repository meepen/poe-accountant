group "default" {
  targets = [
    "frontend",
    "ninja"
  ]
}

target "root-config" {
  context = "."
  # Only copy the files pnpm needs to resolve the workspace
  dockerfile-inline = "FROM alpine\nCOPY pnpm-lock.yaml pnpm-workspace.yaml /out/"
}

target "base-node" {
  context = "."
  dockerfile = "base/node/Dockerfile"
  secret = ["id=env,src=.env"]

  contexts = {
    root-config = "target:root-config"
  }
}

target "frontend" {
  context = "./projects/frontend"
  tags = ["poe-accountant/frontend:latest"]

  contexts = {
    base = "target:base-node"
  }
}

target "ninja" {
  context = "./projects/ninja"
  tags = ["poe-accountant/ninja:latest"]

  contexts = {
    base = "target:base-node"
  }
}
