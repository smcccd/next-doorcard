const fs = require("fs");
const { parse } = require("fast-csv");

async function criticalAnalysis() {
  console.log("🚨 CRITICAL LEGACY DATA IMPORT ANALYSIS");
  console.log("=".repeat(50));

  // Source data counts
  const sourceFiles = {
    appointments: 184936,
    doorcards: 10945,
    users: 2,
  };

  // Rejected data counts
  const rejectFiles = {
    appointments: 8919,
    doorcards: 10944,
  };

  // Calculate success rates
  const doorcardSuccessRate = (
    ((sourceFiles.doorcards - rejectFiles.doorcards) / sourceFiles.doorcards) *
    100
  ).toFixed(1);
  const appointmentSuccessRate = (
    ((sourceFiles.appointments - rejectFiles.appointments) /
      sourceFiles.appointments) *
    100
  ).toFixed(1);

  console.log("📊 IMPORT SUCCESS RATES:");
  console.log(
    `Doorcards: ${doorcardSuccessRate}% success (${sourceFiles.doorcards - rejectFiles.doorcards} of ${sourceFiles.doorcards})`
  );
  console.log(
    `Appointments: ${appointmentSuccessRate}% success (${sourceFiles.appointments - rejectFiles.appointments} of ${sourceFiles.appointments})`
  );
  console.log(`Users: Only 2 users in source file (critical issue)`);

  console.log("\n🚨 CRITICAL PROBLEMS IDENTIFIED:");
  console.log(
    "1. CATASTROPHIC APPOINTMENT FAILURE: 0 appointments imported despite 95.2% success rate"
  );
  console.log(
    "2. MASSIVE USER DATA MISSING: Only 2 users in source, but 1000+ unique usernames in doorcards"
  );
  console.log(
    "3. FOREIGN KEY VIOLATIONS: Almost all rejections due to missing users"
  );
  console.log(
    "4. DATA INTEGRITY COMPROMISE: Doorcards exist without valid appointments"
  );

  // Quick analysis of rejection patterns
  const doorcardRejects = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream("/Users/besnyib/next-doorcard/rejects/TBL_DOORCARD.csv")
      .pipe(parse({ headers: true }))
      .on("data", (row) => doorcardRejects.push(row))
      .on("end", resolve)
      .on("error", reject);
  });

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

  // Count unique missing users
  const missingUsers = new Set();
  [...doorcardRejects, ...appointmentRejects].forEach((row) => {
    if (row._reject_reason && row._reject_reason.includes("User not found")) {
      missingUsers.add(row.username);
    }
  });

  console.log(`\n👥 MISSING USER ANALYSIS:`);
  console.log(`Unique missing usernames: ${missingUsers.size}`);
  console.log(
    `Empty usernames in appointments: ${appointmentRejects.filter((r) => !r.username || r.username.trim() === "").length}`
  );

  // Check appointment rejection reasons
  const appointmentRejectReasons = {};
  appointmentRejects.forEach((row) => {
    const reason = row._reject_reason;
    appointmentRejectReasons[reason] =
      (appointmentRejectReasons[reason] || 0) + 1;
  });

  console.log(`\n📅 APPOINTMENT REJECTION BREAKDOWN:`);
  Object.entries(appointmentRejectReasons)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .forEach(([reason, count]) => {
      console.log(
        `  ${reason}: ${count} (${((count / appointmentRejects.length) * 100).toFixed(1)}%)`
      );
    });

  console.log("\n⚠️  IMMEDIATE ACTIONS REQUIRED FOR PRODUCTION:");
  console.log("1. STOP MIGRATION - appointment import completely failed");
  console.log(
    "2. Obtain complete user dataset - current user file is incomplete"
  );
  console.log("3. Fix appointment-to-user linking logic");
  console.log("4. Implement comprehensive error handling");
  console.log("5. Add data validation and rollback mechanisms");
  console.log("6. Create user accounts from all doorcard data first");
  console.log("7. Test on staging environment with full dataset");

  console.log("\n📋 PRODUCTION READINESS: ❌ NOT READY");
  console.log("Risk Level: 🔴 CRITICAL - Data loss and integrity issues");
}

criticalAnalysis().catch(console.error);
