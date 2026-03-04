import globals from "globals";
import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { ESLint } from "eslint";

export default defineConfig([
  globalIgnores([
    "**/dist/**",
    "**/.tmp/**",
    "**/.wrangler/**",
    "projects/common/project/docs/**",
    "projects/common/project/src/**/*.gen.ts",
  ]),
  eslintConfigPrettier,
  {
    files: ["projects/*/project/**/*.{ts,mts,cts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["projects/frontend/project/**/*.{ts,mts,cts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks as ESLint.Plugin,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    extends: [
      eslintReact.configs["recommended-typescript"],
      react.configs.flat.recommended,
      react.configs.flat["jsx-runtime"],
      reactHooks.configs.flat["recommended-latest"],
      reactRefresh.configs.vite,
    ],
  },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    files: ["projects/*/project/**/*.{ts,mts,cts,tsx}"],
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true },
      ],
      curly: ["error", "all"],
      "comma-spacing": ["error", { before: false, after: true }],
    },
  },
  {
    files: ["projects/*/project/**/*.module.ts"],
    rules: {
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
  {
    files: ["projects/*/project/**/*.test.ts"],
    rules: {
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-extraneous-class": "off",
    },
  },
  {
    files: ["projects/common/project/**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
]);
