#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Load environment variables in correct precedence (.env.local overrides .env)
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment =
  process.env.NODE_ENV === "development" || !process.env.NODE_ENV;

console.log("🔧 Setting up environment...");
console.log(`Environment: ${isProduction ? "production" : "development"}`);

// Determine database configuration
const databaseConfig = process.env.DATABASE_URL;
const isNeonDb = databaseConfig?.includes("neon.tech");
const isSqlite = databaseConfig?.startsWith("file:");
const isLocalPostgres = databaseConfig?.includes("localhost:5432");

console.log(
  `Database: ${databaseConfig ? 
    (isSqlite ? "SQLite (local)" : 
     isLocalPostgres ? "PostgreSQL (Docker)" : 
     "PostgreSQL (remote)") : 
    "NOT SET"}`
);

// Force PostgreSQL for production and Neon databases
const dbProvider =
  isProduction || isNeonDb ? "postgresql" : isSqlite ? "sqlite" : "postgresql";

// Create schema based on environment
const schemaTemplate = `generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "${dbProvider}"
  url      = env("DATABASE_URL")
}`;

// Read the current schema
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const currentSchema = fs.readFileSync(schemaPath, "utf8");

// Extract everything after the datasource block
const modelStart = currentSchema.indexOf("\nmodel ");
if (modelStart === -1) {
  console.error("❌ Could not find models in schema.prisma");
  process.exit(1);
}

const models = currentSchema.substring(modelStart);
const newSchema = schemaTemplate + models;

// Only write if changed to avoid unnecessary rebuilds
if (currentSchema !== newSchema) {
  fs.writeFileSync(schemaPath, newSchema);
  console.log("✅ Updated prisma/schema.prisma for current environment");
} else {
  console.log("✅ Schema is already configured correctly");
}

// Create a .env file specifically for Prisma CLI (since it reads .env first)
const prismaEnvPath = path.join(__dirname, "..", ".env");

// Check if .env exists first (won't exist in Vercel)
if (fs.existsSync(prismaEnvPath)) {
  const currentEnvContent = fs.readFileSync(prismaEnvPath, "utf8");
  const updatedEnvContent = currentEnvContent.replace(
    /DATABASE_URL=.*/,
    `DATABASE_URL="${databaseConfig}"`
  );

  if (currentEnvContent !== updatedEnvContent) {
    fs.writeFileSync(prismaEnvPath, updatedEnvContent);
    console.log("✅ Updated .env with current database URL");
  }
} else {
  // In Vercel, create minimal .env for Prisma CLI
  fs.writeFileSync(prismaEnvPath, `DATABASE_URL="${databaseConfig}"`);
  console.log("✅ Created .env file for Prisma CLI");
}

console.log("🎉 Environment setup complete");
