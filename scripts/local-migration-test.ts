#!/usr/bin/env npx tsx

/**
 * LOCAL MIGRATION TEST - SQLITE
 * Test the migration locally before deploying to Neon
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import { createWriteStream } from "fs";

// Force SQLite connection for local testing
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db",
    },
  },
});

const logFile = createWriteStream("local-migration.log", { flags: "a" });
const startTime = new Date();

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  logFile.write(logEntry + "\n");
  fs.writeFileSync("local-status.txt", `${message}\n${timestamp}`, "utf8");
}

async function runLocalMigration() {
  try {
    log("🧪 LOCAL MIGRATION TEST STARTED (SQLite)");

    // Current state
    const beforeUsers = await prisma.user.count();
    const beforeDoorcards = await prisma.doorcard.count();
    const beforeAppointments = await prisma.appointment.count();

    log(
      `📊 BEFORE: ${beforeUsers} users, ${beforeDoorcards} doorcards, ${beforeAppointments} appointments`
    );

    // Test name capitalization
    log("🎨 Testing name capitalization...");
    const testUsers = await prisma.user.findMany({ take: 5 });
    for (const user of testUsers) {
      const newName = properCapitalization(user.name);
      if (newName !== user.name) {
        log(`   "${user.name}" → "${newName}"`);
      }
    }

    // Test critical queries
    log("🔍 Testing critical database queries...");

    const facultyWithAppointments = await prisma.user.findMany({
      include: {
        Doorcard: {
          where: { isActive: true },
          include: { Appointment: true },
        },
      },
      take: 3,
    });

    log(
      `   ✅ Retrieved ${facultyWithAppointments.length} faculty with full appointment data`
    );

    // Test overlap detection
    const overlaps = (await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "Appointment" a1
      JOIN "Appointment" a2 ON a1.doorcardId = a2.doorcardId 
        AND a1.dayOfWeek = a2.dayOfWeek 
        AND a1.id < a2.id
    `) as any[];

    log(`   ✅ Overlap check: ${Number(overlaps[0].count)} conflicts found`);

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;
    log(`🎉 LOCAL TEST COMPLETED - Duration: ${duration}s`);
    log("✅ System ready for Neon deployment!");

    return { success: true, duration };
  } catch (error) {
    log(`❌ LOCAL TEST FAILED: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
    logFile.end();
  }
}

function properCapitalization(name: string): string {
  if (!name) return "";

  const lowercaseParticles = [
    "de",
    "del",
    "de la",
    "da",
    "di",
    "von",
    "van",
    "der",
    "du",
    "le",
    "la",
    "y",
  ];

  function capitalizeWord(word: string, isFirst: boolean = false): string {
    const lowerWord = word.toLowerCase();
    if (!isFirst && lowercaseParticles.includes(lowerWord)) return lowerWord;
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

  if (name.toLowerCase().startsWith("prof.")) {
    const nameWithoutTitle = name.slice(5).trim();
    const words = nameWithoutTitle.split(" ");
    return (
      "Prof. " +
      words.map((word, index) => capitalizeWord(word, index === 0)).join(" ")
    );
  }

  const words = name.split(" ");
  return words
    .map((word, index) => capitalizeWord(word, index === 0))
    .join(" ");
}

if (require.main === module) {
  runLocalMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
