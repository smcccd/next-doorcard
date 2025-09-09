#!/usr/bin/env npx tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findBadNames() {
  const doorcards = await prisma.doorcard.findMany({
    where: {
      term: "FALL",
      year: 2025,
      isActive: true,
      isPublic: true,
    },
    include: { User: true },
  });

  console.log("=== ALL CURRENT DOORCARDS ===");
  console.log("Total:", doorcards.length);

  const suspicious: string[] = [];
  const clean: string[] = [];

  doorcards.forEach((dc) => {
    const name = dc.User.name || "";

    // Look for patterns of corrupted names
    const isSuspicious =
      name.length < 6 || // Very short
      (name.includes(" ") && name.split(" ")[1]?.length < 3) || // Short last name
      name.match(/^[A-Z][a-z]{2,3} [A-Z][a-z]{1,4}$/); // Pattern like "Ebe Rtd"

    if (isSuspicious) {
      suspicious.push(`${name} | Office ${dc.officeNumber}`);
    } else {
      clean.push(`${name} | Office ${dc.officeNumber}`);
    }
  });

  console.log("\n=== SUSPICIOUS NAMES ===");
  console.log("Count:", suspicious.length);
  suspicious.forEach((name) => console.log(`⚠️  ${name}`));

  console.log("\n=== CLEAN NAMES ===");
  console.log("Count:", clean.length);
  clean.forEach((name) => console.log(`✅ ${name}`));
}

findBadNames()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
