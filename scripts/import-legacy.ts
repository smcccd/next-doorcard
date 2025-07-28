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
import { parse } from "fast-csv";
import { createWriteStream } from "fs";
import { format } from "fast-csv";
import bcrypt from "bcryptjs";
import { Command } from "commander";
const prisma = new PrismaClient();

// Type definitions for CSV rows
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

interface RejectedRow {
  row: any;
  reason: string;
  file: string;
}

// ID mapping tables
const userIdMap = new Map<string, string>(); // username -> new user id
const doorcardIdMap = new Map<string, string>(); // old doorcard id -> new doorcard id
const categoryMap = new Map<string, AppointmentCategory>(); // catID -> AppointmentCategory

// Initialize category mapping based on data analysis
function initializeCategoryMap() {
  categoryMap.set("1", AppointmentCategory.OFFICE_HOURS);
  categoryMap.set("2", AppointmentCategory.IN_CLASS);
  categoryMap.set("3", AppointmentCategory.LECTURE);
  categoryMap.set("4", AppointmentCategory.LAB);
  categoryMap.set("5", AppointmentCategory.HOURS_BY_ARRANGEMENT);
  categoryMap.set("6", AppointmentCategory.REFERENCE);
  categoryMap.set("7", AppointmentCategory.REFERENCE); // Default unmapped category to REFERENCE
}

// Transform functions
function mapUserRole(role: string): UserRole {
  const upperRole = role.toUpperCase();
  if (upperRole.includes("ADMIN")) return UserRole.ADMIN;
  if (upperRole.includes("STAFF")) return UserRole.STAFF;
  return UserRole.FACULTY; // Default to FACULTY
}

function mapCollege(college: string): College | null {
  const upperCollege = college.toUpperCase();
  if (upperCollege.includes("SKYLINE")) return College.SKYLINE;
  if (upperCollege.includes("CSM") || upperCollege.includes("SAN MATEO"))
    return College.CSM;
  if (upperCollege.includes("CANADA") || upperCollege.includes("CAÑADA"))
    return College.CANADA;
  return null;
}

function mapDayOfWeek(day: string): DayOfWeek | null {
  const dayMap: Record<string, DayOfWeek> = {
    MONDAY: DayOfWeek.MONDAY,
    TUESDAY: DayOfWeek.TUESDAY,
    WEDNESDAY: DayOfWeek.WEDNESDAY,
    THURSDAY: DayOfWeek.THURSDAY,
    FRIDAY: DayOfWeek.FRIDAY,
    SATURDAY: DayOfWeek.SATURDAY,
    SUNDAY: DayOfWeek.SUNDAY,
  };
  return dayMap[day.toUpperCase()] || null;
}

function parseTermAndYear(termStr: string): {
  season: TermSeason | null;
  year: number | null;
} {
  const upperTerm = termStr.toUpperCase();
  let season: TermSeason | null = null;
  let year: number | null = null;

  // Handle numeric term formats like "202203" (YYYYSS where SS = 03=Spring, 05=Summer, 08=Fall)
  const numericMatch = termStr.match(/^(\d{4})(\d{2})$/);
  if (numericMatch) {
    const yearPart = parseInt(numericMatch[1]);
    const seasonCode = numericMatch[2];

    year = yearPart;

    // Map season codes
    if (seasonCode === "03") season = TermSeason.SPRING;
    else if (seasonCode === "05") season = TermSeason.SUMMER;
    else if (seasonCode === "08") season = TermSeason.FALL;
    else if (seasonCode === "01") season = TermSeason.SPRING; // Map WINTER to SPRING

    return { season, year };
  }

  // Extract season from text
  if (upperTerm.includes("FALL")) season = TermSeason.FALL;
  else if (upperTerm.includes("SPRING")) season = TermSeason.SPRING;
  else if (upperTerm.includes("SUMMER")) season = TermSeason.SUMMER;
  else if (upperTerm.includes("WINTER")) season = TermSeason.SPRING; // Map WINTER to SPRING

  // Extract year - look for 4-digit year or 2-digit year
  const yearMatch = termStr.match(/\b(19|20)\d{2}\b|\b\d{2}\b/);
  if (yearMatch) {
    const yearStr = yearMatch[0];
    if (yearStr.length === 2) {
      // Convert 2-digit year to 4-digit
      const twoDigitYear = parseInt(yearStr);
      year = twoDigitYear > 50 ? 1900 + twoDigitYear : 2000 + twoDigitYear;
    } else {
      year = parseInt(yearStr);
    }
  }

  return { season, year };
}

