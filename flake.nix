{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url  = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { system = system; };
        isDarwin = pkgs.stdenv.isDarwin;
      in {
        devShells.default = with pkgs; mkShell {
          buildInputs = [
          nodejs
          # You can set the major version of Node.js to a specific one instead
          # of the default version
          # pkgs.nodejs-19_x

          # You can choose pnpm, yarn, or none (npm).
          nodePackages.pnpm
          # pkgs.yarn

          nodePackages.typescript
          nodePackages.typescript-language-server
          ] ++ pkgs.lib.optional isDarwin (with darwin.apple_sdk.frameworks; [ Security CoreServices ]);
        };
      }
    );
}
