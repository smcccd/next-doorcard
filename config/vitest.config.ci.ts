import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      // Include all tests - migration complete!
      "**/__tests__/**/*.{js,ts,tsx}",
      "**/*.{test,spec}.{js,ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/cypress/**",
      "**/storybook-static/**",
      "**/coverage/**",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      exclude: [
        "node_modules/",
        ".next/",
        "cypress/",
        "coverage/",
        "**/*.d.ts",
        "app/layout.tsx",
        "app/loading.tsx",
        "app/error.tsx",
        "app/not-found.tsx",
        "app/global-error.tsx",
      ],
      thresholds: {
        branches: 30,
        functions: 40,
        lines: 40,
        statements: 40,
      },
    },
    globals: true,
    pool: "threads",
    poolOptions: {
      threads: {
        maxThreads: 2,
        minThreads: 1,
      },
    },
    reporters: ["verbose", "junit"],
    outputFile: {
      junit: "coverage/junit.xml",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
