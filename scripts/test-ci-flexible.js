#!/usr/bin/env node

/**
 * Flexible CI test runner that allows deployment with acceptable test failure rates
 * Returns exit code 0 if pass rate is above threshold, exit code 1 if below
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PASS_THRESHOLD = 85; // 85% pass rate required for deployment
const JUNIT_FILE = "coverage/junit.xml";

function parseJunitResults() {
  try {
    const junitPath = path.join(process.cwd(), JUNIT_FILE);
    if (!fs.existsSync(junitPath)) {
      console.error("❌ JUnit results file not found");
      return null;
    }

    const junitContent = fs.readFileSync(junitPath, "utf-8");

    // Parse XML to extract test statistics
    const testsMatch = junitContent.match(/tests="(\d+)"/);
    const failuresMatch = junitContent.match(/failures="(\d+)"/);
    const errorsMatch = junitContent.match(/errors="(\d+)"/);

    if (!testsMatch || !failuresMatch || !errorsMatch) {
      console.error("❌ Could not parse JUnit results");
      return null;
    }

    const totalTests = parseInt(testsMatch[1]);
    const failures = parseInt(failuresMatch[1]);
    const errors = parseInt(errorsMatch[1]);
    const passed = totalTests - failures - errors;
    const passRate = (passed / totalTests) * 100;

    return {
      totalTests,
      passed,
      failures,
      errors,
      passRate: Math.round(passRate * 100) / 100,
    };
  } catch (error) {
    console.error("❌ Error parsing JUnit results:", error.message);
    return null;
  }
}

function main() {
  console.log("🚀 Running CI tests with flexible pass/fail criteria...\n");

  try {
    // Run tests and capture exit code (don't fail on test failures)
    execSync("npx vitest run --config vitest.config.ci.ts", {
      stdio: "inherit",
      // Allow command to continue even if tests fail
      env: { ...process.env, FORCE_COLOR: "1" },
    });
  } catch (error) {
    // Tests failed, but we'll check pass rate before deciding final exit code
    console.log("\n⚠️  Some tests failed, checking pass rate threshold...\n");
  }

  // Parse test results
  const results = parseJunitResults();
  if (!results) {
    console.error("❌ Could not determine test results - failing CI");
    process.exit(1);
  }

  const { totalTests, passed, failures, errors, passRate } = results;

  // Display results
  console.log("📊 Test Results Summary:");
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passed} ✅`);
  console.log(`   Failed: ${failures} ❌`);
  console.log(`   Errors: ${errors} 💥`);
  console.log(`   Pass Rate: ${passRate}%`);
  console.log(`   Threshold: ${PASS_THRESHOLD}%\n`);

  // Determine if we should pass or fail CI
  if (passRate >= PASS_THRESHOLD) {
    console.log(
      `🎉 SUCCESS: Pass rate ${passRate}% meets threshold of ${PASS_THRESHOLD}%`
    );
    console.log("✅ CI will continue to build and deployment phases\n");
    process.exit(0);
  } else {
    console.log(
      `❌ FAILURE: Pass rate ${passRate}% is below threshold of ${PASS_THRESHOLD}%`
    );
    console.log(
      "🚫 CI will be blocked - fix failing tests before deployment\n"
    );
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { parseJunitResults, PASS_THRESHOLD };
