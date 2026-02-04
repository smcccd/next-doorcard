#!/usr/bin/env npx ts-node

import {
  PrismaClient,
  College,
  TermSeason,
  DayOfWeek,
  AppointmentCategory,
  UserRole,
  DisplayNameFormat,
} from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

interface ImportReport {
  phase: string;
  timestamp: string;
  stats: {
    usersCreated: number;
    doorcardsCreated: number;
    appointmentsCreated: number;
    usersSkipped: number;
    doorcardsSkipped: number;
    appointmentsSkipped: number;
  };
  errors: Array<{
    type: "USER" | "DOORCARD" | "APPOINTMENT";
    record: any;
    error: string;
    row?: number;
  }>;
  orphanedRecords: {
    appointmentsWithoutDoorcards: number;
    appointmentsWithoutUsers: number;
    doorcardsWithoutUsers: number;
  };
  dataQuality: {
    invalidDates: number;
    emptyUsernames: number;
    undefinedCategories: number;
    malformedRecords: number;
  };
}

// College mapping based on legacy data
const COLLEGE_MAPPING: Record<string, College> = {
  CSM: "CSM",
  "College of San Mateo": "CSM",
  Skyline: "SKYLINE",
  "Skyline College": "SKYLINE",
  Canada: "CANADA",
  Cañada: "CANADA",
  "Cañada College": "CANADA",
  District: "DISTRICT_OFFICE",
  "District Office": "DISTRICT_OFFICE",
};

// Category mapping from legacy system
const CATEGORY_MAPPING: Record<number, AppointmentCategory> = {
  1: "OFFICE_HOURS",
  2: "IN_CLASS",
  3: "LECTURE",
  4: "LAB",
  5: "HOURS_BY_ARRANGEMENT",
  6: "REFERENCE",
  7: "OTHER",
};

// Day mapping from legacy format
const DAY_MAPPING: Record<string, DayOfWeek> = {
  Monday: "MONDAY",
  Tuesday: "TUESDAY",
  Wednesday: "WEDNESDAY",
  Thursday: "THURSDAY",
  Friday: "FRIDAY",
  Saturday: "SATURDAY",
  Sunday: "SUNDAY",
};

const report: ImportReport = {
  phase: "LEGACY_IMPORT",
  timestamp: new Date().toISOString(),
  stats: {
    usersCreated: 0,
    doorcardsCreated: 0,
    appointmentsCreated: 0,
    usersSkipped: 0,
    doorcardsSkipped: 0,
    appointmentsSkipped: 0,
  },
  errors: [],
  orphanedRecords: {
    appointmentsWithoutDoorcards: 0,
    appointmentsWithoutUsers: 0,
    doorcardsWithoutUsers: 0,
  },
  dataQuality: {
    invalidDates: 0,
    emptyUsernames: 0,
    undefinedCategories: 0,
    malformedRecords: 0,
  },
};

function parseCSV(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      resolve([]);
      return;
    }

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: any) => results.push(data))
      .on("end", () => resolve(results))
      .on("error", reject);
  });
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.includes("01/00/00") || dateStr === "0") {
    report.dataQuality.invalidDates++;
    return null;
  }

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      report.dataQuality.invalidDates++;
      return null;
    }
    return date;
  } catch {
    report.dataQuality.invalidDates++;
    return null;
  }
}

function parseTermFromDate(
  doorStartDate: string,
  doorEndDate: string
): { term: TermSeason; year: number } {
  const startDate = parseDate(doorStartDate);
  const endDate = parseDate(doorEndDate);

  if (!startDate && !endDate) {
    // Default to current academic year
    const now = new Date();
    const year =
      now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
    return { term: "FALL", year };
  }

  const date = startDate || endDate!;
  const month = date.getMonth() + 1; // 0-indexed to 1-indexed
  const year = date.getFullYear();

  if (month >= 8 && month <= 12) return { term: "FALL", year };
  if (month >= 1 && month <= 5) return { term: "SPRING", year };
  return { term: "SUMMER", year };
}

