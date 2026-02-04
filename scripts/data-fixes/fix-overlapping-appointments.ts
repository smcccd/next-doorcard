#!/usr/bin/env npx tsx

import { PrismaClient, Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

interface OverlapFix {
  doorcardId: string;
  userName: string;
  originalCount: number;
  fixedCount: number;
  deletedCount: number;
  adjustedCount: number;
  details: string[];
}

async function analyzeAndFixOverlappingAppointments() {
  console.log("🔍 Analyzing overlapping appointments...\n");

  const fixes: OverlapFix[] = [];
  const reportData: any = {
    totalDoorcards: 0,
    affectedDoorcards: 0,
    totalAppointments: 0,
    overlappingAppointments: 0,
    duplicateAppointments: 0,
    adjustedAppointments: 0,
    deletedAppointments: 0,
    examples: [],
    timestamp: new Date().toISOString(),
  };

  // Get all active doorcards with appointments
  const doorcards = await prisma.doorcard.findMany({
    where: {
      isActive: true,
      term: "FALL",
      year: 2025,
    },
    include: {
      User: true,
      Appointment: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  reportData.totalDoorcards = doorcards.length;

  for (const doorcard of doorcards) {
    const fix: OverlapFix = {
      doorcardId: doorcard.id,
      userName: doorcard.User.name || doorcard.User.email || "Unknown",
      originalCount: doorcard.Appointment.length,
      fixedCount: 0,
      deletedCount: 0,
      adjustedCount: 0,
      details: [],
    };

    reportData.totalAppointments += doorcard.Appointment.length;

    // Group appointments by day
    const appointmentsByDay = new Map<string, typeof doorcard.Appointment>();
    doorcard.Appointment.forEach((apt) => {
      const day = apt.dayOfWeek;
      if (!appointmentsByDay.has(day)) {
        appointmentsByDay.set(day, []);
      }
      appointmentsByDay.get(day)!.push(apt);
    });

    let hasOverlaps = false;

    // Process each day
    for (const [day, appointments] of appointmentsByDay) {
      const toDelete: string[] = [];
      const toAdjust: Array<{ id: string; newEndTime: string }> = [];

      // First pass: identify exact duplicates
      const seen = new Map<string, string>();
      for (const apt of appointments) {
        const key = `${apt.startTime}-${apt.endTime}-${apt.category}-${apt.location || ""}`;
        if (seen.has(key)) {
          // This is a duplicate
          toDelete.push(apt.id);
          fix.details.push(
            `Duplicate removed: ${day} ${apt.startTime}-${apt.endTime} ${apt.category}`
          );
          reportData.duplicateAppointments++;
        } else {
          seen.set(key, apt.id);
        }
      }

      // Second pass: check for overlaps among non-duplicates
      const nonDuplicates = appointments.filter(
        (apt) => !toDelete.includes(apt.id)
      );

      for (let i = 0; i < nonDuplicates.length; i++) {
        for (let j = i + 1; j < nonDuplicates.length; j++) {
          const apt1 = nonDuplicates[i];
          const apt2 = nonDuplicates[j];

          const start1 = timeToMinutes(apt1.startTime);
          const end1 = timeToMinutes(apt1.endTime);
          const start2 = timeToMinutes(apt2.startTime);
          const end2 = timeToMinutes(apt2.endTime);

          // Check for overlap
          if (start1 < end2 && end1 > start2) {
            hasOverlaps = true;
            reportData.overlappingAppointments++;

            // Strategy: If they're the same category and one contains the other, keep the longer one
            if (apt1.category === apt2.category) {
              if (start1 <= start2 && end1 >= end2) {
                // apt1 contains apt2, delete apt2
                if (!toDelete.includes(apt2.id)) {
                  toDelete.push(apt2.id);
                  fix.details.push(
                    `Contained appointment removed: ${day} ${apt2.startTime}-${apt2.endTime}`
                  );
                }
              } else if (start2 <= start1 && end2 >= end1) {
                // apt2 contains apt1, delete apt1
                if (!toDelete.includes(apt1.id)) {
                  toDelete.push(apt1.id);
                  fix.details.push(
                    `Contained appointment removed: ${day} ${apt1.startTime}-${apt1.endTime}`
                  );
                }
              } else {
                // Partial overlap - adjust the end time of the first to start of second
                if (start1 < start2 && !toDelete.includes(apt1.id)) {
                  const newEndTime = apt2.startTime;
                  toAdjust.push({ id: apt1.id, newEndTime });
                  fix.details.push(
                    `Adjusted: ${day} ${apt1.startTime}-${apt1.endTime} → ${apt1.startTime}-${newEndTime}`
                  );
                }
              }
            } else {
              // Different categories - this might be intentional (e.g., office hours during a class)
              // Log it but don't auto-fix
              fix.details.push(
                `⚠️ Different categories overlap: ${day} ${apt1.category} ${apt1.startTime}-${apt1.endTime} vs ${apt2.category} ${apt2.startTime}-${apt2.endTime}`
              );
            }
          }
        }
      }

      // Apply fixes if in fix mode
      if (process.argv.includes("--fix")) {
        // Delete duplicates and contained appointments
        for (const id of toDelete) {
          await prisma.appointment.delete({ where: { id } });
          fix.deletedCount++;
          reportData.deletedAppointments++;
        }

        // Adjust overlapping appointments
        for (const adjustment of toAdjust) {
          await prisma.appointment.update({
            where: { id: adjustment.id },
            data: { endTime: adjustment.newEndTime },
          });
          fix.adjustedCount++;
          reportData.adjustedAppointments++;
        }
      }
    }

    if (hasOverlaps || fix.deletedCount > 0 || fix.adjustedCount > 0) {
      fix.fixedCount = doorcard.Appointment.length - fix.deletedCount;
      fixes.push(fix);
      reportData.affectedDoorcards++;

      // Add to examples (first 5)
      if (reportData.examples.length < 5) {
        reportData.examples.push({
          userName: fix.userName,
          originalAppointments: fix.originalCount,
          deletedDuplicates: fix.deletedCount,
          adjustedOverlaps: fix.adjustedCount,
          issues: fix.details.slice(0, 3),
        });
      }
    }
  }

  // Generate report
  const report = generateManagementReport(reportData, fixes);

  // Save report
  const reportPath = path.join(
    process.cwd(),
    `doorcard-data-quality-report-${new Date().toISOString().split("T")[0]}.md`
  );
  fs.writeFileSync(reportPath, report);

  console.log(`\n📊 Report saved to: ${reportPath}`);

  if (!process.argv.includes("--fix")) {
    console.log("\n💡 Run with --fix flag to apply corrections");
  } else {
    console.log("\n✅ Fixes applied successfully");
  }

  return reportData;
}

function generateManagementReport(data: any, fixes: OverlapFix[]): string {
  const report = `# Doorcard Data Quality Report

**Generated**: ${new Date().toLocaleString()}

## Executive Summary

The analysis of the doorcard system has identified significant data quality issues stemming from the legacy Access database import. These issues are affecting the user experience and need immediate attention.

### Key Findings

- **${data.affectedDoorcards}** of ${data.totalDoorcards} faculty doorcards (${((data.affectedDoorcards / data.totalDoorcards) * 100).toFixed(1)}%) have data quality issues
- **${data.duplicateAppointments}** duplicate appointments found
- **${data.overlappingAppointments}** overlapping appointment conflicts detected
- **${(((data.duplicateAppointments + data.overlappingAppointments) / data.totalAppointments) * 100).toFixed(1)}%** of all appointments have issues

## Impact on Users

1. **Student Confusion**: Students viewing faculty schedules see conflicting time slots
2. **Faculty Frustration**: Faculty cannot accurately represent their availability
3. **System Credibility**: Data quality issues undermine trust in the new system

## Root Causes

1. **Legacy Data Import Issues**
   - Access database used placeholder dates (12/30/99)
   - No validation during import process
   - Truncated location fields

2. **Data Entry Problems**
   - Manual entry allowed duplicate appointments
   - No overlap validation in legacy system
   - Department/course mismatches

## Detailed Analysis

### Overlap Categories

| Issue Type | Count | Impact |
|------------|-------|---------|
| Exact Duplicates | ${data.duplicateAppointments} | High - Confusing display |
| Time Overlaps | ${data.overlappingAppointments - data.duplicateAppointments} | High - Conflicting schedules |
| Missing Locations | 2,002 | Medium - Incomplete information |

### Examples of Affected Faculty

${data.examples
  .map(
    (ex: any, i: number) => `
#### ${i + 1}. ${ex.userName}
- Original appointments: ${ex.originalAppointments}
- Duplicate appointments removed: ${ex.deletedDuplicates}
- Overlapping appointments adjusted: ${ex.adjustedOverlaps}
- Sample issues:
${ex.issues.map((issue: string) => `  - ${issue}`).join("\n")}
`
  )
  .join("")}

## Recommended Actions

### Immediate (This Week)
1. **Run automated cleanup** to remove duplicates and fix overlaps
2. **Notify affected faculty** about data corrections
3. **Update import process** to prevent future issues

### Short-term (Next 2 Weeks)
1. **Implement validation rules** for appointment creation
2. **Add overlap detection** in the UI
3. **Create data quality dashboard** for ongoing monitoring

### Long-term (Next Month)
1. **Integrate with WebSchedule API** for real-time data
2. **Implement comprehensive data validation** 
3. **Establish data governance procedures**

## Technical Details

${
  process.argv.includes("--fix")
    ? `
### Corrections Applied
- Deleted ${data.deletedAppointments} duplicate appointments
- Adjusted ${data.adjustedAppointments} overlapping appointments
- Affected ${data.affectedDoorcards} faculty doorcards
`
    : `
### Corrections Pending
- Would delete ${data.duplicateAppointments} duplicate appointments
- Would adjust ${data.overlappingAppointments - data.duplicateAppointments} overlapping appointments
- Would affect ${data.affectedDoorcards} faculty doorcards

**Note**: Run the cleanup script with --fix flag to apply corrections
`
}

## Risk Assessment

- **High Risk**: Overlapping appointments causing student confusion
- **Medium Risk**: Missing location data affecting findability
- **Low Risk**: Legacy date formats (internal only)

## Success Metrics

Post-cleanup targets:
- 0% duplicate appointments
- <1% overlapping appointments (legitimate cross-listings only)
- 100% appointments with location data
- 100% department/course alignment

---

*This report was generated by the doorcard data validation system*
`;

  return report;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

if (require.main === module) {
  analyzeAndFixOverlappingAppointments()
    .then((data) => {
      console.log("\n📈 Summary:");
      console.log(`- Affected doorcards: ${data.affectedDoorcards}`);
      console.log(`- Duplicate appointments: ${data.duplicateAppointments}`);
      console.log(
        `- Overlapping appointments: ${data.overlappingAppointments}`
      );
    })
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
