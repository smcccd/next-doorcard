import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  // During build time, DATABASE_URL might not be available
  // Use a placeholder URL to prevent build errors
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  // For Neon, ensure proper pooling configuration
  let connectionString = databaseUrl;
  
  // Only modify if it's a real Neon connection (not placeholder)
  if (databaseUrl.includes("neon.tech") && !databaseUrl.includes("placeholder")) {
    // Check if pooling params already exist
    const hasParams = databaseUrl.includes("?");
    const separator = hasParams ? "&" : "?";
    
    // Add Neon-optimized pooling parameters if not present
    if (!databaseUrl.includes("pgbouncer")) {
      connectionString = `${databaseUrl}${separator}pgbouncer=true&connect_timeout=15&pool_timeout=10`;
    }
  }

  console.log("Prisma connecting to:", connectionString.replace(/:[^:@]+@/, ':***@')); // Log URL without password

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });
};

export const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

// Gracefully handle shutdown
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
