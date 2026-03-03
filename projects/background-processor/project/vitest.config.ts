import { join } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    setupFiles: ["./src/test/setup-env.ts"],
  },
  plugins: [
    // This is required to build the test files with SWC
    swc.vite({
      // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
      module: { type: "nodenext" },
    }),
  ],
  resolve: {
    alias: {
      // Ensure Vitest correctly resolves TypeScript path aliases
      src: join(fileURLToPath(import.meta.url), "src"),
    },
  },
});