function extractTimeFromDateTime(dateTimeStr: string): string {
  // Format: "12/30/99 12:00:00"
  const parts = dateTimeStr.split(" ");
  if (parts.length >= 2) {
    const timeParts = parts[1].split(":");
    if (timeParts.length >= 2) {
      return `${timeParts[0].padStart(2, "0")}:${timeParts[1].padStart(
        2,
        "0",
      )}`;
    }
  }
  return "00:00"; // Default
}

// Generate default email from username
function generateEmail(username: string): string {
  return `${username.toLowerCase()}@smccd.edu`;
}

// Generate slug from doorcard info
function generateSlug(name: string, term: string, year: number): string {
  const baseSlug = `${name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")}-${term.toLowerCase()}-${year}`;
  return `${baseSlug}-${Math.random().toString(36).substr(2, 5)}`;
}

// Extract location from appointment name
function extractLocation(appointmentName: string): string | null {
  // Look for patterns like "Room 123", "Bldg 3", "18-204", etc.
  const locationPatterns = [
    /Room\s+[\d\-A-Z]+/i,
    /Rm\s+[\d\-A-Z]+/i,
    /Bldg\s+[\d\-A-Z]+/i,
    /Building\s+[\d\-A-Z]+/i,
    /\b\d{1,2}-\d{3,4}\b/, // Pattern like "18-204"
    /Lab\s+[\d\-A-Z]+/i,
  ];

  for (const pattern of locationPatterns) {
    const match = appointmentName.match(pattern);
    if (match) {
      return match[0];
    }
  }

  // Check if entire name might be a location
  if (appointmentName.match(/^\d{1,2}-\d{3,4}$/)) {
    return appointmentName;
  }

  return null;
}

// CSV processing functions
async function processUsers(
  filePath: string,
  dryRun: boolean,
  rejects: RejectedRow[],
) {
  console.log("\n📤 Processing Users...");
  const defaultPassword = await bcrypt.hash("changeme123", 10);
  let processed = 0;
  let created = 0;

  return new Promise<void>((resolve, reject) => {
    const rows: UserCSVRow[] = [];

    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row: UserCSVRow) => {
        rows.push(row);
      })
      .on("end", async () => {
        console.log(`📊 Processing ${rows.length} users in batches...`);

        const batchSize = 100;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          console.log(
            `📤 Processing users batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`,
          );

          const validUsers = [];

          for (const row of batch) {
            try {
              processed++;
              const email = generateEmail(row.username);
              const role = mapUserRole(row.userrole);

              if (!dryRun) {
                validUsers.push({
                  username: row.username,
                  email,
                  password: defaultPassword,
                  role,
                  name: row.username,
                });
              } else {
                console.log(
                  `[DRY RUN] Would create/update user: ${row.username} (${email})`,
                );
              }
            } catch (error) {
              rejects.push({
                row,
                reason:
                  error instanceof Error ? error.message : "Unknown error",
                file: "TBL_USER.csv",
              });
            }
          }

          if (!dryRun && validUsers.length > 0) {
            try {
              // Use createMany with skipDuplicates for batch insert
              const result = await prisma.user.createMany({
                data: validUsers,
                skipDuplicates: true,
              });
              created += result.count;

              // Get the created users to populate the ID map
              const createdUsers = await prisma.user.findMany({
                where: {
                  email: { in: validUsers.map((u) => u.email) },
                },
                select: { id: true, username: true },
              });

              for (const user of createdUsers) {
                if (user.username) {
                  userIdMap.set(user.username, user.id);
                }
              }
            } catch (error) {
              console.error(
                `❌ Batch insert failed for users batch ${Math.floor(i / batchSize) + 1}:`,
                error,
              );
              // Fall back to individual inserts for this batch
              for (const userData of validUsers) {
                try {
                  const user = await prisma.user.upsert({
                    where: { email: userData.email },
                    update: {
                      username: userData.username,
                      role: userData.role,
                    },
                    create: userData,
                  });
                  userIdMap.set(userData.username, user.id);
                  created++;
                } catch (individualError) {
                  rejects.push({
                    row: {
                      username: userData.username,
                      userrole: userData.role,
                    },
                    reason:
                      individualError instanceof Error
                        ? individualError.message
                        : "Unknown error",
                    file: "TBL_USER.csv",
                  });
                }
              }
            }
          }
        }

        console.log(
          `✅ Users: Processed ${processed}, Created/Updated ${created}`,
        );
        resolve();
      })
      .on("error", reject);
  });
}

