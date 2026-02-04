#!/usr/bin/env tsx

/**
 * Quick URL Testing Helper for Next Doorcard Application
 *
 * This is a lightweight companion to the full QA suite that allows
 * quick testing of specific URL scenarios during development.
 *
 * Usage:
 *   npx tsx scripts/qa-url-quick-test.ts
 *   npx tsx scripts/qa-url-quick-test.ts --url "/view/jdoe"
 *   npx tsx scripts/qa-url-quick-test.ts --test-all
 */

import { URLGenerator } from "./qa-url-testing";

const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function log(message: string, color: keyof typeof colors = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function testSingleURL(url: string) {
  log("\n🔍 Quick URL Test", "blue");
  log(`Input URL: ${url}`, "dim");

  try {
    const printUrl = URLGenerator.getPrintUrl(url);

    log(`✅ Print URL: ${printUrl}`, "green");

    // Quick validations
    const validations = [
      {
        name: "Contains print=true",
        test: printUrl.includes("print=true"),
      },
      {
        name: "Proper separator used",
        test: url.includes("?")
          ? printUrl.includes("&print=true")
          : printUrl.includes("?print=true"),
      },
      {
        name: "No double separators",
        test: !printUrl.includes("??") && !printUrl.includes("&&"),
      },
    ];

    validations.forEach((validation) => {
      if (validation.test) {
        log(`✅ ${validation.name}`, "green");
      } else {
        log(`❌ ${validation.name}`, "red");
      }
    });
  } catch (error) {
    log(
      `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      "red"
    );
  }
}

function testCommonScenarios() {
  log("\n🔍 Testing Common URL Scenarios", "blue");

  const scenarios = [
    "/view/jdoe",
    "/view/jdoe/current",
    "/doorcard/123/view",
    "/doorcard/123/view?auth=true",
    "/view/professor-smith",
    "/view/mwilson?debug=1",
  ];

  scenarios.forEach((url) => {
    const printUrl = URLGenerator.getPrintUrl(url);
    const status = printUrl.includes("print=true") ? "✅" : "❌";
    log(`${status} ${url} → ${printUrl}`, status === "✅" ? "green" : "red");
  });
}

function main() {
  const args = process.argv.slice(2);

  log("Next Doorcard - Quick URL Testing", "bold");
  log("Fast validation of URL generation logic\n", "dim");

  if (args.includes("--help") || args.includes("-h")) {
    log("Usage:", "cyan");
    log(
      "  npx tsx scripts/qa-url-quick-test.ts                 # Test common scenarios",
      "dim"
    );
    log(
      "  npx tsx scripts/qa-url-quick-test.ts --url <url>     # Test specific URL",
      "dim"
    );
    log(
      "  npx tsx scripts/qa-url-quick-test.ts --test-all      # Run full QA suite",
      "dim"
    );
    return;
  }

  const urlIndex = args.indexOf("--url");
  if (urlIndex !== -1 && args[urlIndex + 1]) {
    testSingleURL(args[urlIndex + 1]);
    return;
  }

  if (args.includes("--test-all")) {
    log("🚀 Running full QA suite...", "cyan");
    require("./qa-url-testing");
    return;
  }

  // Default: test common scenarios
  testCommonScenarios();

  log("\n💡 Tip: Use --url <url> to test a specific URL", "dim");
  log("💡 Use --test-all to run the complete QA suite", "dim");
}

if (require.main === module) {
  main();
}
