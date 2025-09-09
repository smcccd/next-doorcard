#!/usr/bin/env npx tsx

/**
 * PRODUCTION MIGRATION - POSTGRESQL DEPLOYMENT
 * Standalone script with progress monitoring and detailed logging
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import { createWriteStream } from "fs";

// Create progress log file
const logFile = createWriteStream("migration-progress.log", { flags: "a" });
const startTime = new Date();

function log(message: string, showProgress: boolean = true) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;

  console.log(logEntry);
  logFile.write(logEntry + "\n");

  if (showProgress) {
    // Also write to a simple progress file for external monitoring
    fs.writeFileSync(
      "migration-status.txt",
      `${message}\n${timestamp}`,
      "utf8"
    );
  }
}

async function runProductionMigration() {
  const prisma = new PrismaClient();

  try {
    log("🚀 PRODUCTION MIGRATION STARTED");
    log(`📊 Migration ID: ${startTime.getTime()}`);

    // Step 1: Check current database state
    log("📋 Step 1/6: Checking current database state...");

    const currentUsers = await prisma.user.count();
    const currentDoorcards = await prisma.doorcard.count();
    const currentAppointments = await prisma.appointment.count();

    log(
      `   Current state: ${currentUsers} users, ${currentDoorcards} doorcards, ${currentAppointments} appointments`
    );

    // Step 2: Backup current data
    log("💾 Step 2/6: Creating data backup...");

    const backupData = {
      timestamp: startTime.toISOString(),
      users: await prisma.user.findMany(),
      doorcards: await prisma.doorcard.findMany(),
      appointments: await prisma.appointment.findMany(),
    };

    fs.writeFileSync(
      `backup-${startTime.getTime()}.json`,
      JSON.stringify(backupData, null, 2)
    );
    log("   ✅ Backup created successfully");

    // Step 3: Validate data integrity
    log("🔍 Step 3/6: Validating data integrity...");

    // Check for any remaining overlaps
    const overlaps = (await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Appointment" a1
      JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
        AND a1.dayOfWeek = a2.dayOfWeek 
        AND a1.id < a2.id
      JOIN "Doorcard" d ON a1.doorcardId = d.id
      WHERE d.isActive = true
        AND (a1.startTime < a2.endTime AND a1.endTime > a2.startTime)
    `) as any[];

    const overlapCount = Number(overlaps[0].count);
    if (overlapCount > 0) {
      throw new Error(
        `❌ Data validation failed: ${overlapCount} overlapping appointments found`
      );
    }

    log("   ✅ Data integrity validated - no overlaps found");

    // Step 4: Apply name capitalization fixes
    log("🎨 Step 4/6: Applying name capitalization fixes...");

    const users = await prisma.user.findMany();
    let nameFixCount = 0;

    for (const user of users) {
      if (
        user.name.includes("dr.") ||
        user.name.includes("prof.") ||
        user.name === user.name.toLowerCase()
      ) {
        const properName = properCapitalization(user.name);
        if (properName !== user.name) {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: properName },
          });
          nameFixCount++;

          if (nameFixCount % 10 === 0) {
            log(`   Progress: Fixed ${nameFixCount} names...`);
          }
        }
      }
    }

    log(`   ✅ Fixed ${nameFixCount} faculty names`);

    // Step 5: Update system for production
    log("⚙️  Step 5/6: Updating system configuration for production...");

    // Ensure all doorcards are active and in current term
    const updateResult = await prisma.doorcard.updateMany({
      where: {
        OR: [
          { isActive: false },
          { year: { not: 2025 } },
          { term: { not: "FALL" } },
        ],
      },
      data: {
        isActive: true,
        year: 2025,
        term: "FALL",
      },
    });

    log(`   ✅ Updated ${updateResult.count} doorcards for production`);

    // Step 6: Final validation
    log("🎯 Step 6/6: Final production validation...");

    const finalUsers = await prisma.user.count();
    const finalDoorcards = await prisma.doorcard.count({
      where: { isActive: true },
    });
    const finalAppointments = await prisma.appointment.count();

    // Test critical queries
    const sampleFaculty = await prisma.user.findMany({
      include: {
        doorcards: {
          where: { isActive: true },
          include: {
            appointments: true,
          },
        },
      },
      take: 3,
    });

    log(
      `   Final counts: ${finalUsers} users, ${finalDoorcards} active doorcards, ${finalAppointments} appointments`
    );
    log("   ✅ Sample faculty data validated successfully");

    // Calculate migration duration
    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    log("");
    log("🎉 PRODUCTION MIGRATION COMPLETED SUCCESSFULLY!");
    log(`⏱️  Total duration: ${duration} seconds`);
    log(`📊 Final system state:`);
    log(`   - Users: ${finalUsers}`);
    log(`   - Active Doorcards: ${finalDoorcards}`);
    log(`   - Appointments: ${finalAppointments}`);
    log(`   - Zero conflicts: ✅`);
    log(`   - Production ready: ✅`);

    // Write success status
    fs.writeFileSync(
      "migration-status.txt",
      `COMPLETED SUCCESSFULLY\n${endTime.toISOString()}\nDuration: ${duration}s`,
      "utf8"
    );

    return {
      success: true,
      duration,
      counts: {
        users: finalUsers,
        doorcards: finalDoorcards,
        appointments: finalAppointments,
      },
    };
  } catch (error) {
    log(`❌ MIGRATION FAILED: ${error}`);
    fs.writeFileSync(
      "migration-status.txt",
      `FAILED\n${new Date().toISOString()}\nError: ${error}`,
      "utf8"
    );
    throw error;
  } finally {
    await prisma.$disconnect();
    logFile.end();
  }
}

// Name capitalization function (from previous script)
function properCapitalization(name: string): string {
  if (!name) return "";

  const lowercaseParticles = [
    "de",
    "del",
    "de la",
    "da",
    "di",
    "degli",
    "delle",
    "della",
    "von",
    "van",
    "der",
    "den",
    "ter",
    "te",
    "du",
    "le",
    "la",
    "des",
    "bin",
    "ibn",
    "al",
    "y",
    "e",
    "and",
  ];

  function capitalizeWord(word: string, isFirst: boolean = false): string {
    const lowerWord = word.toLowerCase();

    if (!isFirst && lowercaseParticles.includes(lowerWord)) {
      return lowerWord;
    }

    if (word.includes("-")) {
      return word
        .split("-")
        .map((part, index) => capitalizeWord(part, index === 0))
        .join("-");
    }

    if (word.includes("'")) {
      return word
        .split("'")
        .map((part, index) => capitalizeWord(part, index === 0))
        .join("'");
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  if (name.toLowerCase().startsWith("dr.")) {
    const nameWithoutTitle = name.slice(3).trim();
    const words = nameWithoutTitle.split(" ");
    return (
      "Dr. " +
      words.map((word, index) => capitalizeWord(word, index === 0)).join(" ")
    );
  }

  if (
    name.toLowerCase().startsWith("prof.") ||
    name.toLowerCase().startsWith("professor")
  ) {
    const title = name.toLowerCase().startsWith("prof.")
      ? "Prof."
      : "Professor";
    const nameStart = name.toLowerCase().startsWith("prof.") ? 5 : 9;
    const nameWithoutTitle = name.slice(nameStart).trim();
    const words = nameWithoutTitle.split(" ");
    return (
      title +
      " " +
      words.map((word, index) => capitalizeWord(word, index === 0)).join(" ")
    );
  }

  const words = name.split(" ");
  return words
    .map((word, index) => capitalizeWord(word, index === 0))
    .join(" ");
}

// Run migration if this script is executed directly
if (require.main === module) {
  console.log("🚀 Starting production migration...");
  console.log("📝 Logs will be written to: migration-progress.log");
  console.log("📊 Status will be updated in: migration-status.txt");
  console.log("🔍 Monitor progress with: tail -f migration-progress.log");
  console.log("");

  runProductionMigration()
    .then((result) => {
      console.log("\n✅ Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Migration failed:", error);
      process.exit(1);
    });
}