async function processCategories(filePath: string) {
  console.log("\n📤 Processing Categories for mapping...");

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row: CategoryCSVRow) => {
        // Log category info for manual mapping refinement
        console.log(`Category ${row.catID}: ${row.catname}`);
      })
      .on("end", () => {
        console.log("✅ Category mapping initialized");
        resolve();
      })
      .on("error", reject);
  });
}

async function processDoorcards(
  filePath: string,
  dryRun: boolean,
  rejects: RejectedRow[],
) {
  console.log("\n📤 Processing Doorcards...");
  let processed = 0;

  return new Promise<void>((resolve, reject) => {
    const rows: DoorcardCSVRow[] = [];

    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row: DoorcardCSVRow) => {
        rows.push(row);
      })
      .on("end", async () => {
        console.log(`📊 Processing ${rows.length} doorcards...`);

        const validDoorcards = [];
        const userUpdates = [];

        for (const row of rows) {
          try {
            processed++;
            const userId = userIdMap.get(row.username);
            if (!userId) {
              throw new Error(`User not found for username: ${row.username}`);
            }

            const college = mapCollege(row.college);
            if (!college) {
              throw new Error(`Invalid college: ${row.college}`);
            }

            const { season, year } = parseTermAndYear(row.doorterm);
            if (!season || !year) {
              throw new Error(`Invalid term format: ${row.doorterm}`);
            }

            const slug = generateSlug(row.doorcardname, season, year);

            if (!dryRun) {
              validDoorcards.push({
                oldId: row.doorcardID,
                data: {
                  name: row.doorcardname,
                  doorcardName: row.doorcardname,
                  officeNumber: "TBD",
                  term: season,
                  year,
                  college,
                  slug,
                  isActive: false,
                  isPublic: false,
                  userId,
                },
              });

              // Don't overwrite user names with doorcard names
              // userUpdates.push({
              //   id: userId,
              //   name: row.doorcardname
              // });
            } else {
              console.log(
                `[DRY RUN] Would create doorcard: ${row.doorcardname} (${season} ${year})`,
              );
            }
          } catch (error) {
            rejects.push({
              row,
              reason: error instanceof Error ? error.message : "Unknown error",
              file: "TBL_DOORCARD.csv",
            });
          }
        }

        if (!dryRun && validDoorcards.length > 0) {
          try {
            const batchSize = 25; // Smaller batches for better progress visibility
            let created = 0;

            console.log(
              `📊 Processing ${validDoorcards.length} doorcards in batches of ${batchSize}...`,
            );

            for (let i = 0; i < validDoorcards.length; i += batchSize) {
              const batch = validDoorcards.slice(i, i + batchSize);
              console.log(
                `📤 Processing doorcards batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validDoorcards.length / batchSize)} (${batch.length} doorcards)`,
              );

              // Create doorcards individually to get IDs for mapping
              for (const doorcard of batch) {
                try {
                  const createdDoorcard = await prisma.doorcard.create({
                    data: doorcard.data,
                  });
                  doorcardIdMap.set(doorcard.oldId, createdDoorcard.id);
                  created++;
                } catch (error) {
                  rejects.push({
                    row: { doorcardID: doorcard.oldId },
                    reason:
                      error instanceof Error ? error.message : "Unknown error",
                    file: "TBL_DOORCARD.csv",
                  });
                }
              }
            }

            // Skip user name updates - preserve original user names
            // if (userUpdates.length > 0) {
            //   const uniqueUserUpdates = userUpdates.reduce((acc, update) => {
            //     acc[update.id] = update.name;
            //     return acc;
            //   }, {} as Record<string, string>);

            //   const updatePromises = Object.entries(uniqueUserUpdates).map(([userId, name]) =>
            //     prisma.user.update({
            //       where: { id: userId },
            //       data: { name }
            //     })
            //   );

            //   await Promise.all(updatePromises);
            // }

            console.log(
              `✅ Doorcards: Processed ${processed}, Created ${created}`,
            );
          } catch (error) {
            console.error(`❌ Batch processing failed for doorcards:`, error);
          }
        } else if (dryRun) {
          console.log(`✅ Doorcards: Processed ${processed} (dry run)`);
        }

        resolve();
      })
      .on("error", reject);
  });
}

