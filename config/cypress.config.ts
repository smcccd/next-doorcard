import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 20000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      failOnStatusCode: false,
      CYPRESS: true, // Flag to identify Cypress environment
    },
    setupNodeEvents(on, config) {
      // Server health check
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
        async ping() {
          try {
            const response = await fetch(
              config.baseUrl || "http://localhost:3000"
            );
            return response.ok;
          } catch (error) {
            return false;
          }
        },
        async createAuthToken({
          email,
          name,
          id = "test-user-id",
          role = "ADMIN",
        }) {
          try {
            // Create a JWT token for NextAuth.js
            const { encode } = require("next-auth/jwt");

            const secret =
              process.env.NEXTAUTH_SECRET || "development-secret-key";

            console.log(
              "Using NEXTAUTH_SECRET:",
              secret ? "***set***" : "not set"
            );
            console.log("NODE_ENV:", process.env.NODE_ENV);

            const tokenPayload = {
              sub: id,
              id: id, // Include both sub and id
              name: name,
              email: email,
              role: role,
              college: "SKYLINE",
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
              jti: `test-${Date.now()}`,
            };

            console.log("Creating auth token with payload:", tokenPayload);

            const token = await encode({
              token: tokenPayload,
              secret: secret,
              maxAge: 24 * 60 * 60, // Match NextAuth session maxAge
              encryption: true,
            });

            console.log(
              "Token created successfully:",
              token?.substring(0, 50) + "..."
            );
            return token;
          } catch (error) {
            console.error("Error creating auth token:", error);
            throw error;
          }
        },
      });

      // Performance metrics collection
      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.name === "chrome" && browser.isHeadless) {
          launchOptions.args.push("--disable-dev-shm-usage");
          launchOptions.args.push("--no-sandbox");
          launchOptions.args.push("--disable-web-security");
        }

        // Set custom user agent to help identify Cypress requests
        launchOptions.args.push("--user-agent=Cypress Test Runner");
        return launchOptions;
      });

      return config;
    },
    experimentalStudio: true,
    experimentalWebKitSupport: true,
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    viewportWidth: 1000,
    viewportHeight: 600,
  },

  // Global configuration
  chromeWebSecurity: false,
  modifyObstructiveCode: false,
  blockHosts: [
    // Block analytics and tracking scripts during testing
    "*.google-analytics.com",
    "*.googletagmanager.com",
    "*.facebook.com",
    "*.twitter.com",
  ],
});
