#!/usr/bin/env node

const { spawn } = require('child_process');
const waitOn = require('wait-on');

const DEFAULT_PORT = 3000;
const TIMEOUT = 60000; // 60 seconds

async function checkServer(baseUrl) {
  try {
    console.log(`🔍 Checking if server is running at ${baseUrl}...`);
    
    await waitOn({
      resources: [baseUrl],
      timeout: 5000, // Quick check
      interval: 100,
      verbose: false
    });
    
    console.log(`✅ Server is already running at ${baseUrl}`);
    return true;
  } catch (error) {
    console.log(`❌ Server is not running at ${baseUrl}`);
    return false;
  }
}

async function startServer(command = 'npm run dev') {
  console.log(`🚀 Starting server with: ${command}`);
  
  const [cmd, ...args] = command.split(' ');
  const serverProcess = spawn(cmd, args, {
    stdio: 'pipe',
    detached: true
  });
  
  // Log server output
  serverProcess.stdout.on('data', (data) => {
    const message = data.toString();
    if (message.includes('Ready') || message.includes('ready') || message.includes('localhost')) {
      console.log(`📡 ${message.trim()}`);
    }
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data.toString()}`);
  });
  
  return serverProcess;
}

async function waitForServer(baseUrl, timeout = TIMEOUT) {
  console.log(`⏳ Waiting for server to be ready at ${baseUrl}...`);
  
  try {
    await waitOn({
      resources: [baseUrl],
      timeout,
      interval: 1000,
      verbose: false
    });
    
    console.log(`✅ Server is ready at ${baseUrl}`);
    return true;
  } catch (error) {
    console.error(`❌ Server failed to start within ${timeout}ms`);
    throw error;
  }
}

async function runCypress(command = 'npx cypress run') {
  console.log(`🧪 Running Cypress tests: ${command}`);
  
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command.split(' ');
    const cypressProcess = spawn(cmd, args, {
      stdio: 'inherit'
    });
    
    cypressProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Cypress tests completed successfully');
        resolve(code);
      } else {
        console.error(`❌ Cypress tests failed with exit code ${code}`);
        reject(new Error(`Cypress failed with code ${code}`));
      }
    });
    
    cypressProcess.on('error', (error) => {
      console.error('❌ Failed to start Cypress:', error);
      reject(error);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const baseUrl = process.env.CYPRESS_BASE_URL || `http://localhost:${DEFAULT_PORT}`;
  const serverCommand = process.env.SERVER_COMMAND || 'npm run dev';
  const cypressCommand = args.length > 0 ? args.join(' ') : 'npx cypress run';
  
  let serverProcess = null;
  
  try {
    // Check if server is already running
    const isServerRunning = await checkServer(baseUrl);
    
    if (!isServerRunning) {
      // Start the server
      serverProcess = await startServer(serverCommand);
      
      // Wait for server to be ready
      await waitForServer(baseUrl);
    }
    
    // Run Cypress tests
    await runCypress(cypressCommand);
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    // Clean up server process
    if (serverProcess) {
      console.log('🛑 Stopping server...');
      process.kill(-serverProcess.pid);
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\\n🛑 Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n🛑 Received SIGTERM, cleaning up...');
  process.exit(0);
});

if (require.main === module) {
  main();
}

module.exports = { checkServer, startServer, waitForServer, runCypress };