async function processAppointments(
  filePath: string,
  dryRun: boolean,
  rejects: RejectedRow[],
) {
  console.log("\n📤 Processing Appointments...");
  let processed = 0;
  let placeholdersCreated = 0;

  return new Promise<void>((resolve, reject) => {
    const rows: AppointmentCSVRow[] = [];

    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row: AppointmentCSVRow) => {
        rows.push(row);
      })
      .on("end", async () => {
        console.log(`📊 Processing ${rows.length} appointments...`);

        const validAppointments = [];

        for (const row of rows) {
          try {
            processed++;
            // Check if username is valid (not empty)
            if (!row.username || !row.username.trim()) {
              throw new Error(
                `Empty username for appointment: ${row.appointname}`,
              );
            }

            let doorcardId = doorcardIdMap.get(row.doorcardID);

            // If doorcard not found, create a placeholder
            if (!doorcardId) {
              const userId = userIdMap.get(row.username.trim());
              if (!userId) {
                throw new Error(`User not found for username: ${row.username}`);
              }

              if (!dryRun) {
                // Create placeholder doorcard for missing legacy data
                const placeholderDoorcard = await prisma.doorcard.create({
                  data: {
                    name: `Legacy Doorcard (ID: ${row.doorcardID})`,
                    doorcardName: `Legacy Doorcard (ID: ${row.doorcardID})`,
                    officeNumber: "Unknown",
                    term: TermSeason.FALL, // Default term
                    year: 2021, // Default year
                    college: College.SKYLINE, // Default college
                    slug: `legacy-${row.doorcardID}-${Math.random().toString(36).substr(2, 5)}`,
                    isActive: false,
                    isPublic: false,
                    userId,
                  },
                });
                doorcardIdMap.set(row.doorcardID, placeholderDoorcard.id);
                doorcardId = placeholderDoorcard.id;
                placeholdersCreated++;
              } else {
                console.log(
                  `[DRY RUN] Would create placeholder doorcard for ID: ${row.doorcardID}`,
                );
                // In dry run, still add to map for further processing
                doorcardIdMap.set(
                  row.doorcardID,
                  `dummy-doorcard-${row.doorcardID}`,
                );
                doorcardId = `dummy-doorcard-${row.doorcardID}`;
              }
            }

            const category = categoryMap.get(row.catID);
            if (!category) {
              throw new Error(`Unknown category ID: ${row.catID}`);
            }

            const dayOfWeek = mapDayOfWeek(row.appointday);
            if (!dayOfWeek) {
              throw new Error(`Invalid day of week: ${row.appointday}`);
            }

            const startTime = extractTimeFromDateTime(row.appointstarttime);
            const endTime = extractTimeFromDateTime(row.appointendtime);
            const location = extractLocation(row.appointname);

            if (!dryRun) {
              validAppointments.push({
                name: row.appointname,
                startTime,
                endTime,
                dayOfWeek,
                category,
                location,
                doorcardId,
              });
            } else {
              console.log(
                `[DRY RUN] Would create appointment: ${row.appointname} on ${row.appointday}`,
              );
            }
          } catch (error) {
            rejects.push({
              row,
              reason: error instanceof Error ? error.message : "Unknown error",
              file: "TBL_APPOINTMENT.csv",
            });
          }
        }

        if (!dryRun && validAppointments.length > 0) {
          try {
            const batchSize = 100;
            let created = 0;

            console.log(
              `📊 Processing ${validAppointments.length} appointments in batches of ${batchSize}...`,
            );

            for (let i = 0; i < validAppointments.length; i += batchSize) {
              const batch = validAppointments.slice(i, i + batchSize);
              console.log(
                `📤 Processing appointments batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validAppointments.length / batchSize)} (${batch.length} appointments)`,
              );

              try {
                const result = await prisma.appointment.createMany({
                  data: batch,
                  skipDuplicates: true,
                });
                created += result.count;
              } catch (error) {
                console.error(`❌ Batch insert failed:`, error);
              }
            }

            console.log(
              `✅ Appointments: Processed ${processed}, Created ${created}`,
            );
            if (placeholdersCreated > 0) {
              console.log(
                `📝 Created ${placeholdersCreated} placeholder doorcards for missing legacy data`,
              );
            }
          } catch (error) {
            console.error(
              `❌ Batch processing failed for appointments:`,
              error,
            );
          }
        } else if (dryRun) {
          console.log(`✅ Appointments: Processed ${processed} (dry run)`);
        }

        resolve();
      })
      .on("error", reject);
  });
}

