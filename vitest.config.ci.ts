import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: [
      // Include stable tests that work well with Vitest
      "**/lib/__tests__/utils.test.ts",
      "**/lib/__tests__/doorcard-constants.test.ts",
      "**/lib/__tests__/departments.integration.test.ts",
      "**/lib/__tests__/display-name.integration.test.ts",
      "**/types/**/__tests__/**/*.{js,ts,tsx}",
      "**/lib/__tests__/display-name.test.ts",
      "**/lib/__tests__/doorcard-status.test.ts",
      "**/lib/__tests__/term-management.test.ts",
      "**/lib/validations/__tests__/doorcard-edit.test.ts",
      "**/components/ui/__tests__/**/*.{js,ts,tsx}",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/cypress/**",
      // Exclude tests that need more migration work
      "**/api/**/__tests__/**/*",
      "**/app/**/__tests__/**/*",
      "**/lib/__tests__/prisma.test.ts",
      "**/lib/__tests__/analytics.test.ts",
      "**/lib/__tests__/auth.test.ts",
      "**/lib/__tests__/api-utils.test.ts",
      "**/lib/__tests__/markdown.test.ts",
      "**/lib/__tests__/prisma-error-handler.test.ts",
      "**/lib/__tests__/require-auth-user.test.ts",
      "**/lib/__tests__/test-utils.test.tsx",
      "**/lib/utils/__tests__/**/*",
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
    reporter: ["verbose", "junit"],
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
