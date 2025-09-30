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

  // Add connection string parameters for Neon pooling
  const connectionString = databaseUrl.includes("neon.tech")
    ? `${databaseUrl}?pgbouncer=true&connect_timeout=10&connection_limit=5`
    : databaseUrl;

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
