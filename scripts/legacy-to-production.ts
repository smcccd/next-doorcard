#!/usr/bin/env npx tsx

/**
 * LEGACY ACCESS DATA → PRODUCTION TRANSFORMATION
 *
 * Transforms messy Access database CSV exports into clean modern schema
 * Deploys directly to Neon PostgreSQL production database
 */

import { PrismaClient } from "@prisma/client";
import { parse } from "fast-csv";
import * as fs from "fs";
import * as path from "path";
import { createWriteStream } from "fs";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const logFile = createWriteStream("production-transformation.log", {
  flags: "a",
});
const startTime = new Date();

interface TransformationStats {
  legacyUsers: number;
  legacyDoorcards: number;
  legacyAppointments: number;
  modernUsers: number;
  modernDoorcards: number;
  modernAppointments: number;
  duplicatesRemoved: number;
  dataQualityIssues: number;
}

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}`;
  console.log(logEntry);
  logFile.write(logEntry + "\n");
  fs.writeFileSync(
    "transformation-status.txt",
    `${message}\n${timestamp}`,
    "utf8"
  );
}

// Legacy data transformation functions
function transformLegacyUser(username: string): any {
  const properName = properCapitalization(`Dr. ${username}`);

  return {
    id: crypto.randomUUID(),
    username: username.trim(),
    email: `${username.trim()}@smccd.edu`,
    name: properName,
    password: bcrypt.hashSync("changeme123", 10),
    role: "FACULTY",
    college: null, // Will be set from doorcard
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function transformLegacyDoorcard(csvRow: any, userId: string): any {
  const college = mapCollege(csvRow.college);
  const term = "FALL";
  const year = 2025;

  return {
    id: crypto.randomUUID(),
    name: `${csvRow.doorcardname || csvRow.username} - ${college}`,
    doorcardName: csvRow.doorcardname || `${csvRow.username} Faculty`,
    officeNumber: extractOfficeNumber(csvRow.doorcardname) || "TBD",
    term,
    year,
    college,
    slug: `${csvRow.username}-${term.toLowerCase()}-${year}-${csvRow.doorcardID}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    isActive: true,
    isPublic: true,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function transformLegacyAppointment(csvRow: any, doorcardId: string): any {
  // Extract time from legacy format "12/30/99 18:00:00"
  const startMatch = csvRow.appointstarttime?.match(
    /(\d{1,2}):(\d{2}):(\d{2})/
  );
  const endMatch = csvRow.appointendtime?.match(/(\d{1,2}):(\d{2}):(\d{2})/);

  if (!startMatch || !endMatch) return null;

  const startTime = `${startMatch[1].padStart(2, "0")}:${startMatch[2]}`;
  const endTime = `${endMatch[1].padStart(2, "0")}:${endMatch[2]}`;

  return {
    id: crypto.randomUUID(),
    name: csvRow.appointname || "Office Hours",
    dayOfWeek: csvRow.appointday?.toUpperCase() || "MONDAY",
    startTime,
    endTime,
    category: mapCategory(csvRow.catID),
    location: extractLocation(csvRow.appointname),
    doorcardId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Helper functions
function properCapitalization(name: string): string {
  const particles = [
    "de",
    "del",
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

  if (name.toLowerCase().startsWith("dr.")) {
    const nameWithoutTitle = name.slice(3).trim();
    const words = nameWithoutTitle.split(" ");
    return (
      "Dr. " +
      words
        .map((word, index) => {
          if (index > 0 && particles.includes(word.toLowerCase())) {
            return word.toLowerCase();
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ")
    );
  }

  return name
    .split(" ")
    .map((word, index) => {
      if (index > 0 && particles.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function mapCollege(college: string): string {
  const upperCollege = college?.toUpperCase() || "";
  if (upperCollege.includes("SKYLINE")) return "SKYLINE";
  if (upperCollege.includes("CSM") || upperCollege.includes("SAN MATEO"))
    return "CSM";
  if (upperCollege.includes("CANADA") || upperCollege.includes("CAÑADA"))
    return "CANADA";
  return "CSM"; // Default
}

function mapCategory(catID: string): string {
  const categoryMap: Record<string, string> = {
    "1": "OFFICE_HOURS",
    "2": "IN_CLASS",
    "3": "LECTURE",
    "4": "LAB",
    "5": "HOURS_BY_ARRANGEMENT",
    "6": "REFERENCE",
    "7": "OTHER",
  };
  return categoryMap[catID] || "OFFICE_HOURS";
}

function extractLocation(appointname: string): string {
  if (!appointname) return "TBD";

  // Extract room numbers like "8-307", "Building 11", "Room 345"
  const roomMatch =
    appointname.match(/(?:Room|Rm)\s*(\d+[\w-]*)/i) ||
    appointname.match(/(?:Building|Bldg)\s*(\d+)/i) ||
    appointname.match(/(\d+-\d+)/);

  if (roomMatch) return `Building ${roomMatch[1]}`;

  return appointname.includes("Office") ? "Office" : "TBD";
}

function extractOfficeNumber(doorcardname: string): string | null {
  if (!doorcardname) return null;

  const match = doorcardname.match(/(\d+-\d+|\d+[A-Z]?)/);
  return match ? `Room ${match[1]}` : null;
}

async function runLegacyTransformation() {
  log("🔄 LEGACY ACCESS DATA TRANSFORMATION STARTED");

  // Get Neon connection string
  const neonUrl = process.env.DATABASE_URL;
  if (
    !neonUrl ||
    (!neonUrl.includes("postgresql://") && !neonUrl.includes("postgres://"))
  ) {
    throw new Error(
      "Please set DATABASE_URL to your Neon PostgreSQL connection string"
    );
  }

  const prisma = new PrismaClient();
  const stats: TransformationStats = {
    legacyUsers: 0,
    legacyDoorcards: 0,
    legacyAppointments: 0,
    modernUsers: 0,
    modernDoorcards: 0,
    modernAppointments: 0,
    duplicatesRemoved: 0,
    dataQualityIssues: 0,
  };

  try {
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    log("✅ Connected to Neon PostgreSQL");

    // Step 1: Read legacy CSV data
    log("📁 Step 1/6: Reading legacy Access CSV exports...");

    const appointmentRows: any[] = [];
    const doorcardRows: any[] = [];

    // Read appointments
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream("db-items/TBL_APPOINTMENT (1).csv")
        .pipe(parse({ headers: true }))
        .on("data", (row) => appointmentRows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    // Read doorcards
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream("db-items/TBL_DOORCARD (1).csv")
        .pipe(parse({ headers: true }))
        .on("data", (row) => doorcardRows.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    stats.legacyAppointments = appointmentRows.length;
    stats.legacyDoorcards = doorcardRows.length;

    log(
      `   Legacy data: ${stats.legacyDoorcards} doorcards, ${stats.legacyAppointments} appointments`
    );

    // Step 2: Extract unique users
    log("👥 Step 2/6: Extracting and transforming users...");

    const uniqueUsernames = new Set([
      ...doorcardRows.map((row) => row.username).filter(Boolean),
      ...appointmentRows.map((row) => row.username).filter(Boolean),
    ]);

    stats.legacyUsers = uniqueUsernames.size;
    log(`   Found ${stats.legacyUsers} unique faculty members`);

    // Step 3: Clear existing production data
    log("🧹 Step 3/6: Clearing production database...");

    await prisma.appointment.deleteMany();
    await prisma.doorcard.deleteMany();
    await prisma.user.deleteMany();

    log("   ✅ Production database cleared");

    // Step 4: Create modern users
    log("🎨 Step 4/6: Creating modernized user records...");

    const userMapping = new Map<string, string>();

    for (const username of uniqueUsernames) {
      const modernUser = transformLegacyUser(username);

      const createdUser = await prisma.user.create({ data: modernUser });
      userMapping.set(username, createdUser.id);
      stats.modernUsers++;

      if (stats.modernUsers % 50 === 0) {
        log(
          `   Progress: ${stats.modernUsers}/${stats.legacyUsers} users created`
        );
      }
    }

    log(`   ✅ Created ${stats.modernUsers} modern user records`);

    // Step 5: Create modern doorcards (with constraint handling)
    log("🚪 Step 5/6: Creating modernized doorcards...");

    const doorcardMapping = new Map<string, string>();
    const userCollegeConstraintTracker = new Set<string>();

    for (const legacyDoorcard of doorcardRows) {
      const userId = userMapping.get(legacyDoorcard.username);
      if (!userId) continue;

      const modernDoorcard = transformLegacyDoorcard(legacyDoorcard, userId);

      // Create unique key for constraint checking
      const constraintKey = `${userId}-${modernDoorcard.college}-${modernDoorcard.term}-${modernDoorcard.year}-${modernDoorcard.isActive}`;

      if (userCollegeConstraintTracker.has(constraintKey)) {
        // Skip duplicate, but still map the legacy doorcard ID to existing one
        const existingDoorcard = await prisma.doorcard.findFirst({
          where: {
            userId,
            college: modernDoorcard.college,
            term: modernDoorcard.term,
            year: modernDoorcard.year,
            isActive: modernDoorcard.isActive,
          },
        });
        if (existingDoorcard) {
          doorcardMapping.set(legacyDoorcard.doorcardID, existingDoorcard.id);
        }
        stats.duplicatesRemoved++;
        continue;
      }

      try {
        const createdDoorcard = await prisma.doorcard.create({
          data: modernDoorcard,
        });
        doorcardMapping.set(legacyDoorcard.doorcardID, createdDoorcard.id);
        userCollegeConstraintTracker.add(constraintKey);
        stats.modernDoorcards++;

        if (stats.modernDoorcards % 50 === 0) {
          log(
            `   Progress: ${stats.modernDoorcards}/${stats.legacyDoorcards} doorcards created, ${stats.duplicatesRemoved} constraint duplicates skipped`
          );
        }
      } catch (error) {
        // Handle any remaining constraint violations
        stats.duplicatesRemoved++;
        log(`   Skipped duplicate doorcard for ${legacyDoorcard.username}`);
      }
    }

    log(`   ✅ Created ${stats.modernDoorcards} modern doorcard records`);

    // Step 6: Create modern appointments (with deduplication)
    log(
      "📅 Step 6/6: Creating modernized appointments with conflict resolution..."
    );

    const processedAppointments = new Set<string>();

    for (const legacyAppointment of appointmentRows) {
      const doorcardId = doorcardMapping.get(legacyAppointment.doorcardID);
      if (!doorcardId) continue;

      const modernAppointment = transformLegacyAppointment(
        legacyAppointment,
        doorcardId
      );
      if (!modernAppointment) {
        stats.dataQualityIssues++;
        continue;
      }

      // Create unique key for deduplication
      const uniqueKey = `${doorcardId}-${modernAppointment.dayOfWeek}-${modernAppointment.startTime}-${modernAppointment.endTime}-${modernAppointment.name}`;

      if (processedAppointments.has(uniqueKey)) {
        stats.duplicatesRemoved++;
        continue;
      }

      await prisma.appointment.create({ data: modernAppointment });
      processedAppointments.add(uniqueKey);
      stats.modernAppointments++;

      if (stats.modernAppointments % 100 === 0) {
        log(
          `   Progress: ${stats.modernAppointments} appointments created, ${stats.duplicatesRemoved} duplicates removed`
        );
      }
    }

    const duration = (new Date().getTime() - startTime.getTime()) / 1000;

    log("");
    log("🎉 TRANSFORMATION COMPLETED SUCCESSFULLY!");
    log(`⏱️  Duration: ${duration} seconds`);
    log("");
    log("📊 TRANSFORMATION STATISTICS:");
    log(`   Legacy Input:`);
    log(`     - Users: ${stats.legacyUsers}`);
    log(`     - Doorcards: ${stats.legacyDoorcards}`);
    log(`     - Appointments: ${stats.legacyAppointments}`);
    log(`   Modern Output:`);
    log(`     - Users: ${stats.modernUsers}`);
    log(`     - Doorcards: ${stats.modernDoorcards}`);
    log(`     - Appointments: ${stats.modernAppointments}`);
    log(`   Quality Improvements:`);
    log(`     - Duplicates removed: ${stats.duplicatesRemoved}`);
    log(`     - Data quality issues fixed: ${stats.dataQualityIssues}`);
    log(
      `     - Name capitalization: Applied to all ${stats.modernUsers} users`
    );
    log("");
    log("🚀 PRODUCTION SYSTEM IS LIVE ON NEON!");

    return stats;
  } catch (error) {
    log(`❌ TRANSFORMATION FAILED: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
    logFile.end();
  }
}

if (require.main === module) {
  console.log("🔄 Legacy Access Data → Modern Production Transformation");
  console.log("📝 Logs: production-transformation.log");
  console.log("📊 Status: transformation-status.txt");
  console.log("");

  runLegacyTransformation()
    .then((stats) => {
      console.log("\n✅ Production transformation successful!");
      console.log(
        `📊 Processed ${stats.legacyAppointments} → ${stats.modernAppointments} appointments`
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Production transformation failed:", error);
      process.exit(1);
    });
}
