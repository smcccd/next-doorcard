const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  // Use single environment for now to simplify configuration
  testEnvironment: "jsdom",
  testMatch: [
    // Include all working test patterns
    "**/components/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "**/lib/__tests__/**/*.{js,jsx,ts,tsx}",
    "**/app/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "**/types/**/__tests__/**/*.{js,jsx,ts,tsx}",
  ],
  testTimeout: process.env.CI ? 30000 : 10000,
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/cypress/",
  ],
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "types/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!app/layout.tsx",
    "!app/loading.tsx",
    "!app/error.tsx",
    "!app/not-found.tsx",
    "!app/global-error.tsx",
  ],
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
      lines: 1,
      statements: 1,
    },
  },
  moduleNameMapper: {
    // Handle module aliases (if you use them in next.config.js)
    "^@/(.*)$": "<rootDir>/$1",
    "^~/(.*)$": "<rootDir>/$1",
    // Mock static assets
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/__mocks__/fileMock.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(lucide-react|@hookform|@radix-ui)/)",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
