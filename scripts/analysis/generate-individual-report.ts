#!/usr/bin/env npx tsx

import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function generateIndividualReport(userName: string) {
  const user = await prisma.user.findFirst({
    where: { name: { contains: userName } },
    include: {
      Doorcard: {
        where: {
          term: "FALL",
          year: 2025,
        },
        include: {
          Appointment: {
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      },
    },
  });

  if (!user || !user.Doorcard[0]) {
    console.log(`User ${userName} not found`);
    return;
  }

  const doorcard = user.Doorcard[0];

  // Analyze the data
  const analysis = {
    totalAppointments: doorcard.Appointment.length,
    duplicates: 0,
    overlaps: 0,
    missingLocations: 0,
    byCategory: {} as Record<string, number>,
    byDay: {} as Record<string, any[]>,
    issues: [] as string[],
  };

  // Group by day and analyze
  doorcard.Appointment.forEach((apt) => {
    // Count by category
    analysis.byCategory[apt.category] =
      (analysis.byCategory[apt.category] || 0) + 1;

    // Check missing locations
    if (!apt.location || apt.location.trim() === "") {
      analysis.missingLocations++;
    }

    // Group by day
    if (!analysis.byDay[apt.dayOfWeek]) {
      analysis.byDay[apt.dayOfWeek] = [];
    }
    analysis.byDay[apt.dayOfWeek].push(apt);
  });

  // Find duplicates and overlaps
  Object.entries(analysis.byDay).forEach(([day, apts]) => {
    const seen = new Set<string>();

    apts.forEach((apt, i) => {
      const key = `${apt.startTime}-${apt.endTime}-${apt.category}-${apt.location || ""}`;

      if (seen.has(key)) {
        analysis.duplicates++;
        analysis.issues.push(
          `Duplicate: ${day} ${apt.startTime}-${apt.endTime} ${apt.category}`
        );
      } else {
        seen.add(key);
      }

      // Check overlaps
      for (let j = i + 1; j < apts.length; j++) {
        const other = apts[j];
        const start1 = timeToMinutes(apt.startTime);
        const end1 = timeToMinutes(apt.endTime);
        const start2 = timeToMinutes(other.startTime);
        const end2 = timeToMinutes(other.endTime);

        if (start1 < end2 && end1 > start2) {
          analysis.overlaps++;
          if (analysis.issues.length < 20) {
            // Limit issues shown
            analysis.issues.push(
              `Overlap: ${day} ${apt.startTime}-${apt.endTime} conflicts with ${other.startTime}-${other.endTime}`
            );
          }
        }
      }
    });
  });

  // Generate report
  const report = `# Individual Faculty Data Quality Report: ${user.name}

**Generated**: ${new Date().toLocaleString()}

## Faculty Information
- **Name**: ${user.name}
- **Username**: ${user.username}
- **Email**: ${user.email}
- **Doorcard Title**: ${doorcard.doorcardName}
- **Office**: ${doorcard.officeNumber}
- **Term**: ${doorcard.term} ${doorcard.year}

## Data Quality Summary

### Critical Issues Found
- **Total Appointments**: ${analysis.totalAppointments}
- **Duplicate Appointments**: ${analysis.duplicates} (${((analysis.duplicates / analysis.totalAppointments) * 100).toFixed(1)}%)
- **Overlapping Conflicts**: ${analysis.overlaps}
- **Missing Location Data**: ${analysis.missingLocations}

### Appointment Distribution
${Object.entries(analysis.byCategory)
  .map(([cat, count]) => `- ${cat}: ${count} appointments`)
  .join("\n")}

### Schedule by Day
${Object.entries(analysis.byDay)
  .map(([day, apts]) => `- ${day}: ${apts.length} appointments`)
  .join("\n")}

## Visual Schedule Analysis

${Object.entries(analysis.byDay)
  .map(([day, apts]) => {
    const sorted = [...apts].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );
    return `### ${day}
${sorted
  .map(
    (apt) =>
      `- ${apt.startTime}-${apt.endTime} **${apt.category}** ${apt.location || "*(No location)*"}`
  )
  .join("\n")}`;
  })
  .join("\n\n")}

## Specific Issues Identified

${analysis.issues
  .slice(0, 20)
  .map((issue, i) => `${i + 1}. ${issue}`)
  .join("\n")}
${analysis.issues.length > 20 ? `\n... and ${analysis.issues.length - 20} more issues` : ""}

## Impact Assessment

### Student Experience
- Students see ${analysis.duplicates} duplicate time slots
- ${analysis.overlaps} conflicting appointments make it impossible to determine actual availability
- ${analysis.missingLocations} appointments lack location information

### Data Integrity Score
- **Overall Score**: ${Math.max(0, 100 - (analysis.duplicates + analysis.overlaps / 10 + analysis.missingLocations)).toFixed(0)}/100
- **Severity**: ${analysis.overlaps > 100 ? "CRITICAL" : analysis.overlaps > 50 ? "HIGH" : "MEDIUM"}

## Recommended Actions

1. **Immediate**: Remove ${analysis.duplicates} duplicate appointments
2. **Urgent**: Resolve ${analysis.overlaps} scheduling conflicts
3. **Important**: Add location data to ${analysis.missingLocations} appointments
4. **Review**: Verify department designation (currently listed as "${doorcard.doorcardName.split(" - ")[1]}")

---
*This report highlights data quality issues for review and correction*
`;

  // Save report
  const fileName = `individual-report-${user.username}-${new Date().toISOString().split("T")[0]}.md`;
  fs.writeFileSync(fileName, report);
  console.log(`Report saved to: ${fileName}`);

  return analysis;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Get username from command line or default to Judith Miller
const userName = process.argv[2] || "Judith Miller";

generateIndividualReport(userName)
  .then((analysis) => {
    if (analysis) {
      console.log("\nSummary:");
      console.log(`- Duplicates: ${analysis.duplicates}`);
      console.log(`- Overlaps: ${analysis.overlaps}`);
      console.log(`- Missing locations: ${analysis.missingLocations}`);
    }
  })
  .catch(console.error)
  .finally(() => prisma.$disconnect());
