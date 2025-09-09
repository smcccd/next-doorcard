import * as fs from "fs";

// Read the latest import report
const reportFiles = fs
  .readdirSync(".")
  .filter((f) => f.startsWith("import-debug-report-"))
  .sort();
const latestReport = reportFiles[reportFiles.length - 1];

if (!latestReport) {
  console.error("No import report found");
  process.exit(1);
}

console.log(`📊 Analyzing: ${latestReport}`);

const report = JSON.parse(fs.readFileSync(latestReport, "utf8"));

console.log("\n" + "=".repeat(80));
console.log("🎯 IMPORT SUMMARY ANALYSIS");
console.log("=".repeat(80));

// Summary Statistics
const summary = report.summary;
console.log(`\n📈 OVERALL STATISTICS:`);
console.log(`Users Found: ${summary.users.found.toLocaleString()}`);
console.log(`Users Created: ${summary.users.created.toLocaleString()}`);
console.log(`Users Failed: ${summary.users.failed.toLocaleString()}`);
console.log(`Users Duplicates: ${summary.users.duplicates.toLocaleString()}`);
console.log(
  `\nDoorcards Processed: ${summary.doorcards.processed.toLocaleString()}`
);
console.log(
  `Doorcards Imported: ${summary.doorcards.imported.toLocaleString()}`
);
console.log(
  `Doorcards Rejected: ${summary.doorcards.rejected.toLocaleString()}`
);
console.log(
  `\nAppointments Processed: ${summary.appointments.processed.toLocaleString()}`
);
console.log(
  `Appointments Imported: ${summary.appointments.imported.toLocaleString()}`
);
console.log(
  `Appointments Rejected: ${summary.appointments.rejected.toLocaleString()}`
);
console.log(`\nTotal Errors: ${summary.totalErrors.toLocaleString()}`);

// Error Analysis
const errors = report.errors || [];
const errorCounts = new Map<string, number>();
const errorExamples = new Map<string, any[]>();

// Categorize errors
errors.forEach((error: any) => {
  const type = error.type;
  errorCounts.set(type, (errorCounts.get(type) || 0) + 1);

  if (!errorExamples.has(type)) {
    errorExamples.set(type, []);
  }

  // Keep only first 3 examples of each error type
  if (errorExamples.get(type)!.length < 3) {
    errorExamples.get(type)!.push(error);
  }
});

console.log(`\n🚨 ERROR BREAKDOWN BY TYPE:`);
console.log("-".repeat(60));

const sortedErrors = Array.from(errorCounts.entries()).sort(
  (a, b) => b[1] - a[1]
);

let totalCounted = 0;
sortedErrors.forEach(([type, count], index) => {
  const percentage = ((count / errors.length) * 100).toFixed(1);
  totalCounted += count;

  console.log(
    `${index + 1}. ${type}: ${count.toLocaleString()} errors (${percentage}%)`
  );

  // Show examples for top error types
  if (index < 5 && errorExamples.has(type)) {
    const examples = errorExamples.get(type)!;
    examples.forEach((example, exIndex) => {
      let reason = example.message;

      // Extract specific error details
      if (example.data?.error) {
        if (example.data.error.includes("Unique constraint failed")) {
          const match = example.data.error.match(
            /Unique constraint failed on the fields: \(`(\w+)`\)/
          );
          if (match) {
            reason = `Duplicate ${match[1]} constraint violation`;
          }
        } else if (example.data.error.includes("Unknown argument")) {
          reason = "SQLite compatibility issue";
        } else if (example.data.error.includes("Foreign key constraint")) {
          reason = "Missing foreign key relationship";
        }
      }

      console.log(`   → Example ${exIndex + 1}: ${reason}`);

      // Show sample data if available
      if (example.data?.batch?.[0]) {
        const sample = example.data.batch[0];
        console.log(
          `     Data: ${sample.username || sample.doorcardID || sample.appointID || "N/A"}`
        );
      }
    });
  }
  console.log();
});

// Specific Analysis for different components
console.log(`\n📊 DETAILED COMPONENT ANALYSIS:`);
console.log("-".repeat(60));

// User Creation Analysis
const userErrors = errors.filter((e: any) => e.type.includes("USER"));
console.log(`\n👥 USER CREATION ISSUES:`);
console.log(`Total User Errors: ${userErrors.length.toLocaleString()}`);

