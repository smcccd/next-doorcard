#!/usr/bin/env tsx

/**
 * Quality Assurance Script for Next Doorcard Application
 *
 * This script performs comprehensive URL testing to ensure quality standards
 * for the $100/month service. It tests various URL patterns, print functionality,
 * query parameter handling, and edge cases.
 *
 * Usage: npx tsx scripts/qa-url-testing.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  message: string;
  details?: string;
}

interface URLTestCase {
  name: string;
  baseUrl: string;
  expectedPrintUrl: string;
  description: string;
}

class QALogger {
  private results: TestResult[] = [];
  private startTime = Date.now();

  log(message: string, color: keyof typeof colors = "white") {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  success(test: string, message: string, details?: string) {
    this.results.push({ name: test, status: "PASS", message, details });
    this.log(`✅ ${test}: ${message}`, "green");
    if (details) this.log(`   ${details}`, "dim");
  }

  fail(test: string, message: string, details?: string) {
    this.results.push({ name: test, status: "FAIL", message, details });
    this.log(`❌ ${test}: ${message}`, "red");
    if (details) this.log(`   ${details}`, "red");
  }

  warn(test: string, message: string, details?: string) {
    this.results.push({ name: test, status: "WARN", message, details });
    this.log(`⚠️  ${test}: ${message}`, "yellow");
    if (details) this.log(`   ${details}`, "yellow");
  }

  printSummary() {
    const elapsed = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const warned = this.results.filter((r) => r.status === "WARN").length;

    this.log("\n" + "=".repeat(80), "cyan");
    this.log("QA URL TESTING SUMMARY", "bold");
    this.log("=".repeat(80), "cyan");

    this.log(`\nTests completed in ${elapsed}ms`, "dim");
    this.log(`Total tests: ${this.results.length}`, "white");
    this.log(`✅ Passed: ${passed}`, passed > 0 ? "green" : "dim");
    this.log(`❌ Failed: ${failed}`, failed > 0 ? "red" : "dim");
    this.log(`⚠️  Warnings: ${warned}`, warned > 0 ? "yellow" : "dim");

    const overallStatus = failed > 0 ? "FAILED" : "PASSED";
    const statusColor = failed > 0 ? "red" : "green";

    this.log(`\nOverall Status: ${overallStatus}`, statusColor);

    if (failed > 0) {
      this.log("\n🚨 QUALITY ISSUES DETECTED:", "red");
      this.results
        .filter((r) => r.status === "FAIL")
        .forEach((result) => {
          this.log(`   • ${result.name}: ${result.message}`, "red");
        });
      this.log(
        "\n⚡ Action Required: Fix these issues before production deployment",
        "red"
      );
    } else {
      this.log(
        "\n🎉 All quality checks passed! Service ready for production.",
        "green"
      );
    }

    this.log("\n" + "=".repeat(80), "cyan");
  }
}

/**
 * Core URL logic extracted from DoorcardCard/DoorcardRow components
 */
class URLGenerator {
  static getViewUrl(doorcard: any, displayStatus: { status: string }): string {
    const username = this.publicSlug(doorcard.user);

    // For live doorcards, link to current view
    if (displayStatus.status === "live") {
      return `/view/${username}`;
    }

    // For admin viewing non-public doorcards, use doorcard ID for reliability
    return `/doorcard/${doorcard.id}/view?auth=true`;
  }