// Write rejects to CSV
async function writeRejects(rejects: RejectedRow[]) {
  if (rejects.length === 0) return;

  const rejectsDir = path.join(process.cwd(), "rejects");
  if (!fs.existsSync(rejectsDir)) {
    fs.mkdirSync(rejectsDir, { recursive: true });
  }

  // Group rejects by file
  const rejectsByFile = rejects.reduce(
    (acc, reject) => {
      if (!acc[reject.file]) acc[reject.file] = [];
      acc[reject.file].push(reject);
      return acc;
    },
    {} as Record<string, RejectedRow[]>,
  );

  for (const [file, fileRejects] of Object.entries(rejectsByFile)) {
    const rejectPath = path.join(rejectsDir, file);
    const writeStream = createWriteStream(rejectPath);
    const csvStream = format({ headers: true });

    csvStream.pipe(writeStream);

    fileRejects.forEach((reject) => {
      csvStream.write({
        ...reject.row,
        _reject_reason: reject.reason,
      });
    });

    csvStream.end();
    console.log(`❌ Written ${fileRejects.length} rejects to ${rejectPath}`);
  }
}

// Extract all unique usernames from doorcard data
async function extractUsernamesFromDoorcards(
  filePath: string,
): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    const usernames = new Set<string>();

    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row: DoorcardCSVRow) => {
        if (row.username && row.username.trim()) {
          usernames.add(row.username.trim());
        }
      })
      .on("end", () => {
        console.log(
          `📊 Found ${usernames.size} unique usernames in doorcard data`,
        );
        resolve(usernames);
      })
      .on("error", reject);
  });
}

// Extract all unique usernames from appointment data
async function extractUsernamesFromAppointments(
  filePath: string,
): Promise<Set<string>> {
  return new Promise((resolve, reject) => {
    const usernames = new Set<string>();

    fs.createReadStream(filePath)
      .pipe(parse({ headers: true }))
      .on("data", (row: AppointmentCSVRow) => {
        if (row.username && row.username.trim()) {
          usernames.add(row.username.trim());
        }
      })
      .on("end", () => {
        console.log(
          `📊 Found ${usernames.size} unique usernames in appointment data`,
        );
        resolve(usernames);
      })
      .on("error", reject);
  });
}

