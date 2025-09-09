#!/usr/bin/env npx ts-node

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Checking for corrupt/legacy data...");

  // Find doorcards with problematic names or terms
  const problematicDoorcards = await prisma.doorcard.findMany({
    include: {
      User: true,
    },
    where: {
      OR: [
        // Non-Fall 2025 terms
        {
          NOT: {
            AND: [{ term: "FALL" }, { year: 2025 }],
          },
        },
        // Users with very short names (likely corrupted)
        {
          User: {
            name: {
              in: [
                "Kwa Nt",
                "Khi Nek",
                "Lla Mase",
                "Lop Ezthibodeauxm",
                "Dia Zs",
                "Zou Ghbiea",
                "Mar Quezr",
                "Hei Ne",
                "Ayo Ttel",
                "She Ks",
                "Men Gq",
                "Bro Wnek",
              ],
            },
          },
        },
        // Course names showing as doorcard names
        {
          name: {
            contains: "FITN",
          },
        },
      ],
    },
  });

  console.log(`Found ${problematicDoorcards.length} problematic doorcards`);

  if (problematicDoorcards.length > 0) {
    console.log("Problematic doorcards:");
    problematicDoorcards.forEach((dc) => {
      console.log(`- ${dc.User.name} | ${dc.name} | ${dc.term} ${dc.year}`);
    });

    const shouldClean = process.argv.includes("--clean");

    if (shouldClean) {
      console.log("🧹 Cleaning problematic data...");

      for (const doorcard of problematicDoorcards) {
        // Delete appointments first (foreign key constraint)
        await prisma.appointment.deleteMany({
          where: { doorcardId: doorcard.id },
        });

        // Delete the doorcard
        await prisma.doorcard.delete({
          where: { id: doorcard.id },
        });

        console.log(`Deleted doorcard: ${doorcard.name}`);
      }

      console.log("✅ Cleanup complete");
    } else {
      console.log("💡 Run with --clean flag to remove this data");
    }
  }

  // Show current clean data stats
  const cleanData = await prisma.doorcard.findMany({
    where: {
      term: "FALL",
      year: 2025,
      isActive: true,
      isPublic: true,
    },
    include: {
      User: true,
    },
  });

  console.log(
    `\n📊 Current clean data: ${cleanData.length} Fall 2025 doorcards`
  );
  console.log(
    "Sample names:",
    cleanData.slice(0, 5).map((dc) => dc.User.name)
  );
}

if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
