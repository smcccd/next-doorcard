#!/usr/bin/env npx tsx

/**
 * PRODUCTION MIGRATION SCRIPT - FINAL VERSION
 *
 * This script creates a comprehensive migration for production PostgreSQL
 * Based on the working data structure shown in the live application
 */

import { PrismaClient } from "@prisma/client";
import { parse } from "fast-csv";
import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcryptjs";
import { Command } from "commander";

const prisma = new PrismaClient();

interface MigrationReport {
  usersCreated: number;
  doorcardsCreated: number;
  appointmentsCreated: number;
  duplicatesRemoved: number;
  errors: string[];
  validationResults: {
    sourceData: { users: number; doorcards: number; appointments: number };
    finalData: { users: number; doorcards: number; appointments: number };
  };
}

// Name capitalization function
function properCapitalization(name: string): string {
  if (!name) return "";

  // Particles that should remain lowercase (unless at start of name)
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

    // Keep particles lowercase unless they're the first word
    if (!isFirst && lowercaseParticles.includes(lowerWord)) {
      return lowerWord;
    }

    // Handle hyphenated names
    if (word.includes("-")) {
      return word
        .split("-")
        .map((part, index) => capitalizeWord(part, index === 0))
        .join("-");
    }

    // Handle apostrophes (O'Connor, etc.)
    if (word.includes("'")) {
      return word
        .split("'")
        .map((part, index) => capitalizeWord(part, index === 0))
        .join("'");
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  // Handle titles
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

  // Standard title case with particle handling
  const words = name.split(" ");
  return words
    .map((word, index) => capitalizeWord(word, index === 0))
    .join(" ");
}

// Duplicate detection function
function isDuplicate(appointment: any, existingAppointments: any[]): boolean {
  return existingAppointments.some(
    (existing) =>
      existing.doorcardId === appointment.doorcardId &&
      existing.dayOfWeek === appointment.dayOfWeek &&
      existing.startTime === appointment.startTime &&
      existing.endTime === appointment.endTime &&
      existing.name === appointment.name
  );
}

async function runProductionMigration(
  dryRun: boolean = true
): Promise<MigrationReport> {
  console.log(
    `🚀 ${dryRun ? "DRY RUN" : "PRODUCTION"} Migration Starting...\n`
  );

  const report: MigrationReport = {
    usersCreated: 0,
    doorcardsCreated: 0,
    appointmentsCreated: 0,
    duplicatesRemoved: 0,
    errors: [],
    validationResults: {
      sourceData: { users: 0, doorcards: 0, appointments: 0 },
      finalData: { users: 0, doorcards: 0, appointments: 0 },
    },
  };

  try {
    // Clear existing data if not dry run
    if (!dryRun) {
      console.log("🧹 Clearing existing data...");
      await prisma.appointment.deleteMany();
      await prisma.doorcard.deleteMany();
      await prisma.user.deleteMany();
    }

    // Count source data
    const appointmentCsvPath = path.join(
      process.cwd(),
      "db-items/TBL_APPOINTMENT (1).csv"
    );
    const doorcardCsvPath = path.join(
      process.cwd(),
      "db-items/TBL_DOORCARD (1).csv"
    );

    // Read and count CSV data
    const appointmentRows: any[] = [];
    const doorcardRows: any[] = [];

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(appointmentCsvPath)
        .pipe(parse({ headers: true }))
        .on("data", (row) => appointmentRows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(doorcardCsvPath)
        .pipe(parse({ headers: true }))
        .on("data", (row) => doorcardRows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    // Count unique users from appointments and doorcards
    const uniqueUsernames = new Set([
      ...appointmentRows.map((row) => row.username).filter(Boolean),
      ...doorcardRows.map((row) => row.username).filter(Boolean),
    ]);

    report.validationResults.sourceData = {
      users: uniqueUsernames.size,
      doorcards: doorcardRows.length,
      appointments: appointmentRows.length,
    };

    console.log(`📊 Source Data Counts:`);
    console.log(`   Users: ${report.validationResults.sourceData.users}`);
    console.log(
      `   Doorcards: ${report.validationResults.sourceData.doorcards}`
    );
    console.log(
      `   Appointments: ${report.validationResults.sourceData.appointments}\n`
    );

    // Create users
    console.log("👥 Creating users...");
    for (const username of uniqueUsernames) {
      if (!username || username.trim() === "") continue;

      const properName = properCapitalization(`Dr. ${username}`);

      if (!dryRun) {
        await prisma.user.create({
          data: {
            username: username.trim(),
            email: `${username.trim()}@smccd.edu`,
            name: properName,
            password: await bcrypt.hash("changeme123", 10),
            role: "FACULTY",
          },
        });
      }

      report.usersCreated++;
    }

    console.log(`✅ Created ${report.usersCreated} users`);

    // Process doorcards and appointments together to handle the data correctly
    console.log("🚪 Processing doorcards and appointments...");

    const processedAppointments: any[] = [];

    for (const doorcardRow of doorcardRows) {
      const username = doorcardRow.username?.trim();
      if (!username) continue;

      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
      });

      if (!user) {
        report.errors.push(`User not found for doorcard: ${username}`);
        continue;
      }

      // Create doorcard
      let doorcard;
      if (!dryRun) {
        doorcard = await prisma.doorcard.create({
          data: {
            name: `${user.name} - ${doorcardRow.college || "Faculty"}`,
            doorcardName: doorcardRow.doorcardname || user.name,
            officeNumber: `Building 11, Room 345`, // Default from screenshot
            term: "FALL",
            year: 2025,
            college:
              doorcardRow.college?.toUpperCase() === "SKYLINE"
                ? "SKYLINE"
                : doorcardRow.college?.toUpperCase() === "CSM"
                  ? "CSM"
                  : "CANADA",
            slug: `${username}-fall-2025`,
            isActive: true,
            isPublic: true,
            userId: user.id,
          },
        });
      }

      report.doorcardsCreated++;

      // Process appointments for this doorcard
      const doorcardAppointments = appointmentRows.filter(
        (apt) => apt.doorcardID === doorcardRow.doorcardID
      );

      for (const aptRow of doorcardAppointments) {
        // Skip duplicates
        if (isDuplicate(aptRow, processedAppointments)) {
          report.duplicatesRemoved++;
          continue;
        }

        // Parse time
        const timeMatch = aptRow.appointstarttime?.match(
          /(\d{1,2}):(\d{2}):(\d{2})/
        );
        const endTimeMatch = aptRow.appointendtime?.match(
          /(\d{1,2}):(\d{2}):(\d{2})/
        );

        if (!timeMatch || !endTimeMatch) continue;

        const startTime = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
        const endTime = `${endTimeMatch[1].padStart(2, "0")}:${endTimeMatch[2]}`;

        const appointmentData = {
          doorcardId: doorcard?.id || "temp",
          name: aptRow.appointname || "Office Hours",
          dayOfWeek: aptRow.appointday?.toUpperCase() || "MONDAY",
          startTime,
          endTime,
          category: aptRow.catID === "1" ? "OFFICE_HOURS" : "IN_CLASS",
          location: `Building 11, Room 345`, // Based on screenshot
        };

        if (!dryRun && doorcard) {
          await prisma.appointment.create({
            data: appointmentData,
          });
        }

        processedAppointments.push(appointmentData);
        report.appointmentsCreated++;
      }
    }

    console.log(`✅ Created ${report.doorcardsCreated} doorcards`);
    console.log(`✅ Created ${report.appointmentsCreated} appointments`);
    console.log(`🗑️ Removed ${report.duplicatesRemoved} duplicates`);

    // Final validation
    if (!dryRun) {
      const finalUsers = await prisma.user.count();
      const finalDoorcards = await prisma.doorcard.count();
      const finalAppointments = await prisma.appointment.count();

      report.validationResults.finalData = {
        users: finalUsers,
        doorcards: finalDoorcards,
        appointments: finalAppointments,
      };

      console.log(`\n📊 Final Database Counts:`);
      console.log(`   Users: ${finalUsers}`);
      console.log(`   Doorcards: ${finalDoorcards}`);
      console.log(`   Appointments: ${finalAppointments}`);
    }
  } catch (error) {
    report.errors.push(`Migration error: ${error}`);
    console.error("❌ Migration failed:", error);
  }

  return report;
}

// CLI setup
const program = new Command();

program
  .name("production-migration-final")
  .description("Production-ready migration script for PostgreSQL")
  .option("--dry-run", "Run migration without making changes", true)
  .option("--execute", "Execute actual migration", false);

program.parse();
const options = program.opts();

if (require.main === module) {
  runProductionMigration(!options.execute)
    .then((report) => {
      console.log("\n📋 Migration Report:");
      console.log(JSON.stringify(report, null, 2));

      if (report.errors.length > 0) {
        console.log("\n❌ Errors encountered:");
        report.errors.forEach((error) => console.log(`   ${error}`));
        process.exit(1);
      }

      console.log("\n✅ Migration completed successfully!");
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
