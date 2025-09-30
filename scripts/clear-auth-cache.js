#!/usr/bin/env node

/**
 * Authentication Cache Cleaner
 *
 * Clears all cached authentication sessions and related data.
 * Useful for debugging authentication issues or starting fresh.
 */

const fs = require("fs");
const path = require("path");

console.log("🧹 Clearing Authentication Cache");
console.log("================================");

const cacheDir = path.join(process.cwd(), "cypress/cache");
let clearedCount = 0;

// Clear session cache files
if (fs.existsSync(cacheDir)) {
  const files = fs.readdirSync(cacheDir);

  files.forEach((file) => {
    if (file.startsWith("session-") && file.endsWith(".json")) {
      const filePath = path.join(cacheDir, file);
      try {
        fs.unlinkSync(filePath);
        console.log(`✅ Removed session: ${file}`);
        clearedCount++;
      } catch (error) {
        console.log(`❌ Failed to remove ${file}: ${error.message}`);
      }
    }
  });

  // Remove any other auth-related cache files
  const authFiles = files.filter(
    (file) =>
      file.includes("auth") ||
      file.includes("token") ||
      file.includes("onelogin")
  );

  authFiles.forEach((file) => {
    const filePath = path.join(cacheDir, file);
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed cache file: ${file}`);
      clearedCount++;
    } catch (error) {
      console.log(`❌ Failed to remove ${file}: ${error.message}`);
    }
  });
} else {
  console.log("📁 Cache directory does not exist");
}

// Clear browser storage files if they exist
const storagePatterns = [
  "cypress/downloads/*auth*",
  "cypress/screenshots/*auth*",
  "cypress/videos/*auth*",
];

storagePatterns.forEach((pattern) => {
  const globPath = path.join(process.cwd(), pattern);
  // Note: This is a simple implementation. In a real scenario, you might use a glob library
  console.log(`🔍 Checking pattern: ${pattern}`);
});

console.log("");
console.log(`📊 Summary: Cleared ${clearedCount} authentication cache files`);

if (clearedCount > 0) {
  console.log("");
  console.log("✅ Authentication cache cleared successfully!");
  console.log("💡 Next authentication will require manual login");
  console.log("🔄 Run your tests again to create fresh sessions");
} else {
  console.log("");
  console.log("ℹ️  No cached authentication data found");
  console.log("🎯 All authentication will require manual login");
}

console.log("");
console.log("🚀 Ready for fresh authentication tests!");

process.exit(0);
