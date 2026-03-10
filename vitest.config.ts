import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    env: {
      WHATSAPP_PROVIDER: "mock",
      DATABASE_URL: process.env.DATABASE_URL || "postgresql://test",
      NEXTAUTH_SECRET: "test-secret-1234567890",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
