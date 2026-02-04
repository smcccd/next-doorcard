#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");

console.log("🔍 CI Configuration Test");

// Check if required files exist
const requiredFiles = [
  "package.json",
  "jest.config.ci.js",
  "cypress/e2e/smoke.cy.ts",
  ".github/workflows/ci.yml",
];

console.log("\n📁 Checking required files...");
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    process.exit(1);
  }
}

// Test commands
const commands = [
  ["npm", ["run", "lint"]],
  ["npm", ["run", "type-check"]],
  ["npx", ["prisma", "generate"]],
];

console.log("\n🧪 Testing CI commands...");

async function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "pipe" });
    let output = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      output += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${cmd} ${args.join(" ")}`);
        resolve(output);
      } else {
        console.log(`❌ ${cmd} ${args.join(" ")} - Exit code: ${code}`);
        console.log(output);
        reject(new Error(`Command failed: ${code}`));
      }
    });
  });
}

async function main() {
  try {
    for (const [cmd, args] of commands) {
      await runCommand(cmd, args);
    }

    console.log("\n🎉 All CI configuration tests passed!");
    console.log("Ready to push to GitHub.");
  } catch (error) {
    console.log("\n💥 CI test failed:", error.message);
    process.exit(1);
  }
}

main();
