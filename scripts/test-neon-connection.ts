import { PrismaClient } from "@prisma/client";

// Set the environment variables
process.env.DATABASE_URL =
  "postgresql://neondb_owner:npg_Sup5dyCXawK2@ep-still-moon-afse7st5-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";
process.env.DIRECT_URL =
  "postgresql://neondb_owner:npg_Sup5dyCXawK2@ep-still-moon-afse7st5.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function testConnection() {
  console.log("🔍 Testing Neon database connection...\n");

  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT current_database(), version()`;
    console.log("✅ Database connected successfully!");
    console.log("Database info:", result);

    // Check tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    console.log("\n📊 Tables in database:");
    console.log(tables);

    // Count records in key tables
    const userCount = await prisma.user.count();
    const doorcardCount = await prisma.doorcard.count();
    const termCount = await prisma.term.count();

    console.log("\n📈 Record counts:");
    console.log(`  Users: ${userCount}`);
    console.log(`  Doorcards: ${doorcardCount}`);
    console.log(`  Terms: ${termCount}`);

    console.log("\n✅ Database is ready for production!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
