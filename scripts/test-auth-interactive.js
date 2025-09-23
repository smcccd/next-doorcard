#!/usr/bin/env node

/**
 * Interactive Authentication Test Runner
 * 
 * This script configures and runs Cypress tests with interactive OneLogin authentication.
 * It handles different testing modes and provides clear instructions for manual login.
 */

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.find(arg => arg.startsWith("--mode="))?.split("=")[1] || "manual";
const spec = args.find(arg => arg.startsWith("--spec="))?.split("=")[1];
const headed = args.includes("--headed");
const record = args.includes("--record");

// Configuration for different testing modes
const configs = {
  manual: {
    AUTH_MODE: "manual",
    INTERACTIVE_LOGIN: true,
    PERSIST_SESSIONS: true,
    MFA_WAIT_TIME: 120000, // 2 minutes
    description: "Manual OneLogin authentication with MFA support"
  },
  programmatic: {
    AUTH_MODE: "programmatic", 
    INTERACTIVE_LOGIN: false,
    PERSIST_SESSIONS: false,
    MFA_WAIT_TIME: 30000,
    description: "Programmatic authentication using test tokens"
  },
  mock: {
    AUTH_MODE: "mock",
    INTERACTIVE_LOGIN: false,
    PERSIST_SESSIONS: false,
    MFA_WAIT_TIME: 10000,
    description: "Mock authentication for unit testing"
  },
  hybrid: {
    AUTH_MODE: "manual",
    INTERACTIVE_LOGIN: true,
    PERSIST_SESSIONS: true,
    MFA_WAIT_TIME: 60000,
    description: "Hybrid mode: manual auth with cached fallbacks"
  }
};

const config = configs[mode] || configs.manual;

console.log("🔐 Interactive Authentication Test Runner");
console.log("==========================================");
console.log(`Mode: ${mode}`);
console.log(`Description: ${config.description}`);
console.log("");

// Create cache directory if needed
const cacheDir = path.join(process.cwd(), "cypress/cache");
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
  console.log("📁 Created session cache directory");
}

// Build Cypress command
let cypressCmd = headed ? "cypress open" : "cypress run";

// Add environment variables
const envVars = Object.entries(config)
  .filter(([key]) => key !== "description")
  .map(([key, value]) => `CYPRESS_${key}=${value}`)
  .join(" ");

// Add spec filter if provided
const specFilter = spec ? `--spec="${spec}"` : "";

// Build full command
const fullCommand = `${envVars} npx ${cypressCmd} ${specFilter}`.trim();

console.log("🚀 Running command:");
console.log(`   ${fullCommand}`);
console.log("");

// Show mode-specific instructions
if (mode === "manual" || mode === "hybrid") {
  console.log("📋 MANUAL LOGIN INSTRUCTIONS:");
  console.log("=============================");
  console.log("1. Tests will pause when OneLogin authentication is required");
  console.log("2. A popup will appear with login instructions");
  console.log("3. Complete OneLogin authentication including MFA");
  console.log("4. Tests will continue automatically after successful login");
  console.log("5. Sessions are cached to avoid repeated logins");
  console.log("");
  console.log("🔑 MFA Tips:");
  console.log("- Use your authenticator app (Microsoft Authenticator, etc.)");
  console.log("- SMS codes are also supported if configured");
  console.log("- Tests will wait up to 2 minutes for MFA completion");
  console.log("");
  console.log("💡 Troubleshooting:");
  console.log("- If authentication fails, run: npm run test:auth:clear-cache");
  console.log("- Check your OneLogin credentials are active");
  console.log("- Ensure you have access to SMCCD doorcard application");
  console.log("");
}

if (mode === "programmatic") {
  console.log("🤖 PROGRAMMATIC MODE:");
  console.log("====================");
  console.log("- Using JWT tokens for authentication");
  console.log("- No manual intervention required");
  console.log("- Suitable for CI/CD pipelines");
  console.log("- Limited to test-specific functionality");
  console.log("");
}

// Execute the command
console.log("▶️  Starting Cypress...");
console.log("");

const childProcess = exec(fullCommand, { 
  cwd: process.cwd(),
  env: { ...process.env }
});

childProcess.stdout.on("data", (data) => {
  process.stdout.write(data);
});

childProcess.stderr.on("data", (data) => {
  process.stderr.write(data);
});

childProcess.on("close", (code) => {
  console.log("");
  if (code === 0) {
    console.log("✅ Tests completed successfully!");
    
    if (mode === "manual" || mode === "hybrid") {
      console.log("");
      console.log("💾 Session Management:");
      console.log("- Sessions have been cached for faster subsequent runs");
      console.log("- To clear cached sessions: npm run test:auth:clear-cache");
      console.log("- Sessions expire after 6 hours");
    }
  } else {
    console.log(`❌ Tests failed with exit code ${code}`);
    
    if (mode === "manual") {
      console.log("");
      console.log("🔧 Common Issues:");
      console.log("- Authentication timeout: Increase MFA_WAIT_TIME");
      console.log("- OneLogin access denied: Check user permissions");
      console.log("- Session expired: Clear cache and try again");
    }
  }
  
  process.exit(code);
});

// Handle interruption
process.on("SIGINT", () => {
  console.log("");
  console.log("🛑 Test execution interrupted");
  childProcess.kill("SIGINT");
  process.exit(1);
});