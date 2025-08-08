import { prisma } from "@/lib/prisma";

async function testConnection() {
  try {
    console.log("Testing database connection...");

    const count = await prisma.doorcard.count({
      where: {
        isActive: true,
        isPublic: true,
        term: "FALL",
        year: 2025,
      },
    });

    console.log(`Found ${count} active public Fall 2025 doorcards`);

    const doorcards = await prisma.doorcard.findMany({
      where: {
        isActive: true,
        isPublic: true,
        term: "FALL",
        year: 2025,
      },
      take: 5,
      include: {
        User: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    console.log("Sample doorcards:");
    doorcards.forEach((dc) => {
      console.log(`- ${dc.name} (${dc.User.name})`);
    });
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
