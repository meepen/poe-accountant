{
  description = "Development environment for poe-accountant";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_24
            opentofu

            # Utilities
            go-task
            bash
            jq
            curl

            # Connections
            redis
            postgresql
            doctl
            s3cmd

            # Package managers
            pnpm
          ];
        };
      });
}
