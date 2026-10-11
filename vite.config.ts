import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "site",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "site/index.html"),
        healthCheck: resolve(__dirname, "site/health-check/index.html"),
      },
    },
  },
  test: {
    root: ".",
    include: ["tests/**/*.test.ts"],
  },
});
