#!/usr/bin/env node

/**
 * CI/CD Authentication Strategy
 *
 * Handles authentication in automated environments where manual input isn't possible.
 * Provides fallback strategies and environment detection.
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Detect CI environment
const CI_ENVIRONMENTS = {
  GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === "true",
  VERCEL: process.env.VERCEL === "1",
  NETLIFY: process.env.NETLIFY === "true",
  CIRCLECI: process.env.CIRCLECI === "true",
  JENKINS: process.env.JENKINS_URL !== undefined,
  GITLAB: process.env.GITLAB_CI === "true",
  AZURE: process.env.TF_BUILD === "True",
};

const isCI = Object.values(CI_ENVIRONMENTS).some((env) => env);
const ciPlatform =
  Object.keys(CI_ENVIRONMENTS).find((key) => CI_ENVIRONMENTS[key]) || "UNKNOWN";

console.log("🤖 CI/CD Authentication Strategy");
console.log("================================");
console.log(`Environment: ${isCI ? ciPlatform : "LOCAL"}`);
console.log(`Is CI: ${isCI}`);
console.log("");

// Parse command line arguments
const args = process.argv.slice(2);
const strategy =
  args.find((arg) => arg.startsWith("--strategy="))?.split("=")[1] || "auto";
const spec = args.find((arg) => arg.startsWith("--spec="))?.split("=")[1];
const parallel = args.includes("--parallel");
const record = args.includes("--record");

// CI Authentication strategies
const strategies = {
  auto: {
    description: "Automatically select best strategy based on environment",
    handler: selectAutoStrategy,
  },
  programmatic: {
    description: "Use JWT tokens for authentication (CI-friendly)",
    authMode: "programmatic",
    interactive: false,
  },
  mock: {
    description: "Use mock authentication for testing (fastest)",
    authMode: "mock",
    interactive: false,
  },
  skip_auth: {
    description: "Skip authentication tests entirely",
    authMode: "skip",
    interactive: false,
  },
  service_account: {
    description: "Use service account authentication (if configured)",
    authMode: "service_account",
    interactive: false,
    requiresServiceAccount: true,
  },
};

function selectAutoStrategy() {
  if (!isCI) {
    console.log("🏠 Local environment detected - using programmatic auth");
    return strategies.programmatic;
  }

  // Check for service account credentials
  const hasServiceAccount =
    process.env.ONELOGIN_SERVICE_CLIENT_ID &&
    process.env.ONELOGIN_SERVICE_CLIENT_SECRET;

  if (hasServiceAccount) {
    console.log(
      "🔑 Service account credentials found - using service account auth"
    );
    return strategies.service_account;
  }

  // Check if this is a PR/branch build vs main branch
  const isMainBranch =
    process.env.GITHUB_REF === "refs/heads/main" ||
    process.env.VERCEL_GIT_COMMIT_REF === "main" ||
    process.env.CI_COMMIT_REF_NAME === "main";

  if (isMainBranch) {
    console.log("🎯 Main branch build - using programmatic auth");
    return strategies.programmatic;
  } else {
    console.log("🔀 Feature branch build - using mock auth for speed");
    return strategies.mock;
  }
}

// Get selected strategy
const selectedStrategy = strategies[strategy] || strategies.auto;

console.log(`Strategy: ${strategy}`);
console.log(`Description: ${selectedStrategy.description}`);
console.log("");

// Execute strategy
let finalStrategy;
if (typeof selectedStrategy.handler === "function") {
  finalStrategy = selectedStrategy.handler();
} else {
  finalStrategy = selectedStrategy;
}

// Check requirements
if (finalStrategy.requiresServiceAccount) {
  const hasServiceAccount =
    process.env.ONELOGIN_SERVICE_CLIENT_ID &&
    process.env.ONELOGIN_SERVICE_CLIENT_SECRET;

  if (!hasServiceAccount) {
    console.log("❌ Service account authentication requires:");
    console.log("   - ONELOGIN_SERVICE_CLIENT_ID");
    console.log("   - ONELOGIN_SERVICE_CLIENT_SECRET");
    console.log("");
    console.log("💡 Falling back to programmatic authentication");
    finalStrategy = strategies.programmatic;
  }
}

// Build environment variables
const envVars = {
  CYPRESS_AUTH_MODE: finalStrategy.authMode,
  CYPRESS_INTERACTIVE_LOGIN: finalStrategy.interactive || false,
  CYPRESS_PERSIST_SESSIONS: false, // Disable session persistence in CI
  CYPRESS_MFA_WAIT_TIME: 10000, // Short timeout for CI
  CI: "true",
};

// Add service account credentials if using service account strategy
if (finalStrategy.authMode === "service_account") {
  envVars.CYPRESS_ONELOGIN_SERVICE_CLIENT_ID =
    process.env.ONELOGIN_SERVICE_CLIENT_ID;
  envVars.CYPRESS_ONELOGIN_SERVICE_CLIENT_SECRET =
    process.env.ONELOGIN_SERVICE_CLIENT_SECRET;
}

// Build Cypress command
let cypressCmd = "cypress run";

// Add CI-specific options
const ciOptions = [
  "--headless",
  "--browser electron", // Electron is more reliable in CI
  record && "--record",
  parallel && "--parallel",
  spec && `--spec="${spec}"`,
  process.env.CYPRESS_RECORD_KEY && "--key $CYPRESS_RECORD_KEY",
]
  .filter(Boolean)
  .join(" ");

cypressCmd += ` ${ciOptions}`;

// Build environment string
const envString = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join(" ");

const fullCommand = `${envString} npx ${cypressCmd}`.trim();

console.log("🚀 Executing CI strategy:");
console.log(`   ${fullCommand}`);
console.log("");

// Show strategy-specific information
switch (finalStrategy.authMode) {
  case "programmatic":
    console.log("🤖 Programmatic Authentication:");
    console.log("- Using JWT tokens for authentication");
    console.log("- No external dependencies");
    console.log("- Limited to application functionality");
    break;

  case "mock":
    console.log("🎭 Mock Authentication:");
    console.log("- Using simulated authentication");
    console.log("- Fastest execution time");
    console.log("- No external service calls");
    break;

  case "service_account":
    console.log("🔐 Service Account Authentication:");
    console.log("- Using OneLogin service account");
    console.log("- Full authentication flow");
    console.log("- Requires service account setup");
    break;

  case "skip":
    console.log("⏭️  Skipping Authentication Tests:");
    console.log("- Authentication tests will be skipped");
    console.log("- Only non-authenticated tests will run");
    break;
}

console.log("");

// Add timeout handling for CI environments
const timeout = isCI ? 600000 : 300000; // 10 minutes for CI, 5 for local

console.log("⏱️  Starting tests with timeout protection...");

const childProcess = exec(fullCommand, {
  cwd: process.cwd(),
  env: { ...process.env, ...envVars },
  timeout: timeout,
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
    console.log("✅ CI tests completed successfully!");

    // CI-specific success reporting
    if (isCI) {
      console.log(`📊 Platform: ${ciPlatform}`);
      console.log(`🔧 Strategy: ${finalStrategy.authMode}`);
      console.log("📈 Test results available in CI logs");
    }
  } else {
    console.log(`❌ CI tests failed with exit code ${code}`);

    // CI-specific failure guidance
    if (isCI) {
      console.log("");
      console.log("🔧 CI Troubleshooting:");
      console.log("- Check environment variables are set");
      console.log("- Verify service account permissions");
      console.log("- Review test timeouts for CI environment");
      console.log("- Consider using mock authentication for speed");
    }
  }

  process.exit(code);
});

childProcess.on("error", (error) => {
  console.error(`❌ Process error: ${error.message}`);

  if (error.code === "TIMEOUT") {
    console.log("");
    console.log("⏰ Test execution timed out");
    console.log("💡 Consider reducing test scope or increasing timeout");
  }

  process.exit(1);
});

// Handle interruption
process.on("SIGINT", () => {
  console.log("");
  console.log("🛑 CI test execution interrupted");
  childProcess.kill("SIGINT");
  process.exit(1);
});
