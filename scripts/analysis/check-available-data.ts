import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkAvailableData() {
  console.log("🔍 Checking Available Data in Database");
  console.log("=".repeat(50));

  try {
    // Check all available terms and years
    console.log("\n📅 Available Terms and Years:");
    const availableTerms = await prisma.$queryRaw<
      Array<{
        term: string;
        year: number;
        doorcard_count: bigint;
        active_count: bigint;
      }>
    >`
      SELECT 
        d.term,
        d.year,
        COUNT(*) as doorcard_count,
        COUNT(CASE WHEN d."isActive" = true THEN 1 END) as active_count
      FROM "Doorcard" d
      GROUP BY d.term, d.year
      ORDER BY d.year DESC, 
        CASE d.term 
          WHEN 'SPRING' THEN 1 
          WHEN 'SUMMER' THEN 2 
          WHEN 'FALL' THEN 3 
        END
    `;

    availableTerms.forEach((item) => {
      console.log(
        `${item.term} ${item.year}: ${item.doorcard_count} total doorcards (${item.active_count} active)`
      );
    });

    // Check campuses
    console.log("\n🏫 Available Campuses:");
    const availableCampuses = await prisma.$queryRaw<
      Array<{
        college: string | null;
        doorcard_count: bigint;
        user_count: bigint;
      }>
    >`
      SELECT 
        d.college,
        COUNT(*) as doorcard_count,
        COUNT(DISTINCT d."userId") as user_count
      FROM "Doorcard" d
      GROUP BY d.college
      ORDER BY doorcard_count DESC
    `;

    availableCampuses.forEach((item) => {
      const campus = item.college || "NO_CAMPUS";
      console.log(
        `${campus}: ${item.doorcard_count} doorcards, ${item.user_count} users`
      );
    });

    // Check total users
    console.log("\n👥 Total Users:");
    const totalUsers = await prisma.user.count();
    const usersWithDoorcards = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT u.id) as count
      FROM "User" u
      JOIN "Doorcard" d ON u.id = d."userId"
    `;

    console.log(`Total users in system: ${totalUsers}`);
    console.log(`Users with doorcards: ${usersWithDoorcards[0]?.count || 0}`);

    // Check most recent data
    console.log("\n📈 Most Recent Activity:");
    const recentDoorcards = await prisma.$queryRaw<
      Array<{
        term: string;
        year: number;
        college: string | null;
        created_at: Date;
        is_active: boolean;
      }>
    >`
      SELECT 
        d.term,
        d.year,
        d.college,
        d."createdAt" as created_at,
        d."isActive" as is_active
      FROM "Doorcard" d
      ORDER BY d."createdAt" DESC
      LIMIT 10
    `;

    console.log("10 Most Recent Doorcards:");
    recentDoorcards.forEach((item, index) => {
      const campus = item.college || "NO_CAMPUS";
      const status = item.is_active ? "ACTIVE" : "INACTIVE";
      console.log(
        `${(index + 1).toString().padStart(2)}. ${item.term} ${item.year} | ${campus} | ${status} | ${item.created_at.toISOString().split("T")[0]}`
      );
    });
  } catch (error) {
    console.error("Error checking available data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableData().catch(console.error);
