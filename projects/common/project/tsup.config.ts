import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.mock.ts"],
  format: ["esm"],
  target: "esnext",
  sourcemap: true,
  dts: true,
  outDir: "dist/src",
  clean: true,
  splitting: false,
  tsconfig: "tsconfig.tsup.json",
});
