# Development Environment Setup

This project uses Nix flakes for reproducible development environments. To get the best experience, we recommend installing Nix and direnv.

<strong>Because of this, this project will only run via WSL2 / Docker if you are using Windows.</strong>

## Installing Nix

Follow the most recent instructions from [NIX](https://nixos.org/download/) for your setup and operating system.

## Installing direnv

Generally should be available via your package manager.

## Installing podman

Follow the instructions for [podman for your system](https://podman-desktop.io/docs/installation/). 

### Setting up direnv

Add the direnv hook to your shell profile. Follow the [documentation](https://direnv.net/docs/hook.html).

## Docker-compatible Daemon
We recommend utilizing podman, but Docker Desktop should also work.

## Enabling the Development Environment

1. **Navigate to the project directory**:
   ```bash
   cd poe-accountant
   ```

2. **Allow direnv** (first time only):
   ```bash
   direnv allow
   ```

## Project Setup

To install dependencies (for deploying and code editors):
```sh
task install
```

To build the docker images:
```sh
task docker:build
```

To start the project:
```sh
task start
```

You can disable certain projects via `podman compose down frontend` and start those locally.
