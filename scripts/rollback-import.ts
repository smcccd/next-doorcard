import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function rollbackImport() {
  console.log("🔄 Starting import rollback...");

  try {
    // Delete in reverse order of dependencies
    console.log("🗑️  Deleting appointments...");
    const appointmentCount = await prisma.appointment.deleteMany({});
    console.log(`✅ Deleted ${appointmentCount.count} appointments`);

    console.log("🗑️  Deleting doorcards...");
    const doorcardCount = await prisma.doorcard.deleteMany({});
    console.log(`✅ Deleted ${doorcardCount.count} doorcards`);

    console.log("🗑️  Deleting users (keeping admin users)...");
    const userCount = await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: "@smccd.edu",
        },
        role: {
          not: "ADMIN",
        },
      },
    });
    console.log(`✅ Deleted ${userCount.count} imported users`);

    console.log("✅ Rollback completed successfully!");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

rollbackImport();
