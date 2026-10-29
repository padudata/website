import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "site",
  // .env files live at the repo root, next to wrangler.jsonc.
  envDir: __dirname,
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "site/index.html"),
        healthCheck: resolve(__dirname, "site/health-check/index.html"),
        pricing: resolve(__dirname, "site/pricing/index.html"),
        privacy: resolve(__dirname, "site/privacy/index.html"),
        terms: resolve(__dirname, "site/terms/index.html"),
        kreditin: resolve(__dirname, "site/kreditin/index.html"),
      },
    },
  },
  test: {
    root: ".",
    include: ["tests/**/*.test.ts"],
  },
});
