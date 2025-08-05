const baseConfig = require("./jest.config.js");

module.exports = {
  ...baseConfig,
  testMatch: [
    // Include only stable tests for CI
    "**/lib/**/__tests__/**/*.test.ts",
    "**/lib/**/__tests__/**/*.test.tsx",
    "**/app/**/__tests__/**/*.test.ts",
    "**/app/**/__tests__/**/*.test.tsx",
    "**/components/**/__tests__/**/*.test.ts",
    "**/components/**/__tests__/**/*.test.tsx",
    // Exclude flaky or WIP tests
    "!**/doorcard-display.test.tsx",
    "!**/doorcard-editor.test.tsx",
  ],
  coverageThresholds: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  maxWorkers: "50%",
  bail: 1,
  testTimeout: 30000,
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "coverage",
        outputName: "junit.xml",
      },
    ],
  ],
};
