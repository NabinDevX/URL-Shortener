import { config as nodeConfig } from "@repo/eslint-config/node";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nodeConfig,
  {
    files: ["**/*.{ts,js}"],
    rules: {
      "no-undef": "off",
      "@typescript-eslint/no-namespace": "off",
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**", ".turbo/**"],
  },
];