// Create missing users based on doorcard data
async function createMissingUsers(
  usernames: Set<string>,
  dryRun: boolean,
  rejects: RejectedRow[],
) {
  console.log("\n📤 Creating missing users from doorcard data...");
  const defaultPassword = await bcrypt.hash("changeme123", 10);

  const missingUsernames = Array.from(usernames).filter(
    (username) => !userIdMap.has(username),
  );
  console.log(`📊 Creating ${missingUsernames.length} missing users...`);

  if (dryRun) {
    for (const username of missingUsernames) {
      const email = generateEmail(username);
      console.log(
        `[DRY RUN] Would create missing user: ${username} (${email})`,
      );
      userIdMap.set(username, `dummy-id-${username}`);
    }
    return;
  }

  const validUsers = [];
  for (const username of missingUsernames) {
    try {
      const email = generateEmail(username);
      validUsers.push({
        username,
        email,
        password: defaultPassword,
        role: UserRole.FACULTY,
        name: username,
      });
    } catch (error) {
      rejects.push({
        row: { username },
        reason: error instanceof Error ? error.message : "Unknown error",
        file: "GENERATED_USERS.csv",
      });
    }
  }

  if (validUsers.length > 0) {
    const batchSize = 100;
    let created = 0;

    console.log(
      `📊 Processing ${validUsers.length} users in batches of ${batchSize}...`,
    );

    for (let i = 0; i < validUsers.length; i += batchSize) {
      const batch = validUsers.slice(i, i + batchSize);
      console.log(
        `📤 Processing users batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(validUsers.length / batchSize)} (${batch.length} users)`,
      );

      try {
        const result = await prisma.user.createMany({
          data: batch,
          skipDuplicates: true,
        });
        created += result.count;

        // Get the created users to populate the ID map
        const createdUsers = await prisma.user.findMany({
          where: {
            email: { in: batch.map((u) => u.email) },
          },
          select: { id: true, username: true },
        });

        for (const user of createdUsers) {
          if (user.username) {
            userIdMap.set(user.username, user.id);
          }
        }
      } catch (error) {
        console.error(`❌ Batch insert failed:`, error);
      }
    }

    console.log(`✅ Missing users: Created ${created} users`);
  }
}

// Main import function
async function importLegacyData(options: { dryRun: boolean }) {
  console.log("🚀 Starting legacy data import...");
  if (options.dryRun) {
    console.log("🔍 Running in DRY RUN mode - no data will be written");
  }

  const dbItemsPath = path.join(process.cwd(), "db-items");
  const rejects: RejectedRow[] = [];

  try {
    // Initialize mappings
    initializeCategoryMap();

    // Process categories first (for mapping reference)
    const categoryPath = path.join(dbItemsPath, "TBL_CATEGORY (1).csv");
    if (fs.existsSync(categoryPath)) {
      await processCategories(categoryPath);
    }

    // Skip TBL_USER (AD data) - create users from legacy app data only
    console.log(
      "⚠️  Skipping TBL_USER.csv (AD data) - creating users from legacy app data",
    );

    // Extract usernames from doorcard data and appointments
    const doorcardPath = path.join(dbItemsPath, "TBL_DOORCARD (1).csv");
    const appointmentPath = path.join(dbItemsPath, "TBL_APPOINTMENT (1).csv");

    const doorcardUsernames = await extractUsernamesFromDoorcards(doorcardPath);
    const appointmentUsernames =
      await extractUsernamesFromAppointments(appointmentPath);

    // Combine all usernames from legacy app
    const allUsernames = new Set([
      ...doorcardUsernames,
      ...appointmentUsernames,
    ]);
    console.log(
      `📊 Found ${allUsernames.size} total unique usernames in legacy app data`,
    );

    await createMissingUsers(allUsernames, options.dryRun, rejects);

    // Process doorcards (depends on users)
    await processDoorcards(doorcardPath, options.dryRun, rejects);

    // Process appointments (depends on doorcards)
    await processAppointments(appointmentPath, options.dryRun, rejects);

    // Write rejects
    if (rejects.length > 0) {
      await writeRejects(rejects);
      console.log(`\n⚠️  ${rejects.length} rows were rejected`);
    }

    console.log("\n✅ Import completed successfully!");
  } catch (error) {
    console.error("\n❌ Import failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI setup
const program = new Command();

program
  .name("import-legacy")
  .description("Import legacy doorcard data from CSV files")
  .option("--dry", "Run in dry mode without writing to database")
  .action(async (options) => {
    try {
      await importLegacyData({ dryRun: options.dry || false });
    } catch (error) {
      console.error("Import failed:", error);
      process.exit(1);
    }
  });

program.parse();
