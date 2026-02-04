import { PrismaClient } from "@prisma/client";
import {
  DayOfWeek,
  AppointmentCategory,
  College,
  UserRole,
  TermSeason,
} from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
import { parse } from "fast-csv";
import { createWriteStream } from "fs";
import { format } from "fast-csv";
import bcrypt from "bcryptjs";
import { Command } from "commander";

const prisma = new PrismaClient();

// Enhanced logging with timestamps and detailed error info
function log(
  level: "INFO" | "WARN" | "ERROR" | "DEBUG",
  message: string,
  data?: any
) {
  const timestamp = new Date().toISOString();
  const prefix = {
    INFO: "📊",
    WARN: "⚠️ ",
    ERROR: "❌",
    DEBUG: "🔍",
  }[level];

  console.log(`[${timestamp}] ${prefix} ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Type definitions for CSV rows (same as original)
interface UserCSVRow {
  username: string;
  userrole: string;
}

interface DoorcardCSVRow {
  doorcardID: string;
  username: string;
  doorcardname: string;
  doorstartdate: string;
  doorenddate: string;
  doorterm: string;
  college: string;
}

interface AppointmentCSVRow {
  appointID: string;
  catID: string;
  username: string;
  doorcardID: string;
  appointname: string;
  appointstarttime: string;
  appointendtime: string;
  appointday: string;
}

interface CategoryCSVRow {
  catID: string;
  catname: string;
  catcolor: string;
}

// Enhanced error tracking
interface ImportStats {
  users: {
    found: number;
    created: number;
    failed: number;
    duplicates: number;
  };
  doorcards: {
    processed: number;
    imported: number;
    rejected: number;
  };
  appointments: {
    processed: number;
    imported: number;
    rejected: number;
  };
  errors: Array<{
    type: string;
    message: string;
    data?: any;
    timestamp: string;
  }>;
}

const stats: ImportStats = {
  users: { found: 0, created: 0, failed: 0, duplicates: 0 },
  doorcards: { processed: 0, imported: 0, rejected: 0 },
  appointments: { processed: 0, imported: 0, rejected: 0 },
  errors: [],
};

function addError(type: string, message: string, data?: any) {
  const error = {
    type,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  stats.errors.push(error);
  log("ERROR", `${type}: ${message}`, data);
}

// Database connection test
async function testDatabaseConnection() {
  log("DEBUG", "Testing database connection...");
  try {
    await prisma.$queryRaw`SELECT 1`;
    log("INFO", "Database connection successful");
    return true;
  } catch (error) {
    addError("DATABASE", "Failed to connect to database", error);
    return false;
  }
}

// Check existing data
async function checkExistingData() {
  log("DEBUG", "Checking existing data...");
  try {
    const [userCount, doorcardCount, appointmentCount] = await Promise.all([
      prisma.user.count(),
      prisma.doorcard.count(),
      prisma.appointment.count(),
    ]);

    log(
      "INFO",
      `Existing data: ${userCount} users, ${doorcardCount} doorcards, ${appointmentCount} appointments`
    );

    if (userCount > 0) {
      log(
        "WARN",
        "Database contains existing users - this may cause conflicts"
      );
    }

    return { userCount, doorcardCount, appointmentCount };
  } catch (error) {
    addError("DATABASE", "Failed to check existing data", error);
    return null;
  }
}

// Validate single user data
function validateUserData(userData: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!userData.id || typeof userData.id !== "string") {
    errors.push("Invalid or missing ID");
  }

  if (
    !userData.username ||
    typeof userData.username !== "string" ||
    userData.username.trim() === ""
  ) {
    errors.push("Invalid or missing username");
  }

  if (
    !userData.email ||
    typeof userData.email !== "string" ||
    !userData.email.includes("@")
  ) {
    errors.push("Invalid or missing email");
  }

  if (!userData.password || typeof userData.password !== "string") {
    errors.push("Invalid or missing password");
  }

  if (!Object.values(UserRole).includes(userData.role)) {
    errors.push(`Invalid role: ${userData.role}`);
  }

  if (!userData.name || typeof userData.name !== "string") {
    errors.push("Invalid or missing name");
  }

  return { valid: errors.length === 0, errors };
}

// Enhanced user creation with detailed logging
async function createUsersFromLegacyData(
  doorcards: DoorcardCSVRow[],
  appointments: AppointmentCSVRow[],
  dryRun = false
) {
  log("INFO", "Starting user creation from legacy data...");

  // Collect and normalize usernames to prevent duplicate emails
  const normalizeUsername = (username: string): string => {
    return username?.trim().toLowerCase() || "";
  };

  const doorcardUsernames = new Set(
    doorcards
      .map((d) => d.username?.trim())
      .filter((u) => u && u.length > 0 && u !== "NULL" && u !== "null")
      .map(normalizeUsername)
  );

  const appointmentUsernames = new Set(
    appointments
      .map((a) => a.username?.trim())
      .filter((u) => u && u.length > 0 && u !== "NULL" && u !== "null")
      .map(normalizeUsername)
  );

  const allUsernames = new Set([...doorcardUsernames, ...appointmentUsernames]);

  stats.users.found = allUsernames.size;

  log(
    "INFO",
    `Found ${doorcardUsernames.size} unique usernames in doorcard data`
  );
  log(
    "INFO",
    `Found ${appointmentUsernames.size} unique usernames in appointment data`
  );
  log("INFO", `Total unique usernames: ${allUsernames.size}`);

  // Log sample usernames for verification
  const sampleUsernames = Array.from(allUsernames).slice(0, 10);
  log("DEBUG", "Sample usernames:", sampleUsernames);

  if (allUsernames.size === 0) {
    addError("USER_CREATION", "No usernames found in legacy data");
    return new Map<string, string>();
  }

  // Check for existing users (using normalized usernames)
  const existingUsers = await prisma.user.findMany({
    where: {
      username: { in: Array.from(allUsernames) },
    },
    select: { id: true, username: true },
  });

  const existingUserMap = new Map<string, string>();
  existingUsers.forEach((user) => {
    if (user.username) {
      // Normalize existing usernames for comparison
      const normalizedExisting = user.username.toLowerCase();
      existingUserMap.set(normalizedExisting, user.id);
    }
  });

  log("INFO", `Found ${existingUsers.length} existing users in database`);

  // Prepare users to create
  const defaultPassword = await bcrypt.hash("temp123!", 10);
  const usersToCreate = [];
  const userIdMap = new Map<string, string>();

  // Add existing users to map
  existingUserMap.forEach((id, username) => {
    userIdMap.set(username, id);
  });

  for (const normalizedUsername of allUsernames) {
    if (existingUserMap.has(normalizedUsername)) {
      log("DEBUG", `User already exists: ${normalizedUsername}`);
      continue;
    }

    const userData = {
      id: crypto.randomUUID(),
      username: normalizedUsername,
      email: `${normalizedUsername}@smccd.edu`, // Already lowercase from normalization
      password: defaultPassword,
      role: UserRole.FACULTY,
      name: normalizedUsername,
      updatedAt: new Date(),
    };

    // Validate user data
    const validation = validateUserData(userData);
    if (!validation.valid) {
      addError(
        "USER_VALIDATION",
        `Invalid user data for ${normalizedUsername}`,
        {
          username: normalizedUsername,
          errors: validation.errors,
        }
      );
      stats.users.failed++;
      continue;
    }

    usersToCreate.push(userData);
    userIdMap.set(normalizedUsername, userData.id);
  }

  log("INFO", `Need to create ${usersToCreate.length} new users`);

  if (dryRun) {
    log(
      "INFO",
      "[DRY RUN] Would create users:",
      usersToCreate.slice(0, 5).map((u) => u.username)
    );
    stats.users.created = usersToCreate.length;
    return userIdMap;
  }

  if (usersToCreate.length === 0) {
    log("INFO", "No new users to create");
    return userIdMap;
  }

  // Create users in batches with enhanced error handling
  const batchSize = 50; // Smaller batches for better error isolation
  let totalCreated = 0;

  for (let i = 0; i < usersToCreate.length; i += batchSize) {
    const batch = usersToCreate.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(usersToCreate.length / batchSize);

    log(
      "INFO",
      `Processing batch ${batchNum}/${totalBatches} (${batch.length} users)`
    );
    log(
      "DEBUG",
      `Batch usernames:`,
      batch.map((u) => u.username)
    );

    try {
      // Attempt batch insert (SQLite compatible - no skipDuplicates)
      const result = await prisma.user.createMany({
        data: batch,
      });

      totalCreated += result.count;
      stats.users.created += result.count;

      log("INFO", `✅ Batch ${batchNum}: Created ${result.count} users`);

      if (result.count !== batch.length) {
        const duplicates = batch.length - result.count;
        stats.users.duplicates += duplicates;
        log("WARN", `Batch ${batchNum}: Skipped ${duplicates} duplicates`);
      }

      // Verify users were actually created
      const verifyUsers = await prisma.user.findMany({
        where: {
          id: { in: batch.map((u) => u.id) },
        },
        select: { id: true, username: true },
      });

      if (verifyUsers.length !== result.count) {
        addError(
          "USER_VERIFICATION",
          `User count mismatch in batch ${batchNum}`,
          {
            expected: result.count,
            found: verifyUsers.length,
            batch: batch.map((u) => ({ id: u.id, username: u.username })),
          }
        );
      }
    } catch (error: any) {
      addError("USER_BATCH_INSERT", `Failed to create batch ${batchNum}`, {
        error: error.message,
        code: error.code,
        batch: batch.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
        })),
      });

      stats.users.failed += batch.length;

      // Try individual inserts for this batch
      log("WARN", `Attempting individual inserts for batch ${batchNum}...`);

      for (const userData of batch) {
        try {
          await prisma.user.create({ data: userData });
          totalCreated++;
          stats.users.created++;
          log("DEBUG", `✅ Individual insert successful: ${userData.username}`);
        } catch (individualError: any) {
          addError(
            "USER_INDIVIDUAL_INSERT",
            `Failed to create user ${userData.username}`,
            {
              error: individualError.message,
              code: individualError.code,
              userData,
            }
          );
          stats.users.failed++;
        }
      }
    }
  }

  log("INFO", `✅ User creation complete: ${totalCreated} users created`);

  // Final verification
  const finalUserCount = await prisma.user.count();
  log("INFO", `Database now contains ${finalUserCount} total users`);

  return userIdMap;
}

// Helper functions for parsing legacy data
function parseDate(dateStr: string): Date | null {
  if (
    !dateStr ||
    dateStr.trim() === "" ||
    dateStr === "01/00/00 00:00:00" ||
    dateStr.includes("00/00")
  ) {
    return null;
  }

  try {
    // Handle various date formats
    let cleanDate = dateStr.trim();

    // Replace common invalid patterns
    if (cleanDate.includes("00/00")) {
      return null;
    }

    // Try parsing the date
    const parsed = new Date(cleanDate);
    if (isNaN(parsed.getTime())) {
      // Try alternate parsing for MM/dd/yy format
      const parts = cleanDate.split(/[\/\-\s]/);
      if (parts.length >= 3) {
        const month = parseInt(parts[0]);
        const day = parseInt(parts[1]);
        const year = parseInt(parts[2]);

        // Skip invalid dates
        if (month === 0 || day === 0 || year === 0) {
          return null;
        }

        // Handle 2-digit years
        const fullYear =
          year < 50 ? 2000 + year : year < 100 ? 1900 + year : year;
        const altParsed = new Date(fullYear, month - 1, day);

        if (!isNaN(altParsed.getTime())) {
          return altParsed;
        }
      }
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function parseCollege(collegeStr: string): College {
  const college = collegeStr?.toLowerCase().trim();
  switch (college) {
    case "csm":
    case "college of san mateo":
      return College.CSM;
    case "skyline":
    case "skyline college":
      return College.SKYLINE;
    case "canada":
    case "cañada college":
      return College.CANADA;
    case "district office":
    case "district":
      return College.DISTRICT_OFFICE;
    default:
      return College.CSM; // Default fallback
  }
}

function parseTerm(termStr: string): { season: TermSeason; year: number } {
  // Parse term strings like "201203", "Spring 2012", etc.
  if (termStr?.match(/^\d{6}$/)) {
    // Format: YYYYMM
    const year = parseInt(termStr.substring(0, 4));
    const month = termStr.substring(4, 6);

    const season =
      month === "03"
        ? TermSeason.SPRING
        : month === "05"
          ? TermSeason.SUMMER
          : month === "08"
            ? TermSeason.FALL
            : TermSeason.FALL; // Default

    return { season, year };
  }

  // Default fallback
  return { season: TermSeason.FALL, year: 2024 };
}

function parseDayOfWeek(dayStr: string): DayOfWeek {
  const day = dayStr?.toLowerCase().trim();
  switch (day) {
    case "monday":
    case "mon":
    case "m":
      return DayOfWeek.MONDAY;
    case "tuesday":
    case "tue":
    case "t":
      return DayOfWeek.TUESDAY;
    case "wednesday":
    case "wed":
    case "w":
      return DayOfWeek.WEDNESDAY;
    case "thursday":
    case "thu":
    case "th":
    case "r":
      return DayOfWeek.THURSDAY;
    case "friday":
    case "fri":
    case "f":
      return DayOfWeek.FRIDAY;
    case "saturday":
    case "sat":
    case "s":
      return DayOfWeek.SATURDAY;
    case "sunday":
    case "sun":
    case "su":
      return DayOfWeek.SUNDAY;
    default:
      return DayOfWeek.MONDAY; // Default fallback
  }
}

function parseTime(timeStr: string): string {
  // Parse time strings and return in HH:MM format
  if (!timeStr) return "09:00";

  // Handle various time formats
  const cleaned = timeStr.trim();
  if (cleaned.match(/^\d{1,2}:\d{2}$/)) {
    return cleaned;
  }

  // Default fallback
  return "09:00";
}

// Import doorcards with user relationships
async function importDoorcards(
  doorcards: DoorcardCSVRow[],
  userIdMap: Map<string, string>
) {
  log("INFO", `Starting doorcard import for ${doorcards.length} records...`);

  let processed = 0;
  let imported = 0;
  let rejected = 0;

  for (const doorcard of doorcards) {
    processed++;

    try {
      const normalizedUsername = doorcard.username?.trim().toLowerCase() || "";
      const userId = userIdMap.get(normalizedUsername);
      if (!userId) {
        addError(
          "DOORCARD_NO_USER",
          `No user found for username: ${doorcard.username} (normalized: ${normalizedUsername})`,
          { doorcard }
        );
        rejected++;
        continue;
      }

      const startDate = parseDate(doorcard.doorstartdate);
      const endDate = parseDate(doorcard.doorenddate);
      const term = parseTerm(doorcard.doorterm);

      // Create fallback dates based on term if dates are invalid
      let finalStartDate = startDate;
      let finalEndDate = endDate;

      if (!startDate || !endDate) {
        // Generate fallback dates from term
        if (term.season === TermSeason.SPRING) {
          finalStartDate = finalStartDate || new Date(term.year, 0, 15); // Jan 15
          finalEndDate = finalEndDate || new Date(term.year, 4, 31); // May 31
        } else if (term.season === TermSeason.SUMMER) {
          finalStartDate = finalStartDate || new Date(term.year, 5, 1); // June 1
          finalEndDate = finalEndDate || new Date(term.year, 7, 31); // August 31
        } else {
          // FALL
          finalStartDate = finalStartDate || new Date(term.year, 7, 15); // Aug 15
          finalEndDate = finalEndDate || new Date(term.year, 11, 31); // Dec 31
        }

        log(
          "DEBUG",
          `Used fallback dates for doorcard ${doorcard.doorcardID}: ${finalStartDate.toDateString()} - ${finalEndDate.toDateString()}`
        );
      }

      const college = parseCollege(doorcard.college);

      await prisma.doorcard.create({
        data: {
          id: doorcard.doorcardID,
          name: doorcard.doorcardname || `Doorcard for ${doorcard.username}`,
          doorcardName:
            doorcard.doorcardname || `Doorcard for ${doorcard.username}`,
          officeNumber: "TBD", // Default value since not in CSV
          userId: userId,
          term: term.season,
          year: term.year,
          college: college,
          isActive: (finalEndDate || new Date()) > new Date(),
          updatedAt: new Date(),
        },
      });

      imported++;

      if (processed % 1000 === 0) {
        log(
          "INFO",
          `Progress: ${processed}/${doorcards.length} doorcards processed`
        );
      }
    } catch (error: any) {
      addError(
        "DOORCARD_CREATE_FAILED",
        `Failed to create doorcard ${doorcard.doorcardID}`,
        {
          error: error.message,
          doorcard,
        }
      );
      rejected++;
    }
  }

  stats.doorcards = { processed, imported, rejected };
  log(
    "INFO",
    `✅ Doorcard import complete: ${imported} imported, ${rejected} rejected`
  );
}

// Import appointments with doorcard relationships
async function importAppointments(
  appointments: AppointmentCSVRow[],
  userIdMap: Map<string, string>,
  categories: CategoryCSVRow[]
) {
  log(
    "INFO",
    `Starting appointment import for ${appointments.length} records...`
  );

  // Create category map
  const categoryMap = new Map<string, AppointmentCategory>();
  const defaultCategoryMap = new Map([
    ["1", AppointmentCategory.OFFICE_HOURS],
    ["2", AppointmentCategory.IN_CLASS],
    ["3", AppointmentCategory.LECTURE],
    ["4", AppointmentCategory.LAB],
    ["5", AppointmentCategory.HOURS_BY_ARRANGEMENT],
    ["6", AppointmentCategory.REFERENCE],
    ["7", AppointmentCategory.OTHER], // Fix for undefined category 7
  ]);

  // Use provided categories or fall back to defaults
  for (const cat of categories) {
    if (cat.catID && defaultCategoryMap.has(cat.catID)) {
      categoryMap.set(cat.catID, defaultCategoryMap.get(cat.catID)!);
    }
  }

  // Fill in missing categories with defaults
  for (const [id, category] of defaultCategoryMap) {
    if (!categoryMap.has(id)) {
      categoryMap.set(id, category);
    }
  }

  let processed = 0;
  let imported = 0;
  let rejected = 0;

  for (const appointment of appointments) {
    processed++;

    try {
      // Validate required fields
      if (!appointment.doorcardID || !appointment.username?.trim()) {
        rejected++;
        continue;
      }

      const normalizedUsername = appointment.username.trim().toLowerCase();
      const userId = userIdMap.get(normalizedUsername);
      if (!userId) {
        rejected++;
        continue;
      }

      // Check if doorcard exists
      const doorcard = await prisma.doorcard.findUnique({
        where: { id: appointment.doorcardID },
      });

      if (!doorcard) {
        rejected++;
        continue;
      }

      const category =
        categoryMap.get(appointment.catID) || AppointmentCategory.OTHER;
      const dayOfWeek = parseDayOfWeek(appointment.appointday);
      const startTime = parseTime(appointment.appointstarttime);
      const endTime = parseTime(appointment.appointendtime);

      await prisma.appointment.create({
        data: {
          id: appointment.appointID,
          name: appointment.appointname || "Appointment",
          doorcardId: appointment.doorcardID,
          category: category,
          dayOfWeek: dayOfWeek,
          startTime: startTime,
          endTime: endTime,
          updatedAt: new Date(),
        },
      });

      imported++;

      if (processed % 5000 === 0) {
        log(
          "INFO",
          `Progress: ${processed}/${appointments.length} appointments processed`
        );
      }
    } catch (error: any) {
      addError(
        "APPOINTMENT_CREATE_FAILED",
        `Failed to create appointment ${appointment.appointID}`,
        {
          error: error.message,
          appointment,
        }
      );
      rejected++;
    }
  }

  stats.appointments = { processed, imported, rejected };
  log(
    "INFO",
    `✅ Appointment import complete: ${imported} imported, ${rejected} rejected`
  );
}

// Create final report
function createImportReport() {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      users: stats.users,
      doorcards: stats.doorcards,
      appointments: stats.appointments,
      totalErrors: stats.errors.length,
    },
    errors: stats.errors,
    recommendations: [],
  };

  // Add recommendations based on results
  if (stats.users.failed > 0) {
    report.recommendations.push(
      "Review user creation failures and fix data issues before production"
    );
  }

  if (stats.errors.length > 0) {
    report.recommendations.push(
      "Address all errors before running production import"
    );
  }

  if (stats.users.duplicates > 0) {
    report.recommendations.push(
      "Consider cleaning duplicate data in source files"
    );
  }

  return report;
}

// Main import function with comprehensive debugging
async function importLegacyData(dryRun = false) {
  log(
    "INFO",
    `🚀 Starting legacy data import... ${dryRun ? "(DRY RUN)" : "(LIVE RUN)"}`
  );

  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      process.exit(1);
    }

    // Check existing data
    const existingData = await checkExistingData();
    if (!existingData) {
      process.exit(1);
    }

    // Read and parse CSV files (reusing original logic but with better error handling)
    log("INFO", "Reading CSV files...");

    // Read actual CSV files
    const csvDir = "./db-items";
    const doorcards: DoorcardCSVRow[] = [];
    const appointments: AppointmentCSVRow[] = [];
    const categories: CategoryCSVRow[] = [];

    // Read all CSV files
    log("INFO", "Reading doorcard CSV...");
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(path.join(csvDir, "TBL_DOORCARD (1).csv"))
        .pipe(parse({ headers: true }))
        .on("data", (row) => doorcards.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    log("INFO", "Reading appointment CSV...");
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(path.join(csvDir, "TBL_APPOINTMENT (1).csv"))
        .pipe(parse({ headers: true }))
        .on("data", (row) => appointments.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    log("INFO", "Reading category CSV...");
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(path.join(csvDir, "TBL_CATEGORY (1).csv"))
        .pipe(parse({ headers: true }))
        .on("data", (row) => categories.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    log(
      "INFO",
      `Loaded ${doorcards.length} doorcards, ${appointments.length} appointments, ${categories.length} categories`
    );

    // Step 1: Create users first (user-first strategy)
    log("INFO", "=== STEP 1: Creating users from all references ===");
    const userIdMap = await createUsersFromLegacyData(
      doorcards,
      appointments,
      dryRun
    );

    if (!dryRun) {
      // Step 2: Import doorcards with user relationships
      log("INFO", "=== STEP 2: Importing doorcards ===");
      await importDoorcards(doorcards, userIdMap);

      // Step 3: Import appointments with doorcard relationships
      log("INFO", "=== STEP 3: Importing appointments ===");
      await importAppointments(appointments, userIdMap, categories);
    }

    // Generate and save report
    const report = createImportReport();
    const reportPath = `./import-debug-report-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log("INFO", `📋 Debug report saved to: ${reportPath}`);

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("🎯 IMPORT DEBUG SUMMARY");
    console.log("=".repeat(60));
    console.log(`Users Found: ${stats.users.found}`);
    console.log(`Users Created: ${stats.users.created}`);
    console.log(`Users Failed: ${stats.users.failed}`);
    console.log(`Users Duplicated: ${stats.users.duplicates}`);
    console.log(`Total Errors: ${stats.errors.length}`);

    if (stats.errors.length > 0) {
      console.log("\n🚨 TOP ERRORS:");
      stats.errors.slice(0, 5).forEach((error, i) => {
        console.log(`${i + 1}. ${error.type}: ${error.message}`);
      });
    }

    console.log(`\n📋 Full report: ${reportPath}`);
    console.log("=".repeat(60));
  } catch (error: any) {
    addError("IMPORT_FATAL", "Fatal error during import", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    log("ERROR", "Import failed with fatal error", {
      message: error.message,
      stack: error.stack?.split("\n").slice(0, 5), // First 5 lines of stack
    });
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI setup
const program = new Command();
program
  .name("import-legacy-debug")
  .description("Debug version of legacy doorcard data import")
  .option("--dry", "Run in dry mode without writing to database")
  .action((options) => {
    importLegacyData(options.dry);
  });

program.parse();
