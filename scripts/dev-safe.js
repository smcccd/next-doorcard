#!/usr/bin/env node

const { exec, spawn } = require("child_process");
const path = require("path");

console.log("🔍 Checking for existing development processes...");

// Function to check if Next.js dev server is already running and healthy
const checkHealthyServer = () => {
  return new Promise((resolve) => {
    exec(
      'curl -s http://localhost:3000 > /dev/null && echo "healthy"',
      (error, stdout) => {
        resolve(!error && stdout.includes("healthy"));
      }
    );
  });
};

// Function to kill processes by pattern
const killProcesses = (pattern, description) => {
  return new Promise((resolve) => {
    exec(
      `ps aux | grep -E "${pattern}" | grep -v grep | awk '{print $2}'`,
      (error, stdout) => {
        if (error || !stdout.trim()) {
          console.log(`✅ No existing ${description} processes found`);
          resolve();
          return;
        }

        const pids = stdout.trim().split("\n").filter(Boolean);
        console.log(
          `🚫 Found ${pids.length} existing ${description} process(es), killing...`
        );

        exec(`kill ${pids.join(" ")}`, (killError) => {
          if (killError) {
            console.log(
              `⚠️  Some ${description} processes may still be running`
            );
          } else {
            console.log(`✅ Killed ${pids.length} ${description} process(es)`);
          }
          resolve();
        });
      }
    );
  });
};

async function main() {
  try {
    // Check if there's already a healthy server running
    const isHealthy = await checkHealthyServer();

    if (isHealthy) {
      console.log(
        "✅ Development server already running and healthy at http://localhost:3000"
      );
      console.log(
        "💡 Use Ctrl+C to stop the existing server if you need to restart"
      );
      process.exit(0);
    }

    // Kill existing Next.js dev servers only if no healthy server found
    await killProcesses("next.*dev|next-server", "Next.js dev server");

    // Kill any processes using ports 3000-3001
    await killProcesses(".*:300[01]", "port 3000-3001");

    // Small delay to ensure processes are fully terminated
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("🚀 Starting clean development server...");

    // Start the dev server directly with Next.js
    const devProcess = spawn("npx", ["next", "dev"], {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    // Handle process termination
    process.on("SIGINT", () => {
      console.log("\n🛑 Shutting down development server...");
      devProcess.kill("SIGINT");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("\n🛑 Shutting down development server...");
      devProcess.kill("SIGTERM");
      process.exit(0);
    });

    devProcess.on("close", (code) => {
      console.log(`\n📊 Development server exited with code ${code}`);
      process.exit(code);
    });
  } catch (error) {
    console.error("❌ Error starting development server:", error);
    process.exit(1);
  }
}

main();