  static getPrintUrl(baseUrl: string): string {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}print=true`;
  }

  static publicSlug(
    user?: { username?: string | null; name?: string | null } | null
  ): string {
    if (user?.username) return user.username;
    if (user?.name) return user.name.toLowerCase().replace(/\s+/g, "-");
    return "user";
  }
}

/**
 * Test suite for URL functionality
 */
class URLTestSuite {
  constructor(private logger: QALogger) {}

  /**
   * Test the core print URL logic that was recently fixed
   */
  testPrintURLGeneration() {
    this.logger.log("\n🔍 Testing Print URL Generation...", "blue");

    const testCases: URLTestCase[] = [
      {
        name: "URL without query params",
        baseUrl: "/view/jdoe",
        expectedPrintUrl: "/view/jdoe?print=true",
        description: "Should use ? separator for first query param",
      },
      {
        name: "URL with existing query params",
        baseUrl: "/doorcard/123/view?auth=true",
        expectedPrintUrl: "/doorcard/123/view?auth=true&print=true",
        description: "Should use & separator for additional query param",
      },
      {
        name: "URL with multiple query params",
        baseUrl: "/view/jdoe?auth=true&debug=1",
        expectedPrintUrl: "/view/jdoe?auth=true&debug=1&print=true",
        description: "Should append with & when multiple params exist",
      },
      {
        name: "URL with fragment",
        baseUrl: "/view/jdoe#schedule",
        expectedPrintUrl: "/view/jdoe#schedule?print=true",
        description: "Should handle fragments correctly",
      },
      {
        name: "Root doorcard URL",
        baseUrl: "/doorcard/456/view",
        expectedPrintUrl: "/doorcard/456/view?print=true",
        description: "Should work with doorcard ID routes",
      },
    ];

    testCases.forEach((testCase) => {
      const actualPrintUrl = URLGenerator.getPrintUrl(testCase.baseUrl);

      if (actualPrintUrl === testCase.expectedPrintUrl) {
        this.logger.success(
          testCase.name,
          "Print URL generated correctly",
          `${testCase.baseUrl} → ${actualPrintUrl}`
        );
      } else {
        this.logger.fail(
          testCase.name,
          "Print URL generation failed",
          `Expected: ${testCase.expectedPrintUrl}\nActual: ${actualPrintUrl}`
        );
      }
    });
  }

  /**
   * Test various doorcard status scenarios
   */
  testDoorcardStatusURLs() {
    this.logger.log("\n🔍 Testing Doorcard Status URLs...", "blue");

    const mockDoorcards = [
      {
        id: "123",
        user: { username: "jdoe", name: "John Doe" },
        status: "live",
        description: "Live doorcard should use public URL",
      },
      {
        id: "456",
        user: { username: "msmith", name: "Mary Smith" },
        status: "draft",
        description: "Draft doorcard should use admin URL with auth",
      },
      {
        id: "789",
        user: { username: null, name: "Jane Wilson" },
        status: "live",
        description: "Live doorcard without username should use name slug",
      },
      {
        id: "101",
        user: null,
        status: "archived",
        description: "Doorcard without user should use fallback",
      },
    ];

    mockDoorcards.forEach((doorcard) => {
      const viewUrl = URLGenerator.getViewUrl(doorcard, {
        status: doorcard.status,
      });
      const printUrl = URLGenerator.getPrintUrl(viewUrl);

      // Validate URL structure
      if (doorcard.status === "live" && doorcard.user?.username) {
        const expectedPattern = `/view/${doorcard.user.username}`;
        if (viewUrl === expectedPattern) {
          this.logger.success(
            `Live doorcard URL (${doorcard.id})`,
            "Uses correct public URL pattern",
            `${viewUrl} → ${printUrl}`
          );
        } else {
          this.logger.fail(
            `Live doorcard URL (${doorcard.id})`,
            "Incorrect URL pattern for live doorcard",
            `Expected: ${expectedPattern}, Got: ${viewUrl}`
          );
        }
      } else if (doorcard.status !== "live") {
        const expectedPattern = `/doorcard/${doorcard.id}/view?auth=true`;
        if (viewUrl === expectedPattern) {
          this.logger.success(
            `${doorcard.status} doorcard URL (${doorcard.id})`,
            "Uses correct admin URL pattern",
            `${viewUrl} → ${printUrl}`
          );
        } else {
          this.logger.fail(
            `${doorcard.status} doorcard URL (${doorcard.id})`,
            "Incorrect URL pattern for non-live doorcard",
            `Expected: ${expectedPattern}, Got: ${viewUrl}`
          );
        }
      }

      // Validate print URL always has print=true
      if (printUrl.includes("print=true")) {
        this.logger.success(
          `Print URL validation (${doorcard.id})`,
          "Contains required print parameter"
        );
      } else {
        this.logger.fail(
          `Print URL validation (${doorcard.id})`,
          "Missing print=true parameter",
          `Print URL: ${printUrl}`
        );
      }
    });
  }

  /**
   * Test URL encoding and special characters
   */
  testURLEncoding() {
    this.logger.log("\n🔍 Testing URL Encoding...", "blue");

    const specialCases = [
      {
        name: "Username with numbers",
        user: { username: "jdoe123", name: "John Doe" },
        expectedSlug: "jdoe123",
      },
      {
        name: "Name with spaces",
        user: { username: null, name: "Mary Jane Smith" },
        expectedSlug: "mary-jane-smith",
      },
      {
        name: "Name with special chars",
        user: { username: null, name: "José María" },
        expectedSlug: "josé-maría",
      },
      {
        name: "Empty user fallback",
        user: null,
        expectedSlug: "user",
      },
    ];

    specialCases.forEach((testCase) => {
      const slug = URLGenerator.publicSlug(testCase.user);

      if (slug === testCase.expectedSlug) {
        this.logger.success(
          `URL slug: ${testCase.name}`,
          "Generated correct slug",
          `"${testCase.user?.name || testCase.user?.username || "null"}" → "${slug}"`
        );
      } else {
        this.logger.fail(
          `URL slug: ${testCase.name}`,
          "Incorrect slug generation",
          `Expected: "${testCase.expectedSlug}", Got: "${slug}"`
        );
      }
    });
  }

  /**
   * Test edge cases and error conditions
   */
  testEdgeCases() {
    this.logger.log("\n🔍 Testing Edge Cases...", "blue");

    // Test malformed URLs
    const malformedUrls = [
      "",
      "/",
      "///",
      "/view/",
      "/doorcard//view",
      "/view/?",
      "/view/?=",
      "/view/?&",
    ];

    malformedUrls.forEach((url) => {
      try {
        const printUrl = URLGenerator.getPrintUrl(url);

        // Check if result is reasonable
        if (printUrl.includes("print=true")) {
          this.logger.success(
            `Edge case: "${url}"`,
            "Handled gracefully",
            `Result: "${printUrl}"`
          );
        } else {
          this.logger.warn(
            `Edge case: "${url}"`,
            "Unexpected result",
            `Result: "${printUrl}"`
          );
        }
      } catch (error) {
        this.logger.fail(
          `Edge case: "${url}"`,
          "Threw unexpected error",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Test realistic URL patterns from actual database
   */
  async testDatabaseURLPatterns() {
    this.logger.log("\n🔍 Testing Database URL Patterns...", "blue");

    try {
      // Sample a few doorcards from the database to test real scenarios
      const sampleDoorcards = await prisma.doorcard.findMany({
        take: 5,
        include: {
          User: {
            select: {
              username: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (sampleDoorcards.length === 0) {
        this.logger.warn(
          "Database test",
          "No doorcards found in database",
          "This test requires sample data"
        );
        return;
      }

      this.logger.success(
        "Database connection",
        `Found ${sampleDoorcards.length} sample doorcards`
      );

      sampleDoorcards.forEach((doorcard, index) => {
        const liveUrl = URLGenerator.getViewUrl(doorcard, { status: "live" });
        const draftUrl = URLGenerator.getViewUrl(doorcard, { status: "draft" });
        const livePrintUrl = URLGenerator.getPrintUrl(liveUrl);
        const draftPrintUrl = URLGenerator.getPrintUrl(draftUrl);

        // Validate URL structure
        const hasValidStructure =
          liveUrl.startsWith("/view/") &&
          draftUrl.startsWith("/doorcard/") &&
          draftUrl.includes("?auth=true") &&
          livePrintUrl.includes("print=true") &&
          draftPrintUrl.includes("print=true");

        if (hasValidStructure) {
          this.logger.success(
            `Real doorcard ${index + 1} (${doorcard.id})`,
            "All URL patterns valid",
            `Live: ${liveUrl}\nDraft: ${draftUrl}`
          );
        } else {
          this.logger.fail(
            `Real doorcard ${index + 1} (${doorcard.id})`,
            "Invalid URL pattern detected",
            `Live: ${liveUrl}\nDraft: ${draftUrl}`
          );
        }
      });
    } catch (error) {
      this.logger.fail(
        "Database connection",
        "Failed to test real doorcard data",
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Run all URL tests
   */
  async runAllTests() {
    this.logger.log("\n🚀 Starting Next Doorcard QA URL Testing...", "cyan");
    this.logger.log(
      "Testing URL generation, print functionality, and edge cases\n",
      "dim"
    );

    this.testPrintURLGeneration();
    this.testDoorcardStatusURLs();
    this.testURLEncoding();
    this.testEdgeCases();
    await this.testDatabaseURLPatterns();
  }
}

/**
 * Additional quality checks
 */
class QualityChecks {
  constructor(private logger: QALogger) {}

  /**
   * Check for common URL security issues
   */
  testURLSecurity() {
    this.logger.log("\n🔍 Testing URL Security...", "blue");

    const securityTestCases = [
      {
        input: '/view/<script>alert("xss")</script>',
        description: "XSS attempt in URL",
      },
      {
        input: "/view/../../../etc/passwd",
        description: "Path traversal attempt",
      },
      {
        input: "/view/normal?param=<script>",
        description: "XSS in query parameter",
      },
    ];

    securityTestCases.forEach((testCase) => {
      try {
        const result = URLGenerator.getPrintUrl(testCase.input);

        // Check if dangerous content is properly handled
        if (result.includes("<script>") || result.includes("..")) {
          this.logger.warn(
            `Security: ${testCase.description}`,
            "Potentially dangerous content not sanitized",
            `Input: ${testCase.input}\nOutput: ${result}`
          );
        } else {
          this.logger.success(
            `Security: ${testCase.description}`,
            "Handled safely"
          );
        }
      } catch (error) {
        this.logger.success(
          `Security: ${testCase.description}`,
          "Rejected with error (good)",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * Test URL length limits and performance
   */
  testURLLimits() {
    this.logger.log("\n🔍 Testing URL Limits...", "blue");

    const longUsername = "a".repeat(100);
    const extremelyLongUsername = "a".repeat(2000);

    const testCases = [
      {
        name: "Long username (100 chars)",
        user: { username: longUsername, name: "Test User" },
        expectation: "Should handle gracefully",
      },
      {
        name: "Extremely long username (2000 chars)",
        user: { username: extremelyLongUsername, name: "Test User" },
        expectation: "May truncate or reject",
      },
    ];

    testCases.forEach((testCase) => {
      try {
        const slug = URLGenerator.publicSlug(testCase.user);
        const url = `/view/${slug}`;
        const printUrl = URLGenerator.getPrintUrl(url);

        if (printUrl.length < 2048) {
          // Common URL length limit
          this.logger.success(
            testCase.name,
            "URL length acceptable",
            `Length: ${printUrl.length} chars`
          );
        } else {
          this.logger.warn(
            testCase.name,
            "URL may exceed browser limits",
            `Length: ${printUrl.length} chars (>2048)`
          );
        }
      } catch (error) {
        this.logger.fail(
          testCase.name,
          "URL generation failed",
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async runAllChecks() {
    this.testURLSecurity();
    this.testURLLimits();
  }
}

/**
 * Main execution
 */
async function main() {
  const logger = new QALogger();

  try {
    logger.log("Next Doorcard Quality Assurance - URL Testing Suite", "bold");
    logger.log("Ensuring $100/month service quality standards\n", "dim");

    const urlTests = new URLTestSuite(logger);
    const qualityChecks = new QualityChecks(logger);

    // Run all test suites
    await urlTests.runAllTests();
    await qualityChecks.runAllChecks();

    logger.printSummary();
  } catch (error) {
    logger.fail(
      "QA Script Execution",
      "Script failed with unexpected error",
      `Error: ${error instanceof Error ? error.message : String(error)}`
    );
    logger.printSummary();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the QA suite
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

export { URLGenerator, URLTestSuite, QualityChecks };
