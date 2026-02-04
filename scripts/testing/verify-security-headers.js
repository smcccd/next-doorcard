#!/usr/bin/env node
/**
 * Security Headers Verification Script
 * Verifies that all production-grade security headers are properly configured
 */

const expectedHeaders = {
  // Core security headers
  "Content-Security-Policy": {
    required: true,
    description:
      "Prevents XSS, injection attacks, and unauthorized resource loading",
    mustContain: [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "https://smccd.onelogin.com", // OneLogin SSO support
    ],
  },
  "X-Frame-Options": {
    required: true,
    description: "Prevents clickjacking attacks",
    expectedValue: "DENY",
  },
  "X-Content-Type-Options": {
    required: true,
    description: "Prevents MIME type sniffing",
    expectedValue: "nosniff",
  },
  "Referrer-Policy": {
    required: true,
    description: "Controls referrer information leakage",
    expectedValue: "strict-origin-when-cross-origin",
  },
  "X-XSS-Protection": {
    required: true,
    description: "Legacy XSS protection (modern browsers use CSP)",
    expectedValue: "1; mode=block",
  },
  "Permissions-Policy": {
    required: true,
    description: "Controls browser feature access",
    mustContain: ["camera=()", "microphone=()", "geolocation=()"],
  },
  "Cross-Origin-Embedder-Policy": {
    required: true,
    description: "Enables cross-origin isolation",
    expectedValue: "credentialless",
  },
  "Cross-Origin-Opener-Policy": {
    required: true,
    description: "Prevents cross-origin window access",
    expectedValue: "same-origin-allow-popups",
  },
  "Cross-Origin-Resource-Policy": {
    required: true,
    description: "Controls cross-origin resource sharing",
    expectedValue: "cross-origin",
  },
  // Production-only headers
  "Strict-Transport-Security": {
    required: false, // Only in production
    description: "Forces HTTPS connections (production only)",
    expectedValue: "max-age=31536000; includeSubDomains; preload",
  },
};

/**
 * Check if a URL is accessible (basic connectivity test)
 */
async function checkUrl(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Fetch and analyze security headers from a URL
 */
async function analyzeSecurityHeaders(url) {
  try {
    console.log(`🔍 Analyzing security headers for: ${url}`);
    console.log("=".repeat(60));

    const response = await fetch(url, { method: "HEAD" });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const headers = Object.fromEntries(response.headers);
    const results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: [],
    };

    // Check each expected header
    for (const [headerName, config] of Object.entries(expectedHeaders)) {
      const headerValue = headers[headerName.toLowerCase()];
      const result = {
        header: headerName,
        status: "unknown",
        message: "",
        description: config.description,
      };

      if (!headerValue) {
        if (config.required) {
          result.status = "failed";
          result.message = "❌ MISSING - This header is required for security";
          results.failed++;
        } else {
          result.status = "warning";
          result.message =
            "⚠️  OPTIONAL - Not present (expected in production only)";
          results.warnings++;
        }
      } else {
        // Header is present, check its value
        if (config.expectedValue && headerValue !== config.expectedValue) {
          result.status = "failed";
          result.message = `❌ INCORRECT VALUE\n   Expected: ${config.expectedValue}\n   Actual: ${headerValue}`;
          results.failed++;
        } else if (config.mustContain) {
          const missing = config.mustContain.filter(
            (required) => !headerValue.includes(required)
          );
          if (missing.length > 0) {
            result.status = "failed";
            result.message = `❌ MISSING DIRECTIVES: ${missing.join(", ")}\n   Actual: ${headerValue}`;
            results.failed++;
          } else {
            result.status = "passed";
            result.message = "✅ CONFIGURED CORRECTLY";
            results.passed++;
          }
        } else {
          result.status = "passed";
          result.message = "✅ CONFIGURED CORRECTLY";
          results.passed++;
        }
      }

      results.details.push(result);
    }

    // Display results
    console.log("\n📊 SECURITY HEADER ANALYSIS RESULTS:");
    console.log("-".repeat(60));

    results.details.forEach((result) => {
      console.log(`\n🔒 ${result.header}`);
      console.log(`   ${result.description}`);
      console.log(`   ${result.message}`);
    });

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 SUMMARY:");
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⚠️  Warnings: ${results.warnings}`);

    const total = results.passed + results.failed + results.warnings;
    const score = Math.round((results.passed / total) * 100);

    console.log(`\n🎯 SECURITY SCORE: ${score}% (${results.passed}/${total})`);

    if (results.failed === 0) {
      console.log(
        "\n🎉 EXCELLENT! All required security headers are properly configured."
      );
      console.log("   Your application meets production security standards.");
    } else {
      console.log("\n⚠️  WARNING: Some security headers need attention.");
      console.log("   Please review the failed checks above.");
    }

    return results.failed === 0;
  } catch (error) {
    console.error(`❌ Error analyzing headers: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const url = args[0] || "http://localhost:3000";

  console.log("🛡️  SECURITY HEADERS VERIFICATION TOOL");
  console.log("🔧 Next Doorcard Production Security Analysis");
  console.log("");

  // Check if URL is accessible
  console.log(`⏳ Checking connectivity to ${url}...`);
  const isAccessible = await checkUrl(url);

  if (!isAccessible) {
    console.error(`❌ Cannot connect to ${url}`);
    console.error("   Make sure the server is running:");
    console.error("   • Development: npm run dev");
    console.error("   • Production: npm run build && npm start");
    process.exit(1);
  }

  console.log("✅ Server is accessible\n");

  // Analyze headers
  const success = await analyzeSecurityHeaders(url);

  console.log("\n" + "=".repeat(60));
  console.log("🔐 SECURITY RECOMMENDATIONS:");
  console.log("");
  console.log(
    "1. 🌐 Deploy with HTTPS in production for full security benefit"
  );
  console.log("2. 🔄 Test OneLogin SSO flow after any CSP changes");
  console.log("3. 📊 Monitor for CSP violations in browser dev tools");
  console.log(
    "4. 🔒 Consider implementing additional headers like NEL for monitoring"
  );
  console.log("5. ⚡ Regularly audit and update security policies");

  process.exit(success ? 0 : 1);
}

// Handle script execution
if (require.main === module) {
  main().catch((error) => {
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
}

module.exports = { analyzeSecurityHeaders, expectedHeaders };
