import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts", "src/workers/snapshot.worker.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.lib.json",
  noExternal: [/^@meepen\//],
});