async function importUsers() {
  console.log("📥 Importing users from legacy data...");

  // First try the newer user file
  let users = await parseCSV("./db-items/TBL_USER (2).csv");
  if (users.length === 0) {
    // Fallback to any other user file
    users = await parseCSV("./rejects/TBL_USER.csv");
  }

  console.log(`Found ${users.length} user records`);

  // Also extract users from doorcard and appointment data (User-First Strategy)
  const doorcards = await parseCSV("./rejects/TBL_DOORCARD.csv");
  const appointments = await parseCSV("./rejects/TBL_APPOINTMENT.csv");

  const uniqueUsernames = new Set<string>();

  // Collect usernames from all sources
  users.forEach(
    (u) => u.username && uniqueUsernames.add(u.username.toLowerCase().trim())
  );
  doorcards.forEach(
    (d) => d.username && uniqueUsernames.add(d.username.toLowerCase().trim())
  );
  appointments.forEach(
    (a) => a.username && uniqueUsernames.add(a.username.toLowerCase().trim())
  );

  console.log(
    `Found ${uniqueUsernames.size} unique usernames across all data sources`
  );

  for (const username of uniqueUsernames) {
    if (!username || username.length === 0) {
      report.dataQuality.emptyUsernames++;
      continue;
    }

    try {
      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: `${username}@smccd.edu` },
      });
      if (existing) {
        report.stats.usersSkipped++;
        continue;
      }

      // Generate realistic user data
      const firstName = username.charAt(0).toUpperCase() + username.slice(1, 3);
      const lastName =
        username.slice(3).charAt(0).toUpperCase() + username.slice(4);

      await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: `${username}@smccd.edu`,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          username,
          password: await bcrypt.hash("changeme123", 10),
          role: "FACULTY",
          college:
            Object.values(COLLEGE_MAPPING)[Math.floor(Math.random() * 3)], // Random college
          displayFormat: "FULL_NAME",
          updatedAt: new Date(),
        },
      });

      report.stats.usersCreated++;
    } catch (error) {
      report.errors.push({
        type: "USER",
        record: { username },
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    `✅ Created ${report.stats.usersCreated} users, skipped ${report.stats.usersSkipped}`
  );
}

async function importDoorcards() {
  console.log("📥 Importing doorcards from legacy data...");

  const doorcards = await parseCSV("./rejects/TBL_DOORCARD.csv");
  console.log(`Found ${doorcards.length} doorcard records`);

  for (let i = 0; i < doorcards.length; i++) {
    const record = doorcards[i];

    try {
      if (!record.username) {
        report.dataQuality.emptyUsernames++;
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { email: `${record.username.toLowerCase().trim()}@smccd.edu` },
      });

      if (!user) {
        report.orphanedRecords.doorcardsWithoutUsers++;
        continue;
      }

      // Parse legacy term data
      const { term, year } = parseTermFromDate(
        record.doorstartdate,
        record.doorenddate
      );

      // Map college
      const college = COLLEGE_MAPPING[record.college] || "DISTRICT_OFFICE";

      // Check for duplicates
      const existing = await prisma.doorcard.findFirst({
        where: {
          userId: user.id,
          college,
          term,
          year,
        },
      });

      if (existing) {
        report.stats.doorcardsSkipped++;
        continue;
      }

      await prisma.doorcard.create({
        data: {
          id: crypto.randomUUID(),
          name: user.name || `${user.firstName} ${user.lastName}`,
          doorcardName: record.doorcardname || user.name || "Faculty Member",
          officeNumber: `${college.slice(0, 2)}${Math.floor(Math.random() * 999) + 100}`,
          term,
          year,
          college,
          isActive: Math.random() > 0.3, // 70% active
          isPublic: Math.random() > 0.2, // 80% public
          userId: user.id,
          updatedAt: new Date(),
        },
      });

      report.stats.doorcardsCreated++;
    } catch (error) {
      report.errors.push({
        type: "DOORCARD",
        record,
        error: error instanceof Error ? error.message : String(error),
        row: i + 1,
      });
    }
  }

  console.log(
    `✅ Created ${report.stats.doorcardsCreated} doorcards, skipped ${report.stats.doorcardsSkipped}`
  );
}

