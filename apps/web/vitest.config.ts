import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@insti/auth": path.resolve(__dirname, "../../packages/auth/src"),
      "@insti/database": path.resolve(__dirname, "../../packages/database/src"),
      "@insti/types": path.resolve(__dirname, "../../packages/types/src"),
      "@insti/utils": path.resolve(__dirname, "../../packages/utils/src"),
      "@insti/config": path.resolve(__dirname, "../../packages/config/src"),
      "@insti/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});
