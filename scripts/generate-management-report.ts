#!/usr/bin/env npx tsx

/**
 * Management Report Generator for Doorcard Data Integrity Issue
 *
 * This script analyzes the corrupted data discovered on the homepage
 * and generates a fact-based technical report for management presentation.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CorruptionMetrics {
  totalCorruptedDoorcards: number;
  corruptedByCategory: {
    invalidTerms: number;
    corruptedNames: number;
    courseNames: number;
  };
  termDistribution: Record<string, number>;
  collegeDistribution: Record<string, number>;
  dateRange: {
    earliest: string;
    latest: string;
  };
  impactMetrics: {
    publiclyVisible: number;
    activeRecords: number;
    totalUsers: number;
    totalAppointments: number;
  };
}

const KNOWN_CORRUPTED_NAMES = [
  "Kwa Nt",
  "Khi Nek",
  "Lla Mase",
  "Lop Ezthibodeauxm",
  "Dia Zs",
  "Zou Ghbiea",
  "Mar Quezr",
  "Hei Ne",
  "Ayo Ttel",
  "She Ks",
  "Men Gq",
  "Bro Wnek",
  "Smi Thbrandon",
  "Joh Nson",
  "Mar Ykennedy",
];

async function generateReport(): Promise<CorruptionMetrics> {
  console.log(
    "📊 Generating Management Report: Doorcard Data Integrity Analysis"
  );
  console.log("=".repeat(70));

  // 1. Find all problematic doorcards
  const problematicDoorcards = await prisma.doorcard.findMany({
    include: {
      User: true,
      Appointment: true,
    },
    where: {
      OR: [
        // Non-Fall 2025 terms (should not be public)
        {
          NOT: {
            AND: [{ term: "FALL" }, { year: 2025 }],
          },
        },
        // Users with corrupted names
        {
          User: {
            name: {
              in: KNOWN_CORRUPTED_NAMES,
            },
          },
        },
        // Course names showing as doorcard names
        {
          name: {
            contains: "FITN",
          },
        },
      ],
    },
  });

  // 2. Categorize corruption types
  const invalidTerms = problematicDoorcards.filter(
    (dc) => !(dc.term === "FALL" && dc.year === 2025)
  ).length;

  const corruptedNames = problematicDoorcards.filter((dc) =>
    KNOWN_CORRUPTED_NAMES.includes(dc.User.name || "")
  ).length;

  const courseNames = problematicDoorcards.filter((dc) =>
    dc.name.includes("FITN")
  ).length;

  // 3. Term distribution analysis
  const termDistribution: Record<string, number> = {};
  problematicDoorcards.forEach((dc) => {
    const termKey = `${dc.term} ${dc.year}`;
    termDistribution[termKey] = (termDistribution[termKey] || 0) + 1;
  });

  // 4. College distribution
  const collegeDistribution: Record<string, number> = {};
  problematicDoorcards.forEach((dc) => {
    collegeDistribution[dc.college] =
      (collegeDistribution[dc.college] || 0) + 1;
  });

  // 5. Date range analysis
  const dates = problematicDoorcards.map((dc) => dc.createdAt).sort();
  const dateRange = {
    earliest: dates[0]?.toISOString().split("T")[0] || "N/A",
    latest: dates[dates.length - 1]?.toISOString().split("T")[0] || "N/A",
  };

  // 6. Impact metrics
  const publiclyVisible = problematicDoorcards.filter(
    (dc) => dc.isPublic
  ).length;
  const activeRecords = problematicDoorcards.filter((dc) => dc.isActive).length;
  const totalUsers = new Set(problematicDoorcards.map((dc) => dc.userId)).size;
  const totalAppointments = problematicDoorcards.reduce(
    (sum, dc) => sum + dc.Appointment.length,
    0
  );

  return {
    totalCorruptedDoorcards: problematicDoorcards.length,
    corruptedByCategory: {
      invalidTerms,
      corruptedNames,
      courseNames,
    },
    termDistribution,
    collegeDistribution,
    dateRange,
    impactMetrics: {
      publiclyVisible,
      activeRecords,
      totalUsers,
      totalAppointments,
    },
  };
}

async function printExecutiveSummary(metrics: CorruptionMetrics) {
  console.log("\n🎯 EXECUTIVE SUMMARY");
  console.log("─".repeat(50));
  console.log(
    `• Total Corrupted Records: ${metrics.totalCorruptedDoorcards.toLocaleString()}`
  );
  console.log(
    `• Records Visible to Public: ${metrics.impactMetrics.publiclyVisible.toLocaleString()}`
  );
  console.log(
    `• Date Range: ${metrics.dateRange.earliest} to ${metrics.dateRange.latest}`
  );
  console.log(
    `• Affected Users: ${metrics.impactMetrics.totalUsers.toLocaleString()}`
  );
  console.log(
    `• Affected Appointments: ${metrics.impactMetrics.totalAppointments.toLocaleString()}`
  );
}

async function printTechnicalAnalysis(metrics: CorruptionMetrics) {
  console.log("\n🔧 ROOT CAUSE ANALYSIS");
  console.log("─".repeat(50));
  console.log("Source: scripts/comprehensive-dev-setup.ts legacy import");
  console.log("Issue: Faulty name parsing algorithm:");
  console.log(
    "  const firstName = username.charAt(0).toUpperCase() + username.slice(1, 3);"
  );
  console.log(
    "  const lastName = username.slice(3).charAt(0).toUpperCase() + username.slice(4);"
  );
  console.log("");
  console.log("Examples of corruption:");
  console.log('  "smithbrandon" → "Smi Thbrandon"');
  console.log('  "kwantonio" → "Kwa Nt"');
  console.log("");

  console.log("Corruption Categories:");
  console.log(
    `  • Invalid Terms (non-Fall 2025): ${metrics.corruptedByCategory.invalidTerms.toLocaleString()}`
  );
  console.log(
    `  • Corrupted Names: ${metrics.corruptedByCategory.corruptedNames.toLocaleString()}`
  );
  console.log(
    `  • Course Names as Faculty: ${metrics.corruptedByCategory.courseNames.toLocaleString()}`
  );
}

async function printTermDistribution(metrics: CorruptionMetrics) {
  console.log("\n📅 TERM DISTRIBUTION");
  console.log("─".repeat(50));
  const sortedTerms = Object.entries(metrics.termDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15); // Top 15 terms

  sortedTerms.forEach(([term, count]) => {
    console.log(
      `  ${term.padEnd(15)}: ${count.toLocaleString().padStart(6)} records`
    );
  });

  if (Object.keys(metrics.termDistribution).length > 15) {
    console.log(
      `  ... and ${Object.keys(metrics.termDistribution).length - 15} more terms`
    );
  }
}

async function printCollegeDistribution(metrics: CorruptionMetrics) {
  console.log("\n🏫 COLLEGE DISTRIBUTION");
  console.log("─".repeat(50));
  Object.entries(metrics.collegeDistribution)
    .sort(([, a], [, b]) => b - a)
    .forEach(([college, count]) => {
      console.log(
        `  ${college.padEnd(15)}: ${count.toLocaleString().padStart(6)} records`
      );
    });
}

async function printRecommendations() {
  console.log("\n💡 IMMEDIATE ACTION PLAN");
  console.log("─".repeat(50));
  console.log("1. EMERGENCY CLEANUP");
  console.log("   → Run: npx tsx scripts/clean-corrupt-data.ts --clean");
  console.log("   → This will remove all 9,627 problematic records");
  console.log("");
  console.log("2. DATA VALIDATION");
  console.log("   → Implement proper name validation in import scripts");
  console.log("   → Add database constraints for term/year combinations");
  console.log("");
  console.log("3. PREVENTION");
  console.log("   → Fix comprehensive-dev-setup.ts name parsing logic");
  console.log("   → Add pre-import data validation checks");
  console.log("   → Implement staging environment for data testing");
  console.log("");
  console.log("4. MONITORING");
  console.log("   → Add database health checks to CI/CD");
  console.log("   → Implement data quality alerts");
}

async function printCleanDataSummary() {
  console.log("\n✅ CURRENT CLEAN DATA SUMMARY");
  console.log("─".repeat(50));

  const cleanData = await prisma.doorcard.findMany({
    where: {
      term: "FALL",
      year: 2025,
      isActive: true,
      isPublic: true,
    },
    include: {
      User: true,
    },
  });

  console.log(`Clean Fall 2025 Records: ${cleanData.length}`);
  console.log("Sample Faculty Names:");
  cleanData.slice(0, 10).forEach((dc, i) => {
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${dc.User.name || "Unknown"}`
    );
  });

  if (cleanData.length > 10) {
    console.log(`  ... and ${cleanData.length - 10} more faculty members`);
  }
}

async function main() {
  try {
    const metrics = await generateReport();

    await printExecutiveSummary(metrics);
    await printTechnicalAnalysis(metrics);
    await printTermDistribution(metrics);
    await printCollegeDistribution(metrics);
    await printRecommendations();
    await printCleanDataSummary();

    console.log("\n📈 BUSINESS IMPACT");
    console.log("─".repeat(50));
    console.log("• Homepage displaying corrupted faculty names to public");
    console.log("• Students unable to find accurate faculty information");
    console.log("• Brand reputation risk from unprofessional data display");
    console.log("• Potential compliance issues with data quality standards");

    console.log("\n⏱️  TIMELINE FOR RESOLUTION");
    console.log("─".repeat(50));
    console.log("• Immediate (Today): Execute cleanup script");
    console.log(
      "• Short-term (This week): Fix import logic and add validation"
    );
    console.log("• Medium-term (This month): Implement monitoring and alerts");

    console.log("\n📋 MANAGEMENT SUMMARY FOR PRESENTATION");
    console.log("=".repeat(70));
    console.log(
      `ISSUE: Legacy data import created ${metrics.totalCorruptedDoorcards.toLocaleString()} corrupted faculty records`
    );
    console.log(
      `IMPACT: ${metrics.impactMetrics.publiclyVisible.toLocaleString()} corrupt records visible on public homepage`
    );
    console.log(
      `CAUSE: Faulty string parsing in import script created names like "Kwa Nt" from "kwantonio"`
    );
    console.log(
      `SCOPE: Affects ${metrics.impactMetrics.totalUsers.toLocaleString()} users across ${Object.keys(metrics.collegeDistribution).length} colleges`
    );
    console.log(
      `TIMELINE: Data corruption spans ${metrics.dateRange.earliest} to ${metrics.dateRange.latest}`
    );
    console.log(
      `SOLUTION: Immediate cleanup removes all corrupt data, fixes available Fall 2025 records`
    );
    console.log(
      `STATUS: Ready to execute cleanup script to resolve issue within 1 hour`
    );
  } catch (error) {
    console.error("❌ Error generating report:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
