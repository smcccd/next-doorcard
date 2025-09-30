import { defineConfig } from "cypress";
import * as jwt from "jsonwebtoken";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    videosFolder: "cypress/videos",
    screenshotsFolder: "cypress/screenshots",
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // Testing modes configuration
    env: {
      // Authentication mode: 'manual', 'programmatic', 'mock'
      AUTH_MODE: "manual",

      // Interactive mode settings
      INTERACTIVE_LOGIN: true,
      MFA_WAIT_TIME: 60000, // 60 seconds for MFA entry

      // Session persistence
      PERSIST_SESSIONS: true,
      SESSION_CACHE_DIR: "cypress/cache",

      // OneLogin configuration
      ONELOGIN_MANUAL_LOGIN_URL: "https://smccd.onelogin.com",
      ONELOGIN_TEST_USERS: {
        FACULTY: {
          role: "FACULTY",
          college: "SKYLINE",
        },
        ADMIN: {
          role: "ADMIN",
          college: "SKYLINE",
        },
        STAFF: {
          role: "STAFF",
          college: "CAÑADA",
        },
      },

      // Development fallback
      DEV_LOGIN_ENABLED: true,
    },

    setupNodeEvents(on, config) {
      // Task to check if dev server is running
      on("task", {
        ping() {
          return new Promise((resolve) => {
            const http = require("http");
            const req = http.get("http://localhost:3000", (res: any) => {
              resolve(true);
            });
            req.on("error", () => resolve(false));
            req.setTimeout(5000, () => {
              req.destroy();
              resolve(false);
            });
          });
        },

        // Create JWT token for programmatic authentication
        createAuthToken(payload: any) {
          const secret = process.env.NEXTAUTH_SECRET || "dev-secret-key";
          const token = jwt.sign(
            {
              ...payload,
              iat: Math.floor(Date.now() / 1000),
              exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // 8 hours
            },
            secret
          );
          return token;
        },

        // Manual login session management
        saveSession(sessionData: any) {
          const fs = require("fs");
          const path = require("path");
          const cacheDir = path.join(process.cwd(), "cypress/cache");

          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }

          const sessionFile = path.join(
            cacheDir,
            `session-${sessionData.userRole}.json`
          );
          fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
          return true;
        },

        loadSession(userRole: string) {
          const fs = require("fs");
          const path = require("path");
          const sessionFile = path.join(
            process.cwd(),
            "cypress/cache",
            `session-${userRole}.json`
          );

          if (fs.existsSync(sessionFile)) {
            const sessionData = JSON.parse(
              fs.readFileSync(sessionFile, "utf8")
            );
            // Check if session is still valid (within 6 hours)
            const sixHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
            if (sessionData.timestamp > sixHoursAgo) {
              return sessionData;
            }
          }
          return null;
        },

        clearSessions() {
          const fs = require("fs");
          const path = require("path");
          const cacheDir = path.join(process.cwd(), "cypress/cache");

          if (fs.existsSync(cacheDir)) {
            const files = fs.readdirSync(cacheDir);
            files.forEach((file: string) => {
              if (file.startsWith("session-")) {
                fs.unlinkSync(path.join(cacheDir, file));
              }
            });
          }
          return true;
        },

        // Log test environment info
        logTestEnvironment() {
          console.log("=== TEST ENVIRONMENT INFO ===");
          console.log(`Base URL: ${config.baseUrl}`);
          console.log(`Auth Mode: ${config.env.AUTH_MODE}`);
          console.log(`Interactive Login: ${config.env.INTERACTIVE_LOGIN}`);
          console.log(`Session Persistence: ${config.env.PERSIST_SESSIONS}`);
          console.log("============================");
          return null;
        },
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
    supportFile: "cypress/support/component.ts",
    specPattern: "src/**/*.cy.{js,jsx,ts,tsx}",
  },
});
