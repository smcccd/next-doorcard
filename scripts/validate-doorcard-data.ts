#!/usr/bin/env npx tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DataIssue {
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  affectedCount: number;
  examples: any[];
}

async function validateDoorcardData() {
  console.log("🔍 Validating doorcard data integrity...\n");

  const issues: DataIssue[] = [];

  // 1. Check for department/course mismatches
  console.log("Checking for department/course mismatches...");
  const doorcardWithCourses = await prisma.doorcard.findMany({
    where: {
      isActive: true,
      term: "FALL",
      year: 2025,
    },
    include: {
      User: true,
      Appointment: {
        where: {
          category: "IN_CLASS",
        },
      },
    },
  });

  const departmentMismatches: any[] = [];

  doorcardWithCourses.forEach((doorcard) => {
    // Extract department from doorcard name (after the dash)
    const nameParts = doorcard.doorcardName.split(" - ");
    const listedDepartment = nameParts[1]?.trim();

    if (listedDepartment && doorcard.Appointment.length > 0) {
      // Check if any course codes don't match the department
      const courseCodes = new Set<string>();
      doorcard.Appointment.forEach((apt) => {
        // Extract course codes from location field
        const match = apt.location?.match(/^([A-Z]+)\s+\d+/);
        if (match) {
          courseCodes.add(match[1]);
        }
      });

      // Check for specific known mismatches
      if (
        listedDepartment === "Paralegal" &&
        Array.from(courseCodes).some((code) => code === "ACTG")
      ) {
        departmentMismatches.push({
          user: doorcard.User.name,
          listedDepartment,
          actualCourses: Array.from(courseCodes),
          doorcard: doorcard.doorcardName,
        });
      }
    }
  });

  if (departmentMismatches.length > 0) {
    issues.push({
      type: "Department/Course Mismatch",
      severity: "medium",
      description:
        "Faculty listed under one department but teaching courses from another",
      affectedCount: departmentMismatches.length,
      examples: departmentMismatches.slice(0, 3),
    });
  }

  // 2. Check for overlapping appointments
  console.log("Checking for overlapping appointments...");
  const overlappingIssues: any[] = [];

  for (const doorcard of doorcardWithCourses) {
    const appointmentsByDay = new Map<string, any[]>();

    // Group appointments by day
    doorcard.Appointment.forEach((apt) => {
      const day = apt.dayOfWeek;
      if (!appointmentsByDay.has(day)) {
        appointmentsByDay.set(day, []);
      }
      appointmentsByDay.get(day)!.push(apt);
    });

    // Check for overlaps within each day
    for (const [day, appointments] of appointmentsByDay) {
      for (let i = 0; i < appointments.length; i++) {
        for (let j = i + 1; j < appointments.length; j++) {
          const apt1 = appointments[i];
          const apt2 = appointments[j];

          // Convert times to minutes for comparison
          const start1 = timeToMinutes(apt1.startTime);
          const end1 = timeToMinutes(apt1.endTime);
          const start2 = timeToMinutes(apt2.startTime);
          const end2 = timeToMinutes(apt2.endTime);

          // Check for overlap
          if (start1 < end2 && end1 > start2) {
            overlappingIssues.push({
              user: doorcard.User.name,
              day,
              appointment1: `${apt1.category} ${apt1.startTime}-${apt1.endTime} ${apt1.location || ""}`,
              appointment2: `${apt2.category} ${apt2.startTime}-${apt2.endTime} ${apt2.location || ""}`,
            });
          }
        }
      }
    }
  }

  if (overlappingIssues.length > 0) {
    issues.push({
      type: "Overlapping Appointments",
      severity: "high",
      description: "Appointments scheduled at the same time",
      affectedCount: overlappingIssues.length,
      examples: overlappingIssues.slice(0, 3),
    });
  }

  // 3. Check for suspicious time patterns (legacy data often has specific patterns)
  console.log("Checking for suspicious time patterns...");
  const suspiciousTimes = await prisma.appointment.findMany({
    where: {
      OR: [{ startTime: "00:00" }, { endTime: "23:59" }],
      Doorcard: {
        isActive: true,
        term: "FALL",
        year: 2025,
      },
    },
    include: {
      Doorcard: {
        include: {
          User: true,
        },
      },
    },
  });

  if (suspiciousTimes.length > 0) {
    issues.push({
      type: "Suspicious Time Patterns",
      severity: "medium",
      description:
        "Appointments with unusual start/end times that may indicate data import issues",
      affectedCount: suspiciousTimes.length,
      examples: suspiciousTimes.slice(0, 3).map((apt) => ({
        user: apt.Doorcard.User.name,
        times: `${apt.startTime} - ${apt.endTime}`,
        day: apt.dayOfWeek,
      })),
    });
  }

  // 4. Check for incomplete location data
  console.log("Checking for incomplete location data...");
  const incompleteLocations = await prisma.appointment.findMany({
    where: {
      OR: [
        { location: { endsWith: " at" } },
        { location: { contains: "Office Bus" } },
        { location: null },
      ],
      Doorcard: {
        isActive: true,
        term: "FALL",
        year: 2025,
      },
    },
    include: {
      Doorcard: {
        include: {
          User: true,
        },
      },
    },
  });

  if (incompleteLocations.length > 0) {
    issues.push({
      type: "Incomplete Location Data",
      severity: "medium",
      description:
        "Appointments with truncated or unclear location information",
      affectedCount: incompleteLocations.length,
      examples: incompleteLocations.slice(0, 3).map((apt) => ({
        user: apt.Doorcard.User.name,
        location: apt.location,
        category: apt.category,
      })),
    });
  }

  // Generate report
  console.log("\n📊 DATA VALIDATION REPORT\n");
  console.log("=".repeat(60));

  if (issues.length === 0) {
    console.log("✅ No data integrity issues found!");
  } else {
    console.log(`Found ${issues.length} types of data issues:\n`);

    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}`);
      console.log(`   Severity: ${issue.severity.toUpperCase()}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Affected records: ${issue.affectedCount}`);

      if (issue.examples.length > 0) {
        console.log(`   Examples:`);
        issue.examples.forEach((example, i) => {
          console.log(
            `   ${i + 1}.`,
            JSON.stringify(example, null, 2).split("\n").join("\n      ")
          );
        });
      }
      console.log();
    });

    // Summary
    const highSeverity = issues.filter((i) => i.severity === "high").length;
    const mediumSeverity = issues.filter((i) => i.severity === "medium").length;
    const lowSeverity = issues.filter((i) => i.severity === "low").length;

    console.log("SUMMARY:");
    console.log(`- High severity issues: ${highSeverity}`);
    console.log(`- Medium severity issues: ${mediumSeverity}`);
    console.log(`- Low severity issues: ${lowSeverity}`);

    console.log("\nRECOMMENDATIONS:");
    if (highSeverity > 0) {
      console.log(
        "⚠️  Address high severity issues immediately - these affect user experience"
      );
    }
    if (mediumSeverity > 0) {
      console.log("📝 Review medium severity issues - these may confuse users");
    }
    if (lowSeverity > 0) {
      console.log(
        "📌 Low severity issues can be addressed during routine maintenance"
      );
    }
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

if (require.main === module) {
  validateDoorcardData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