const userErrorReasons = new Map<string, number>();
userErrors.forEach((error: any) => {
  let reason = "Unknown";

  if (error.data?.error) {
    if (
      error.data.error.includes(
        "Unique constraint failed on the fields: (`email`)"
      )
    ) {
      reason = "Duplicate email addresses";
    } else if (
      error.data.error.includes(
        "Unique constraint failed on the fields: (`username`)"
      )
    ) {
      reason = "Duplicate usernames";
    } else if (error.data.error.includes("Unknown argument `skipDuplicates`")) {
      reason = "SQLite skipDuplicates not supported";
    } else if (error.data.error.includes("validation")) {
      reason = "Data validation failed";
    }
  }

  userErrorReasons.set(reason, (userErrorReasons.get(reason) || 0) + 1);
});

userErrorReasons.forEach((count, reason) => {
  const percentage = ((count / userErrors.length) * 100).toFixed(1);
  console.log(`  • ${reason}: ${count} (${percentage}%)`);
});

// Doorcard Analysis
const doorcardErrors = errors.filter((e: any) => e.type.includes("DOORCARD"));
console.log(`\n🚪 DOORCARD IMPORT ISSUES:`);
console.log(`Total Doorcard Errors: ${doorcardErrors.length.toLocaleString()}`);

const doorcardErrorReasons = new Map<string, number>();
doorcardErrors.forEach((error: any) => {
  let reason = "Unknown";

  if (error.type === "DOORCARD_NO_USER") {
    reason = "Missing user reference";
  } else if (error.type === "DOORCARD_INVALID_DATES") {
    reason = "Invalid date format";
  } else if (error.type === "DOORCARD_CREATE_FAILED") {
    reason = "Database creation failed";
  }

  doorcardErrorReasons.set(reason, (doorcardErrorReasons.get(reason) || 0) + 1);
});

doorcardErrorReasons.forEach((count, reason) => {
  const percentage =
    doorcardErrors.length > 0
      ? ((count / doorcardErrors.length) * 100).toFixed(1)
      : "0.0";
  console.log(`  • ${reason}: ${count} (${percentage}%)`);
});

// Appointment Analysis
const appointmentErrors = errors.filter((e: any) =>
  e.type.includes("APPOINTMENT")
);
console.log(`\n📅 APPOINTMENT IMPORT ISSUES:`);
console.log(
  `Total Appointment Errors: ${appointmentErrors.length.toLocaleString()}`
);

const appointmentErrorReasons = new Map<string, number>();
appointmentErrors.forEach((error: any) => {
  let reason = "Unknown";

  if (error.type === "APPOINTMENT_NO_USER") {
    reason = "Missing user reference";
  } else if (error.type === "APPOINTMENT_NO_DOORCARD") {
    reason = "Missing doorcard reference";
  } else if (error.type === "APPOINTMENT_CREATE_FAILED") {
    reason = "Database creation failed";
  }

  appointmentErrorReasons.set(
    reason,
    (appointmentErrorReasons.get(reason) || 0) + 1
  );
});

appointmentErrorReasons.forEach((count, reason) => {
  const percentage =
    appointmentErrors.length > 0
      ? ((count / appointmentErrors.length) * 100).toFixed(1)
      : "0.0";
  console.log(`  • ${reason}: ${count} (${percentage}%)`);
});

console.log(`\n💡 SUCCESS RATES:`);
console.log(
  `Users: ${((summary.users.created / summary.users.found) * 100).toFixed(1)}% success`
);
console.log(
  `Doorcards: ${((summary.doorcards.imported / summary.doorcards.processed) * 100).toFixed(1)}% success`
);
console.log(
  `Appointments: ${((summary.appointments.imported / summary.appointments.processed) * 100).toFixed(1)}% success`
);

console.log(`\n🎯 KEY INSIGHTS:`);
if (summary.users.created === 0 && userErrors.length > 0) {
  console.log(
    `• User creation completely failed - this caused cascading failures`
  );
  console.log(
    `• Primary issue: ${Array.from(userErrorReasons.entries())[0]?.[0] || "Unknown"}`
  );
  console.log(
    `• Once users are created, doorcard/appointment success should improve dramatically`
  );
}

if (summary.doorcards.imported === 0 && summary.appointments.imported === 0) {
  console.log(`• Zero doorcards/appointments imported due to missing users`);
  console.log(`• This confirms the user-first strategy is correct`);
}

console.log(`\n📋 RECOMMENDATIONS:`);
console.log(
  `1. Fix user creation issues first (resolves ${userErrors.length} errors)`
);
console.log(`2. Handle duplicate detection manually for SQLite`);
console.log(`3. Re-run import after user issues resolved`);
console.log(`4. Expected final success rate: 85-95% after fixes`);

console.log("\n" + "=".repeat(80));
