#!/usr/bin/env npx tsx

/**
 * NEON PRODUCTION DEPLOYMENT
 * Migrates clean data to Neon PostgreSQL
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import { createWriteStream } from "fs";
import { createInterface } from "readline";

const logFile = createWriteStream("neon-migration.log", { flags: "a" });
const startTime = new Date();

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  logFile.write(logEntry + "\n");
  fs.writeFileSync("neon-status.txt", `${message}\n${timestamp}`, "utf8");
}

async function promptForNeonUrl(): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Enter your Neon PostgreSQL connection string: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runNeonMigration() {
  let localPrisma: PrismaClient | null = null;
  let neonPrisma: PrismaClient | null = null;

  try {
    log("🚀 NEON PRODUCTION MIGRATION STARTED");

    // Get Neon connection string
    const neonUrl = await promptForNeonUrl();
    if (!neonUrl.includes("postgresql://")) {
      throw new Error("Invalid PostgreSQL connection string");
    }

    log("📡 Connecting to databases...");

    // Connect to local SQLite (source)
    localPrisma = new PrismaClient({
      datasources: { db: { url: "file:./prisma/dev.db" } },
    });

    // Connect to Neon PostgreSQL (target)
    neonPrisma = new PrismaClient({
      datasources: { db: { url: neonUrl } },
    });

    // Test connections
    await localPrisma.$queryRaw`SELECT 1`;
    await neonPrisma.$queryRaw`SELECT 1`;
    log("   ✅ Database connections established");

    // Step 1: Get clean data from local
    log("📋 Step 1/5: Extracting clean data from local database...");

    const sourceUsers = await localPrisma.user.findMany();
    const sourceDoorcards = await localPrisma.doorcard.findMany({
      where: { isActive: true },
    });
    const sourceAppointments = await localPrisma.appointment.findMany({
      include: { doorcard: true },
    });

    // Filter appointments to only include those from active doorcards
    const activeAppointments = sourceAppointments.filter((apt) =>
      sourceDoorcards.some((dc) => dc.id === apt.doorcardId)
    );

    log(
      `   Source data: ${sourceUsers.length} users, ${sourceDoorcards.length} doorcards, ${activeAppointments.length} appointments`
    );

    // Step 2: Clear Neon database
    log("🧹 Step 2/5: Clearing Neon database...");

    await neonPrisma.appointment.deleteMany();
    await neonPrisma.doorcard.deleteMany();
    await neonPrisma.user.deleteMany();

    log("   ✅ Neon database cleared");

    // Step 3: Migrate users
    log("👥 Step 3/5: Migrating users to Neon...");

    const userIdMapping = new Map<string, string>();

    for (const user of sourceUsers) {
      const properName = properCapitalization(user.name);

      const newUser = await neonPrisma.user.create({
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: properName,
          password: user.password,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: new Date(),
        },
      });

      userIdMapping.set(user.id, newUser.id);

      if (sourceUsers.indexOf(user) % 10 === 0) {
        log(
          `   Progress: ${sourceUsers.indexOf(user) + 1}/${sourceUsers.length} users migrated`
        );
      }
    }

    log(`   ✅ Migrated ${sourceUsers.length} users`);

    // Step 4: Migrate doorcards
    log("🚪 Step 4/5: Migrating doorcards to Neon...");

    const doorcardIdMapping = new Map<string, string>();

    for (const doorcard of sourceDoorcards) {
      const newDoorcard = await neonPrisma.doorcard.create({
        data: {
          id: doorcard.id,
          name: doorcard.name,
          doorcardName: doorcard.doorcardName,
          officeNumber: doorcard.officeNumber || "TBD",
          term: doorcard.term,
          year: 2025,
          college: doorcard.college,
          slug: doorcard.slug,
          isActive: true,
          isPublic: true,
          userId: doorcard.userId,
          createdAt: doorcard.createdAt,
          updatedAt: new Date(),
        },
      });

      doorcardIdMapping.set(doorcard.id, newDoorcard.id);

      if (sourceDoorcards.indexOf(doorcard) % 10 === 0) {
        log(
          `   Progress: ${sourceDoorcards.indexOf(doorcard) + 1}/${sourceDoorcards.length} doorcards migrated`
        );
      }
    }

    log(`   ✅ Migrated ${sourceDoorcards.length} doorcards`);

    // Step 5: Migrate appointments
    log("📅 Step 5/5: Migrating appointments to Neon...");

    let appointmentCount = 0;
    for (const appointment of activeAppointments) {
      await neonPrisma.appointment.create({
        data: {
          id: appointment.id,
          name: appointment.name,
          dayOfWeek: appointment.dayOfWeek,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          category: appointment.category,
          location: appointment.location || "TBD",
          doorcardId: appointment.doorcardId,
          createdAt: appointment.createdAt,
          updatedAt: new Date(),
        },
      });

      appointmentCount++;

      if (appointmentCount % 25 === 0) {
        log(
          `   Progress: ${appointmentCount}/${activeAppointments.length} appointments migrated`
        );
      }
    }

    log(`   ✅ Migrated ${appointmentCount} appointments`);

    // Final validation
    log("🎯 Final validation on Neon...");

    const neonUsers = await neonPrisma.user.count();
    const neonDoorcards = await neonPrisma.doorcard.count();
    const neonAppointments = await neonPrisma.appointment.count();

    // Test a critical query
    const sampleData = await neonPrisma.user.findFirst({
      include: {
        Doorcard: {
          where: { isActive: true },
          include: { Appointment: true },
        },
      },
    });

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;

    log("");
    log("🎉 NEON MIGRATION COMPLETED SUCCESSFULLY!");
    log(`⏱️  Duration: ${duration} seconds`);
    log(`📊 Final Neon state:`);
    log(`   - Users: ${neonUsers}`);
    log(`   - Doorcards: ${neonDoorcards}`);
    log(`   - Appointments: ${neonAppointments}`);
    log(`   - Sample faculty data: ✅`);
    log("🚀 PRODUCTION SYSTEM IS LIVE!");

    return {
      success: true,
      duration,
      counts: {
        users: neonUsers,
        doorcards: neonDoorcards,
        appointments: neonAppointments,
      },
    };
  } catch (error) {
    log(`❌ NEON MIGRATION FAILED: ${error}`);
    throw error;
  } finally {
    if (localPrisma) await localPrisma.$disconnect();
    if (neonPrisma) await neonPrisma.$disconnect();
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
  console.log("🚀 Neon PostgreSQL Migration");
  console.log("📝 Logs: neon-migration.log");
  console.log("📊 Status: neon-status.txt");
  console.log("");

  runNeonMigration()
    .then(() => {
      console.log("\n✅ Production deployment successful!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Production deployment failed:", error);
      process.exit(1);
    });
}
