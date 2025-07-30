const fs = require("fs");
const { parse } = require("fast-csv");

async function analyzeRejects() {
  console.log("📋 COMPREHENSIVE LEGACY DATA ANALYSIS REPORT");
  console.log("=".repeat(60));

  // Analyze TBL_DOORCARD rejects
  console.log("\n🚪 DOORCARD REJECTION ANALYSIS:");
  const doorcardRejects = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("/Users/besnyib/next-doorcard/rejects/TBL_DOORCARD.csv")
      .pipe(parse({ headers: true }))
      .on("data", (row) => doorcardRejects.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Total doorcard rejects: ${doorcardRejects.length}`);

  // Group by reason
  const doorcardRejectReasons = {};
  doorcardRejects.forEach((row) => {
    const reason = row._reject_reason;
    doorcardRejectReasons[reason] = (doorcardRejectReasons[reason] || 0) + 1;
  });

  console.log("\nDoorcard rejection reasons:");
  Object.entries(doorcardRejectReasons)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(
        `  ${reason}: ${count} (${((count / doorcardRejects.length) * 100).toFixed(1)}%)`
      );
    });

  // Analyze TBL_APPOINTMENT rejects
  console.log("\n📅 APPOINTMENT REJECTION ANALYSIS:");
  const appointmentRejects = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(
      "/Users/besnyib/next-doorcard/rejects/TBL_APPOINTMENT.csv"
    )
      .pipe(parse({ headers: true }))
      .on("data", (row) => appointmentRejects.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(`Total appointment rejects: ${appointmentRejects.length}`);

  // Group by reason
  const appointmentRejectReasons = {};
  appointmentRejects.forEach((row) => {
    const reason = row._reject_reason;
    appointmentRejectReasons[reason] =
      (appointmentRejectReasons[reason] || 0) + 1;
  });

  console.log("\nAppointment rejection reasons:");
  Object.entries(appointmentRejectReasons)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(
        `  ${reason}: ${count} (${((count / appointmentRejects.length) * 100).toFixed(1)}%)`
      );
    });

  // Analyze patterns in rejected usernames
  console.log("\n👤 MISSING USER PATTERNS:");
  const missingUsers = new Set();

  [...doorcardRejects, ...appointmentRejects].forEach((row) => {
    if (row._reject_reason && row._reject_reason.includes("User not found")) {
      missingUsers.add(row.username);
    }
  });

  console.log(`Unique missing usernames: ${missingUsers.size}`);

  // Sample missing usernames
  const sampleMissing = Array.from(missingUsers).slice(0, 20);
  console.log("\nSample missing usernames:");
  sampleMissing.forEach((username) => {
    console.log(`  ${username || "[EMPTY]"}`);
  });

  // Analyze college patterns in rejected doorcards
  console.log("\n🏫 REJECTED DOORCARD COLLEGE DISTRIBUTION:");
  const collegeDistribution = {};
  doorcardRejects.forEach((row) => {
    if (row.college) {
      collegeDistribution[row.college] =
        (collegeDistribution[row.college] || 0) + 1;
    }
  });

  Object.entries(collegeDistribution)
    .sort((a, b) => b[1] - a[1])
    .forEach(([college, count]) => {
      console.log(`  ${college}: ${count}`);
    });

  // Analyze term patterns in rejected doorcards
  console.log("\n📅 REJECTED DOORCARD TERM DISTRIBUTION:");
  const termDistribution = {};
  doorcardRejects.forEach((row) => {
    if (row.doorterm) {
      const yearMatch = row.doorterm.match(/(\d{4})/);
      const year = yearMatch ? yearMatch[1] : "Unknown";
      termDistribution[year] = (termDistribution[year] || 0) + 1;
    }
  });

  Object.entries(termDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([year, count]) => {
      console.log(`  ${year}: ${count}`);
    });

  // Critical data integrity issues
  console.log("\n🚨 CRITICAL ISSUES IDENTIFIED:");

  const rejectionRate =
    ((doorcardRejects.length + appointmentRejects.length) / (10945 + 184936)) *
    100;
  console.log(`Overall rejection rate: ${rejectionRate.toFixed(1)}%`);

  const doorcardRejectionRate = (doorcardRejects.length / 10945) * 100;
  console.log(`Doorcard rejection rate: ${doorcardRejectionRate.toFixed(1)}%`);

  const appointmentRejectionRate = (appointmentRejects.length / 184936) * 100;
  console.log(
    `Appointment rejection rate: ${appointmentRejectionRate.toFixed(1)}%`
  );

  console.log("\n⚠️  Issues requiring immediate attention:");
  console.log(
    `1. ${appointmentRejects.length} appointments rejected (${appointmentRejectionRate.toFixed(1)}% of total)`
  );
  console.log(
    `2. ${missingUsers.size} unique usernames not found in user table`
  );
  console.log(`3. Many appointments have empty usernames`);
  console.log(`4. Legacy data has incomplete user-doorcard relationships`);

  // Check for empty usernames in appointments
  const emptyUsernameAppointments = appointmentRejects.filter(
    (row) => !row.username || row.username.trim() === ""
  );
  console.log(
    `5. ${emptyUsernameAppointments.length} appointments with completely empty usernames`
  );

  // Success rates
  console.log("\n✅ SUCCESSFUL IMPORTS:");
  const successfulDoorcards = 10945 - doorcardRejects.length;
  const successfulAppointments = 184936 - appointmentRejects.length;

  console.log(
    `Successful doorcards: ${successfulDoorcards} (${((successfulDoorcards / 10945) * 100).toFixed(1)}%)`
  );
  console.log(
    `Successful appointments: ${successfulAppointments} (${((successfulAppointments / 184936) * 100).toFixed(1)}%)`
  );

  // Recommendations
  console.log("\n💡 RECOMMENDATIONS FOR PRODUCTION:");
  console.log(
    "1. Fix user creation process - create users from ALL doorcard/appointment data first"
  );
  console.log(
    "2. Handle empty usernames in appointments by linking to doorcard owners"
  );
  console.log(
    "3. Implement user matching by alternative identifiers (email patterns, name matching)"
  );
  console.log("4. Create a reconciliation process for orphaned appointments");
  console.log("5. Add data validation for college names (case sensitivity)");
  console.log(
    "6. Implement better error handling for malformed dates and terms"
  );
}

analyzeRejects().catch(console.error);