async function importAppointments() {
  console.log("📥 Importing appointments from legacy data...");

  const appointments = await parseCSV("./rejects/TBL_APPOINTMENT.csv");
  console.log(`Found ${appointments.length} appointment records`);

  // Process in batches to avoid memory issues
  const BATCH_SIZE = 1000;

  for (
    let batch = 0;
    batch < Math.ceil(appointments.length / BATCH_SIZE);
    batch++
  ) {
    const startIdx = batch * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, appointments.length);
    const batchRecords = appointments.slice(startIdx, endIdx);

    console.log(
      `Processing batch ${batch + 1}/${Math.ceil(appointments.length / BATCH_SIZE)} (${startIdx + 1}-${endIdx})`
    );

    for (let i = 0; i < batchRecords.length; i++) {
      const record = batchRecords[i];

      try {
        // Find the doorcard
        const doorcard = await prisma.doorcard.findFirst({
          where: {
            // Use a combination of user lookup and doorcard properties
            OR: [
              { id: record.doorcardID?.toString() },
              {
                User: {
                  email: record.username
                    ? `${record.username.toLowerCase().trim()}@smccd.edu`
                    : undefined,
                },
              },
            ],
          },
        });

        if (!doorcard) {
          report.orphanedRecords.appointmentsWithoutDoorcards++;
          continue;
        }

        // Parse category
        const catID = parseInt(record.catID) || 1;
        const category = CATEGORY_MAPPING[catID] || "OTHER";
        if (!CATEGORY_MAPPING[catID]) {
          report.dataQuality.undefinedCategories++;
        }

        // Parse day
        const dayOfWeek = DAY_MAPPING[record.appointday] || "MONDAY";

        // Parse times (legacy uses dummy date 12/30/99)
        let startTime = "09:00";
        let endTime = "10:00";

        if (record.appointstarttime) {
          const startMatch = record.appointstarttime.match(/(\d{1,2}):(\d{2})/);
          if (startMatch) {
            startTime = `${startMatch[1].padStart(2, "0")}:${startMatch[2]}`;
          }
        }

        if (record.appointendtime) {
          const endMatch = record.appointendtime.match(/(\d{1,2}):(\d{2})/);
          if (endMatch) {
            endTime = `${endMatch[1].padStart(2, "0")}:${endMatch[2]}`;
          }
        }

        await prisma.appointment.create({
          data: {
            id: crypto.randomUUID(),
            name: record.appointname || "Office Hours",
            startTime,
            endTime,
            dayOfWeek,
            category,
            doorcardId: doorcard.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        report.stats.appointmentsCreated++;
      } catch (error) {
        report.errors.push({
          type: "APPOINTMENT",
          record,
          error: error instanceof Error ? error.message : String(error),
          row: startIdx + i + 1,
        });
      }
    }
  }

  console.log(`✅ Created ${report.stats.appointmentsCreated} appointments`);
}

async function generateReport() {
  const reportPath = `import-debug-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

  // Add summary statistics
  const summary = {
    ...report,
    summary: {
      totalRecordsProcessed:
        report.stats.usersCreated +
        report.stats.doorcardsCreated +
        report.stats.appointmentsCreated,
      totalRecordsSkipped:
        report.stats.usersSkipped +
        report.stats.doorcardsSkipped +
        report.stats.appointmentsSkipped,
      totalErrors: report.errors.length,
      dataIntegrityRate:
        (report.stats.appointmentsCreated /
          (report.stats.appointmentsCreated +
            report.orphanedRecords.appointmentsWithoutDoorcards)) *
        100,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  console.log(`\n📊 IMPORT SUMMARY`);
  console.log(`================`);
  console.log(`Users Created: ${report.stats.usersCreated}`);
  console.log(`Doorcards Created: ${report.stats.doorcardsCreated}`);
  console.log(`Appointments Created: ${report.stats.appointmentsCreated}`);
  console.log(`Total Errors: ${report.errors.length}`);
  console.log(
    `Orphaned Appointments: ${report.orphanedRecords.appointmentsWithoutDoorcards}`
  );
  console.log(
    `Data Integrity Rate: ${summary.summary.dataIntegrityRate.toFixed(1)}%`
  );
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return reportPath;
}

async function main() {
  console.log("🚀 Starting Comprehensive Development Setup");
  console.log("==========================================");

  try {
    await importUsers();
    await importDoorcards();
    await importAppointments();

    const reportPath = await generateReport();

    console.log("\n✅ Legacy import completed successfully!");
    console.log(`📊 Report available at: ${reportPath}`);
  } catch (error) {
    console.error("❌ Import failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
