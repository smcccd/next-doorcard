#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🔧 Setting up environment...");

// Determine environment
const env = process.env.NODE_ENV || "development";
const isProduction = env === "production";

console.log("Environment:", env);

// Database configuration
let databaseConfig;
let provider;

if (isProduction && process.env.NEON_DATABASE_URL) {
  // Production: Use Neon PostgreSQL
  databaseConfig = process.env.NEON_DATABASE_URL;
  provider = "postgresql";
  console.log("Database: PostgreSQL (remote)");
} else if (process.env.DATABASE_URL) {
  // Use explicit DATABASE_URL if set
  databaseConfig = process.env.DATABASE_URL;
  provider = databaseConfig.startsWith("postgres") ? "postgresql" : "sqlite";
  console.log(`Database: ${provider} (from DATABASE_URL)`);
} else {
  // Development: Use local SQLite
  databaseConfig = "file:./prisma/dev.db";
  provider = "sqlite";
  console.log("Database: SQLite (local)");
}

// Update schema file
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
let schema = fs.readFileSync(schemaPath, "utf8");

// Replace the provider line
const newSchema = schema.replace(
  /provider\s*=\s*"[^"]+"/,
  `provider = "${provider}"`
);

if (schema !== newSchema) {
  fs.writeFileSync(schemaPath, newSchema);
  console.log("✅ Updated prisma/schema.prisma for current environment");
} else {
  console.log("✅ Schema is already configured correctly");
}

// Create a .env file specifically for Prisma CLI (since it reads .env first)
const prismaEnvPath = path.join(__dirname, "..", ".env");

// Check if .env exists first (it won't in Vercel)
let currentEnvContent = "";
let updatedEnvContent = `DATABASE_URL="${databaseConfig}"`;

if (fs.existsSync(prismaEnvPath)) {
  currentEnvContent = fs.readFileSync(prismaEnvPath, "utf8");
  updatedEnvContent = currentEnvContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${databaseConfig}"`
  );
} else {
  // In Vercel, create a minimal .env for Prisma
  console.log("📝 Creating .env file for Prisma CLI");
}

if (currentEnvContent !== updatedEnvContent) {
  fs.writeFileSync(prismaEnvPath, updatedEnvContent);
  console.log("✅ Updated .env with current database URL");
}

console.log("🎉 Environment setup complete");
