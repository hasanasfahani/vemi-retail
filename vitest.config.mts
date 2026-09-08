import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/* The engine is pure TypeScript over static JSON, so the tests need no
   DOM, no server and no network — just the same `@/` resolution the
   app builds with, so a test imports exactly the module the product
   ships rather than a copy that can drift from it. */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
