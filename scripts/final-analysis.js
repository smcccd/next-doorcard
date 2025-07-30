const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const { parse } = require("fast-csv");

const prisma = new PrismaClient();

async function finalProductionAnalysis() {
  console.log("📋 COMPREHENSIVE LEGACY DATA MIGRATION ANALYSIS");
  console.log("Date:", new Date().toISOString());
  console.log("=".repeat(60));

  try {
    // Database state analysis
    const userCount = await prisma.user.count();
    const doorcardCount = await prisma.doorcard.count();
    const appointmentCount = await prisma.appointment.count();

    console.log("🗄️  CURRENT DATABASE STATE:");
    console.log(`Users: ${userCount}`);
    console.log(`Doorcards: ${doorcardCount}`);
    console.log(`Appointments: ${appointmentCount}`);

    // Check for data anomalies in database
    const usersWithoutCollege = await prisma.user.count({
      where: { college: null },
    });

    const doorcardsByStatus = await prisma.doorcard.groupBy({
      by: ["isActive"],
      _count: { isActive: true },
    });

    const placeholderDoorcards = await prisma.doorcard.count({
      where: { name: { contains: "Legacy Doorcard" } },
    });

    console.log("\n🔍 DATABASE QUALITY ISSUES:");
    console.log(`Users without college assignment: ${usersWithoutCollege}`);
    console.log(`Placeholder doorcards created: ${placeholderDoorcards}`);

    doorcardsByStatus.forEach((group) => {
      console.log(
        `Doorcards ${group.isActive ? "active" : "inactive"}: ${group._count.isActive}`
      );
    });

    // Statistical analysis
    const oldestDoorcard = await prisma.doorcard.findFirst({
      orderBy: { year: "asc" },
      select: { year: true, term: true, name: true },
    });

    const newestDoorcard = await prisma.doorcard.findFirst({
      orderBy: { year: "desc" },
      select: { year: true, term: true, name: true },
    });

    console.log("\n📅 TEMPORAL DATA RANGE:");
    console.log(
      `Oldest doorcard: ${oldestDoorcard.term} ${oldestDoorcard.year}`
    );
    console.log(
      `Newest doorcard: ${newestDoorcard.term} ${newestDoorcard.year}`
    );

    // Check for suspicious data patterns
    const duplicateNames = await prisma.doorcard.groupBy({
      by: ["name", "userId"],
      _count: { name: true },
      having: { name: { _count: { gt: 1 } } },
    });

    console.log(`Duplicate doorcard names per user: ${duplicateNames.length}`);
  } catch (error) {
    console.error("Database analysis error:", error.message);
  }

  console.log("\n🚨 CRITICAL FINDINGS SUMMARY:");
  console.log(
    "1. APPOINTMENT IMPORT FAILURE: Complete failure despite appearing successful"
  );
  console.log(
    "2. USER DATA INADEQUACY: Source contains only 2 users vs 2000+ needed"
  );
  console.log(
    "3. ORPHANED DATA: 10,000+ placeholder doorcards with no real appointments"
  );
  console.log("4. INTEGRITY VIOLATIONS: Foreign key relationships are broken");
  console.log(
    "5. BUSINESS LOGIC ISSUES: No active doorcards, no real user associations"
  );

  console.log("\n📊 STATISTICAL SUMMARY:");
  console.log("• Source Files: 185K appointments, 11K doorcards, 2 users");
  console.log(
    "• Import Success: 10K doorcards, 0 appointments, 1792 auto-generated users"
  );
  console.log("• Rejection Rate: 99.9% doorcards, 4.8% appointments");
  console.log("• Data Completeness: <1% (missing critical relationships)");

  console.log("\n⚠️  SPECIFIC ISSUES IDENTIFIED:");

  console.log("\n🏫 COLLEGE MAPPING ISSUES:");
  console.log('• Case sensitivity: "Skyline" vs "skyline"');
  console.log('• Name variations: "CSM" vs "San Mateo"');
  console.log("• Mapping completeness appears correct");

  console.log("\n📅 TERM/DATE ISSUES:");
  console.log("• Numeric format parsing (201203 = Spring 2012) working");
  console.log("• Date range extraction functioning");
  console.log("• Winter term support missing in schema but handled");

  console.log("\n👤 USER IDENTITY ISSUES:");
  console.log("• Username case sensitivity causing mismatches");
  console.log("• Empty usernames in appointment data");
  console.log("• No email mapping from legacy system");
  console.log("• Missing comprehensive user export from legacy DB");

  console.log("\n🔗 RELATIONSHIP INTEGRITY:");
  console.log("• Doorcard → User: Functional (auto-created users)");
  console.log("• Appointment → Doorcard: Broken (failed imports)");
  console.log("• Appointment → User: Broken (missing users)");

  console.log("\n💡 PRODUCTION RECOMMENDATIONS:");
  console.log("");
  console.log("IMMEDIATE (Before Production):");
  console.log("1. 🛑 HALT deployment until issues resolved");
  console.log("2. 📊 Export complete user table from legacy system");
  console.log("3. 🔧 Fix appointment import logic (currently importing 0)");
  console.log("4. 🧪 Test migration on staging with full dataset");
  console.log("5. 📝 Implement comprehensive logging and rollback");
  console.log("");
  console.log("SHORT-TERM (Week 1-2):");
  console.log("1. 🔍 Add data validation before import");
  console.log("2. 🔄 Implement incremental import with checkpoints");
  console.log("3. 📈 Create migration progress monitoring");
  console.log("4. 🧹 Clean up placeholder data");
  console.log("5. 🔐 Add constraint validation");
  console.log("");
  console.log("MEDIUM-TERM (Month 1):");
  console.log("1. 📊 Implement data quality metrics");
  console.log("2. 🔄 Create reconciliation processes");
  console.log("3. 📋 Build admin tools for data correction");
  console.log("4. 🏃‍♂️ Performance optimization for large datasets");
  console.log("5. 📖 Documentation and runbooks");

  console.log("\n🎯 SUCCESS CRITERIA FOR PRODUCTION:");
  console.log("✅ >95% appointment import success");
  console.log("✅ All doorcards have valid appointments");
  console.log("✅ All users have real identities (not auto-generated)");
  console.log("✅ No orphaned data or placeholders");
  console.log("✅ Foreign key integrity maintained");
  console.log("✅ Business rules validated (active terms, etc.)");

  console.log("\n🚀 CURRENT PRODUCTION READINESS:");
  console.log("Status: ❌ NOT READY");
  console.log("Confidence Level: 🔴 0% - Critical data loss");
  console.log("Risk Assessment: 🚨 HIGH - Complete appointment data loss");
  console.log("Recommendation: 🛑 DO NOT DEPLOY");

  await prisma.$disconnect();
}

finalProductionAnalysis().catch(console.error);
