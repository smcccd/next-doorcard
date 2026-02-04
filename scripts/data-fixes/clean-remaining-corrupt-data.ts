#!/usr/bin/env npx tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Pattern-based detection for corrupted names
function isCorruptedName(name: string): boolean {
  if (!name) return true;

  // Very short names
  if (name.length < 6) return true;

  // Short last name patterns (like "Ebe Rtd", "Jon Ess", etc.)
  if (name.includes(" ")) {
    const parts = name.split(" ");
    if (parts[1]?.length < 3) return true;
  }

  // Specific corrupted patterns we see
  if (name.match(/^[A-Z][a-z]{2,3} [A-Z][a-z]{1,4}$/)) return true;

  // Three letter first names + short last names are suspicious
  if (name.match(/^[A-Z][a-z]{2} [A-Z][a-z]{1,3}$/)) return true;

  return false;
}

async function cleanRemainingCorruptData() {
  console.log("🔍 Finding remaining corrupted doorcards...");

  // Find all doorcards to check for corruption
  const allDoorcards = await prisma.doorcard.findMany({
    include: {
      User: true,
      Appointment: true,
    },
    where: {
      term: "FALL",
      year: 2025,
    },
  });

  // Filter for corrupted names using pattern detection
  const corruptedDoorcards = allDoorcards.filter((dc) =>
    isCorruptedName(dc.User.name || "")
  );

  console.log(
    `Found ${corruptedDoorcards.length} additional corrupted doorcards:`
  );

  corruptedDoorcards.forEach((dc) => {
    console.log(
      `- ${dc.User.name} | ${dc.name} | ${dc.officeNumber} | ${dc.term} ${dc.year}`
    );
  });

  if (process.argv.includes("--clean")) {
    console.log("\n🧹 Cleaning corrupted data...");

    for (const doorcard of corruptedDoorcards) {
      // Delete appointments first
      await prisma.appointment.deleteMany({
        where: { doorcardId: doorcard.id },
      });

      // Delete the doorcard
      await prisma.doorcard.delete({
        where: { id: doorcard.id },
      });

      console.log(`✓ Deleted: ${doorcard.User.name}`);
    }

    console.log("\n✅ Additional cleanup complete");
  } else {
    console.log("\n💡 Run with --clean flag to remove this data");
  }

  // Show clean data after cleanup
  const cleanDoorcards = await prisma.doorcard.findMany({
    where: {
      term: "FALL",
      year: 2025,
      isActive: true,
      isPublic: true,
    },
    include: { User: true },
    take: 10,
  });

  console.log(`\n📊 Clean Fall 2025 doorcards: ${cleanDoorcards.length}`);
  cleanDoorcards.forEach((dc) => {
    console.log(`✓ ${dc.User.name} - Office ${dc.officeNumber}`);
  });
}

if (require.main === module) {
  cleanRemainingCorruptData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
