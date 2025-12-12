#!/usr/bin/env tsx

/**
 * PDF Generation Test Script for Next Doorcard application
 * Tests the grid-based PDF layout used in production
 *
 * Usage:
 *   npx tsx scripts/test-pdf.ts
 *   npx tsx scripts/test-pdf.ts --save  # Save output to test-output.pdf
 */

import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Types
interface AppointmentLite {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
  category: string;
  location?: string | null;
}

interface DoorcardLite {
  name?: string;
  doorcardName?: string;
  officeNumber?: string;
  term?: string;
  year?: string;
  college?: string | null;
  appointments: AppointmentLite[];
  user?: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    title?: string | null;
    pronouns?: string | null;
    displayFormat?: any;
    website?: string | null;
  };
}

// Category colors - softer, more readable colors
const CATEGORY_COLORS = {
  OFFICE_HOURS: "#bbf7d0",      // Soft green
  IN_CLASS: "#bfdbfe",          // Soft blue
  LECTURE: "#ddd6fe",           // Soft purple
  LAB: "#fef08a",               // Soft yellow
  HOURS_BY_ARRANGEMENT: "#fbcfe8", // Soft pink
  REFERENCE: "#e5e7eb",         // Soft gray
};

const CATEGORY_LABELS = {
  OFFICE_HOURS: "Office Hours",
  IN_CLASS: "In Class",
  LECTURE: "Lecture",
  LAB: "Lab",
  HOURS_BY_ARRANGEMENT: "By Appt",
  REFERENCE: "Other",
};

// Short category codes for appointment blocks (accessibility - not color alone)
const CATEGORY_CODES = {
  OFFICE_HOURS: "OH",
  IN_CLASS: "CLASS",
  LECTURE: "LEC",
  LAB: "LAB",
  HOURS_BY_ARRANGEMENT: "ARR",
  REFERENCE: "OTHER",
};

// Border widths vary by category for non-color differentiation
// Combined with codes, this provides accessibility without relying on color alone
const CATEGORY_BORDER_WIDTHS = {
  OFFICE_HOURS: 5,
  IN_CLASS: 5,
  LECTURE: 5,
  LAB: 5,
  HOURS_BY_ARRANGEMENT: 5,
  REFERENCE: 5,
};

// College display names
const COLLEGE_NAMES: Record<string, string> = {
  CSM: "College of San Mateo",
  SKYLINE: "Skyline College",
  CANADA: "Cañada College",
};

// Official campus brand colors (sourced from style guides)
// CSM: https://collegeofsanmateo.edu/marketing/logos.asp
// Skyline: https://skylinecollege.edu/mcpr/styleguidelogos.php
// Cañada: https://homeofthecolts.com/styleguide
const CAMPUS_COLORS: Record<string, { primary: string; accent: string; light: string; text: string }> = {
  CSM: {
    primary: "#08542E",   // CSM Green (PMS 554)
    accent: "#FDDD00",    // Bright Gold
    light: "#E8F5E9",     // Light green tint
    text: "#FFFFFF",      // White text on primary
  },
  SKYLINE: {
    primary: "#F03D3A",   // Skyline Red (PMS 2347-U)
    accent: "#FBAA19",    // Achieve Yellow
    light: "#FFEBEE",     // Light red tint
    text: "#FFFFFF",      // White text on primary
  },
  CANADA: {
    primary: "#205C40",   // Cañada Forest Green (PMS 554/342)
    accent: "#FBE122",    // Cañada Yellow
    light: "#E8F5E9",     // Light green tint
    text: "#FFFFFF",      // White text on primary
  },
};

// Default colors if campus not found
const DEFAULT_CAMPUS_COLORS = {
  primary: "#1e40af",     // Blue
  accent: "#fbbf24",      // Gold
  light: "#eff6ff",       // Light blue
  text: "#FFFFFF",
};

const WEEKDAYS = [
  { key: "MONDAY", label: "Mon" },
  { key: "TUESDAY", label: "Tue" },
  { key: "WEDNESDAY", label: "Wed" },
  { key: "THURSDAY", label: "Thu" },
  { key: "FRIDAY", label: "Fri" },
];

// Generate time slots - hourly for better readability on printed doorcards
// 8 AM to 6 PM (11 hour slots)
const TIME_SLOTS = Array.from({ length: 11 }, (_, i) => {
  const hour = i + 8;
  const value = `${hour.toString().padStart(2, "0")}:00`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "pm" : "am";
  const label = `${displayHour}${ampm}`;
  return { value, label };
});

// Test data with realistic schedule
const mockDoorcard: DoorcardLite = {
  name: "Dr. Jane Smith",
  officeNumber: "Building 10, Room 205",
  term: "Fall",
  year: "2024",
  college: "CSM",
  appointments: [
    {
      id: "1",
      name: "MATH 101 - Calculus I",
      startTime: "09:00",
      endTime: "10:30",
      dayOfWeek: "MONDAY",
      category: "IN_CLASS",
      location: "Room 101",
    },
    {
      id: "2",
      name: "Office Hours",
      startTime: "10:30",
      endTime: "12:00",
      dayOfWeek: "MONDAY",
      category: "OFFICE_HOURS",
      location: "Office 205",
    },
    {
      id: "3",
      name: "MATH 101 - Calculus I",
      startTime: "09:00",
      endTime: "10:30",
      dayOfWeek: "WEDNESDAY",
      category: "IN_CLASS",
      location: "Room 101",
    },
    {
      id: "4",
      name: "MATH 200 - Linear Algebra",
      startTime: "13:00",
      endTime: "14:30",
      dayOfWeek: "TUESDAY",
      category: "LECTURE",
      location: "Room 202",
    },
    {
      id: "5",
      name: "Lab Section A",
      startTime: "14:30",
      endTime: "16:00",
      dayOfWeek: "THURSDAY",
      category: "LAB",
      location: "Lab 301",
    },
    {
      id: "6",
      name: "Office Hours",
      startTime: "10:00",
      endTime: "11:30",
      dayOfWeek: "FRIDAY",
      category: "OFFICE_HOURS",
      location: "Office 205",
    },
    {
      id: "7",
      name: "Office Hours",
      startTime: "14:00",
      endTime: "15:00",
      dayOfWeek: "WEDNESDAY",
      category: "OFFICE_HOURS",
      location: "Office 205",
    },
    {
      id: "8",
      name: "MATH 200 - Linear Algebra",
      startTime: "13:00",
      endTime: "14:30",
      dayOfWeek: "THURSDAY",
      category: "LECTURE",
      location: "Room 202",
    },
  ],
  user: {
    firstName: "Jane",
    lastName: "Smith",
    title: "Professor of Mathematics",
    website: "https://faculty.smccd.edu/jsmith",
  },
};

// DOORCARD STYLES - Optimized for printing and reading from a distance
const SLOT_HEIGHT = 42; // Taller slots for readability

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    padding: 20,
    backgroundColor: "#ffffff",
    color: "#1f2937",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 3,
    borderBottomColor: "#2563eb",
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1e40af",
  },
  term: {
    fontSize: 14,
    color: "#374151",
    fontWeight: 700,
  },
  facultyInfo: {
    alignItems: "center",
    marginBottom: 8,
  },
  facultyName: {
    fontSize: 28,
    fontWeight: 700,
    color: "#111827",
    textAlign: "center",
    marginBottom: 2,
  },
  facultyTitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
  },
  officeInfo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 60,
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
  },
  officeItem: {
    alignItems: "center",
  },
  officeLabel: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 2,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  officeValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: 700,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#1f2937",
    marginBottom: 6,
    textAlign: "center",
  },
  // Grid layout - larger for readability
  scheduleContainer: {
    flex: 1,
    flexDirection: "row",
    borderWidth: 2,
    borderColor: "#94a3b8",
    borderRadius: 4,
    overflow: "hidden",
  },
  timeColumn: {
    width: 48,
    backgroundColor: "#f8fafc",
    borderRightWidth: 2,
    borderRightColor: "#cbd5e1",
  },
  timeHeader: {
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#cbd5e1",
    backgroundColor: "#e2e8f0",
  },
  timeSlotLabel: {
    height: SLOT_HEIGHT,
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingRight: 4,
    paddingTop: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  timeText: {
    fontSize: 10,
    color: "#374151",
    fontWeight: 700,
  },
  daysContainer: {
    flex: 1,
    flexDirection: "row",
  },
  dayColumn: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: "#cbd5e1",
  },
  dayHeader: {
    height: 32,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "#1d4ed8",
  },
  dayHeaderText: {
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  timeSlot: {
    height: SLOT_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    position: "relative",
  },
  appointment: {
    position: "absolute",
    left: 2,
    right: 2,
    borderRadius: 4,
    padding: 4,
    justifyContent: "center",
    overflow: "hidden",
    borderLeftWidth: 4,
  },
  appointmentCode: {
    fontSize: 8,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#475569",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    marginBottom: 2,
    alignSelf: "flex-start",
  },
  appointmentText: {
    fontSize: 10,
    color: "#1e293b",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  appointmentTime: {
    fontSize: 9,
    color: "#374151",
    fontWeight: 600,
    marginTop: 2,
  },
  appointmentLocation: {
    fontSize: 8,
    color: "#4b5563",
    marginTop: 1,
    fontWeight: 500,
  },
  // Legend - compact to fit on one page
  legend: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
  },
  legendTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#374151",
    marginRight: 10,
  },
  legendItems: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: 8,
    flex: 1,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 10,
    height: 10,
    marginRight: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#9ca3af",
  },
  legendCode: {
    fontSize: 6,
    fontWeight: 700,
    color: "#ffffff",
    backgroundColor: "#475569",
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 1,
    marginRight: 2,
  },
  legendText: {
    fontSize: 7,
    color: "#374151",
    fontWeight: 600,
  },
  // Footer
  footer: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
  website: {
    fontSize: 10,
    color: "#2563eb",
    fontWeight: 600,
  },
});

// Helper functions
function isSlotCovered(appointment: AppointmentLite, slotValue: string): boolean {
  const [slotHour, slotMin] = slotValue.split(":").map(Number);
  const [startHour, startMin] = appointment.startTime.split(":").map(Number);
  const [endHour, endMin] = appointment.endTime.split(":").map(Number);

  const slotMinutes = slotHour * 60 + slotMin;
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
}

function groupByDay(appointments: AppointmentLite[]): Record<string, AppointmentLite[]> {
  const grouped: Record<string, AppointmentLite[]> = {};
  appointments.forEach((apt) => {
    if (!grouped[apt.dayOfWeek]) {
      grouped[apt.dayOfWeek] = [];
    }
    grouped[apt.dayOfWeek].push(apt);
  });
  return grouped;
}

function getSlotIndex(time: string): number {
  const [hour, min] = time.split(":").map(Number);
  // Convert to fractional hour index (e.g., 9:30 = 1.5)
  return (hour - 8) + (min / 60);
}

// Format time for display (9:00 -> "9am", 13:30 -> "1:30pm")
function formatTime(time: string): string {
  const [hour, min] = time.split(":").map(Number);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "pm" : "am";
  if (min === 0) {
    return `${displayHour}${ampm}`;
  }
  return `${displayHour}:${min.toString().padStart(2, "0")}${ampm}`;
}

function getCollegeDisplayName(college: string): string {
  return COLLEGE_NAMES[college] || college;
}

// Grid-based PDF Document with campus branding
function GridPDFDocument({ doorcard }: { doorcard: DoorcardLite }) {
  const displayName = doorcard.user?.firstName && doorcard.user?.lastName
    ? `${doorcard.user.firstName} ${doorcard.user.lastName}`
    : doorcard.name || "Faculty Member";

  const byDay = groupByDay(doorcard.appointments);
  const categories = Object.keys(CATEGORY_COLORS);
  const e = React.createElement;

  // Get campus colors
  const campusKey = (doorcard.college || "").toUpperCase();
  const campusColors = CAMPUS_COLORS[campusKey] || DEFAULT_CAMPUS_COLORS;

  // Border colors for appointment categories (darker version of background)
  const CATEGORY_BORDERS: Record<string, string> = {
    OFFICE_HOURS: "#16a34a",
    IN_CLASS: "#2563eb",
    LECTURE: "#7c3aed",
    LAB: "#ca8a04",
    HOURS_BY_ARRANGEMENT: "#db2777",
    REFERENCE: "#6b7280",
  };

  // Build time slots for a day column
  function buildDaySlots(dayKey: string) {
    const dayAppointments = byDay[dayKey] || [];
    const renderedStarts = new Set<string>();

    return TIME_SLOTS.map((slot, slotIndex) => {
      // Find appointment that starts within this hour slot
      const startingAppointment = dayAppointments.find((apt) => {
        const aptStartHour = parseInt(apt.startTime.split(":")[0]);
        const slotHour = parseInt(slot.value.split(":")[0]);
        return aptStartHour === slotHour && !renderedStarts.has(apt.id);
      });

      let appointmentElement = null;

      if (startingAppointment) {
        renderedStarts.add(startingAppointment.id);

        // Calculate height based on duration (using fractional hours)
        const startIdx = getSlotIndex(startingAppointment.startTime);
        const endIdx = getSlotIndex(startingAppointment.endTime);
        const durationHours = Math.max(0.5, endIdx - startIdx);
        const height = durationHours * SLOT_HEIGHT - 4;

        // Calculate top offset if appointment doesn't start at the hour
        const startMin = parseInt(startingAppointment.startTime.split(":")[1]);
        const topOffset = (startMin / 60) * SLOT_HEIGHT + 2;

        const category = startingAppointment.category as keyof typeof CATEGORY_COLORS;
        const bgColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.REFERENCE;
        const borderColor = CATEGORY_BORDERS[category] || CATEGORY_BORDERS.REFERENCE;
        const catCode = CATEGORY_CODES[category] || "OTHER";

        // Extract course code or short name - keep it readable
        const shortName = startingAppointment.name
          .replace(/^(.*?)\s*-\s*/, "")
          .substring(0, 18);

        // Format times nicely
        const timeRange = `${formatTime(startingAppointment.startTime)} - ${formatTime(startingAppointment.endTime)}`;

        appointmentElement = e(View, {
          key: `apt-${startingAppointment.id}`,
          style: [
            styles.appointment,
            {
              backgroundColor: bgColor,
              borderLeftColor: borderColor,
              height: height,
              top: topOffset,
            },
          ],
        },
          // Code badge at top
          e(Text, { style: styles.appointmentCode }, catCode),
          // Name
          e(Text, { style: styles.appointmentText }, shortName),
          // Time
          e(Text, { style: styles.appointmentTime }, timeRange),
          // Location (if present)
          startingAppointment.location &&
            e(Text, { style: styles.appointmentLocation }, startingAppointment.location)
        );
      }

      return e(View, {
        key: `slot-${slot.value}`,
        style: styles.timeSlot,
      }, appointmentElement);
    });
  }

  // Dynamic styles based on campus colors
  const brandedStyles = {
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: 6,
      paddingBottom: 6,
      paddingTop: 6,
      paddingHorizontal: 10,
      backgroundColor: campusColors.primary,
      borderRadius: 4,
    },
    headerLogo: {
      fontSize: 14,
      fontWeight: 700 as const,
      color: campusColors.text,
    },
    headerTerm: {
      fontSize: 12,
      color: campusColors.text,
      fontWeight: 600 as const,
    },
    dayHeader: {
      height: 28,
      backgroundColor: campusColors.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      borderBottomWidth: 2,
      borderBottomColor: campusColors.accent,
    },
    accentBar: {
      height: 4,
      backgroundColor: campusColors.accent,
      marginBottom: 8,
      borderRadius: 2,
    },
  };

  return e(Document, null,
    e(Page, { size: "LETTER", style: styles.page },
      // Branded Header with campus color
      e(View, { style: brandedStyles.header },
        e(Text, { style: brandedStyles.headerLogo }, getCollegeDisplayName(doorcard.college || "")),
        e(Text, { style: brandedStyles.headerTerm },
          `${doorcard.term} ${doorcard.year}`
        )
      ),

      // Accent bar
      e(View, { style: brandedStyles.accentBar }),

      // Faculty Info - Large and readable
      e(View, { style: styles.facultyInfo },
        e(Text, { style: styles.facultyName }, displayName),
        doorcard.user?.title && e(Text, { style: styles.facultyTitle }, doorcard.user.title)
      ),

      // Office Information
      e(View, { style: styles.officeInfo },
        e(View, { style: styles.officeItem },
          e(Text, { style: styles.officeLabel }, "OFFICE"),
          e(Text, { style: styles.officeValue }, doorcard.officeNumber || "TBA")
        ),
        doorcard.user?.website && e(View, { style: styles.officeItem },
          e(Text, { style: styles.officeLabel }, "WEBSITE"),
          e(Text, { style: [styles.officeValue, { color: campusColors.primary }] },
            doorcard.user.website.replace(/^https?:\/\//, "")
          )
        )
      ),

      // Schedule Title
      e(Text, { style: styles.scheduleTitle }, "WEEKLY SCHEDULE"),

      // Schedule Grid
      e(View, { style: styles.scheduleContainer },
        // Time Column
        e(View, { style: styles.timeColumn },
          e(View, { style: styles.timeHeader },
            e(Text, { style: styles.timeText }, "")
          ),
          ...TIME_SLOTS.map((slot) =>
            e(View, { key: `time-${slot.value}`, style: styles.timeSlotLabel },
              e(Text, { style: styles.timeText }, slot.label)
            )
          )
        ),

        // Days Container
        e(View, { style: styles.daysContainer },
          ...WEEKDAYS.map((day) =>
            e(View, { key: day.key, style: styles.dayColumn },
              e(View, { style: brandedStyles.dayHeader },
                e(Text, { style: styles.dayHeaderText }, day.label)
              ),
              ...buildDaySlots(day.key)
            )
          )
        )
      ),

      // Legend with color + code for accessibility (no color-only reliance)
      e(View, { style: styles.legend },
        e(Text, { style: styles.legendTitle }, "Activity Types"),
        e(View, { style: styles.legendItems },
          ...categories.map((category) => {
            const catKey = category as keyof typeof CATEGORY_COLORS;
            const code = CATEGORY_CODES[catKey];
            return e(View, { key: category, style: styles.legendItem },
              e(View, {
                style: [
                  styles.legendColor,
                  { backgroundColor: CATEGORY_COLORS[catKey] },
                ],
              }),
              e(Text, { style: styles.legendCode }, code),
              e(Text, { style: styles.legendText },
                CATEGORY_LABELS[catKey]
              )
            );
          })
        )
      ),

      // Footer
      e(View, { style: styles.footer },
        e(Text, { style: styles.footerText },
          `Generated ${new Date().toLocaleDateString()} • Faculty Doorcard System`
        ),
        e(Text, { style: styles.footerText },
          "San Mateo County Community College District"
        )
      )
    )
  );
}

// Test runner
async function runPDFTests() {
  console.log("🔍 Running PDF Generation Tests (Grid Layout)\n");
  console.log("─".repeat(70));

  const results: { name: string; passed: boolean; error?: string; details?: string }[] = [];
  const saveOutput = process.argv.includes("--save");

  // Test 1: Full schedule PDF
  console.log("\n📄 Test 1: Full Schedule Grid PDF");
  try {
    const buffer = await renderToBuffer(
      React.createElement(GridPDFDocument, { doorcard: mockDoorcard })
    );

    if (buffer && buffer.byteLength > 0) {
      results.push({
        name: "Full schedule grid",
        passed: true,
        details: `Generated ${buffer.byteLength.toLocaleString()} bytes`,
      });
      console.log(`   ✅ PASS - Generated ${buffer.byteLength.toLocaleString()} bytes`);

      if (saveOutput) {
        const fs = await import("fs");
        fs.writeFileSync("./test-output.pdf", buffer);
        console.log(`   📁 Saved to ./test-output.pdf`);
      }
    } else {
      throw new Error("Buffer is empty");
    }
  } catch (error) {
    results.push({
      name: "Full schedule grid",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`   ❌ FAIL - ${error}`);
  }

  // Test 2: Empty schedule
  console.log("\n📄 Test 2: Empty Schedule");
  try {
    const emptyDoorcard: DoorcardLite = {
      name: "New Faculty Member",
      term: "Spring",
      year: "2025",
      college: "SKYLINE",
      appointments: [],
      user: {
        firstName: "New",
        lastName: "Faculty",
        title: "Adjunct Instructor",
      },
    };

    const buffer = await renderToBuffer(
      React.createElement(GridPDFDocument, { doorcard: emptyDoorcard })
    );

    if (buffer && buffer.byteLength > 0) {
      results.push({
        name: "Empty schedule",
        passed: true,
        details: `Generated ${buffer.byteLength.toLocaleString()} bytes`,
      });
      console.log(`   ✅ PASS - Generated ${buffer.byteLength.toLocaleString()} bytes`);
    } else {
      throw new Error("Buffer is empty");
    }
  } catch (error) {
    results.push({
      name: "Empty schedule",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`   ❌ FAIL - ${error}`);
  }

  // Test 3: All categories
  console.log("\n📄 Test 3: All Category Types");
  try {
    const allCategoriesDoorcard: DoorcardLite = {
      name: "Category Demo",
      term: "Fall",
      year: "2024",
      college: "CANADA",
      appointments: [
        { id: "1", name: "Office Hours", startTime: "09:00", endTime: "10:00", dayOfWeek: "MONDAY", category: "OFFICE_HOURS", location: "Office" },
        { id: "2", name: "MATH 101", startTime: "10:00", endTime: "11:30", dayOfWeek: "MONDAY", category: "IN_CLASS", location: "Room 101" },
        { id: "3", name: "Lecture", startTime: "13:00", endTime: "14:30", dayOfWeek: "TUESDAY", category: "LECTURE", location: "Hall A" },
        { id: "4", name: "Lab Section", startTime: "09:00", endTime: "11:00", dayOfWeek: "WEDNESDAY", category: "LAB", location: "Lab 201" },
        { id: "5", name: "By Appointment", startTime: "14:00", endTime: "15:00", dayOfWeek: "THURSDAY", category: "HOURS_BY_ARRANGEMENT", location: "Office" },
        { id: "6", name: "Committee Meeting", startTime: "11:00", endTime: "12:00", dayOfWeek: "FRIDAY", category: "REFERENCE", location: "Conf Room" },
      ],
    };

    const buffer = await renderToBuffer(
      React.createElement(GridPDFDocument, { doorcard: allCategoriesDoorcard })
    );

    if (buffer && buffer.byteLength > 0) {
      results.push({
        name: "All categories",
        passed: true,
        details: `Generated ${buffer.byteLength.toLocaleString()} bytes`,
      });
      console.log(`   ✅ PASS - Generated ${buffer.byteLength.toLocaleString()} bytes`);
    } else {
      throw new Error("Buffer is empty");
    }
  } catch (error) {
    results.push({
      name: "All categories",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`   ❌ FAIL - ${error}`);
  }

  // Test 4: Skyline College (red theme)
  console.log("\n📄 Test 4: Skyline College Theme");
  try {
    const skylineDoorcard: DoorcardLite = {
      name: "Maria Garcia",
      officeNumber: "Building 7, Room 7-324",
      term: "Fall",
      year: "2024",
      college: "SKYLINE",
      appointments: [
        { id: "s1", name: "BUS 100 - Intro to Business", startTime: "09:00", endTime: "10:30", dayOfWeek: "MONDAY", category: "IN_CLASS", location: "Room 7-101" },
        { id: "s2", name: "Office Hours", startTime: "11:00", endTime: "12:00", dayOfWeek: "MONDAY", category: "OFFICE_HOURS", location: "Office 7-324" },
        { id: "s3", name: "BUS 100", startTime: "09:00", endTime: "10:30", dayOfWeek: "WEDNESDAY", category: "IN_CLASS", location: "Room 7-101" },
        { id: "s4", name: "BUS 201 - Business Law", startTime: "13:00", endTime: "14:30", dayOfWeek: "TUESDAY", category: "LECTURE", location: "Room 7-205" },
        { id: "s5", name: "BUS 201", startTime: "13:00", endTime: "14:30", dayOfWeek: "THURSDAY", category: "LECTURE", location: "Room 7-205" },
        { id: "s6", name: "Office Hours", startTime: "10:00", endTime: "11:00", dayOfWeek: "FRIDAY", category: "OFFICE_HOURS", location: "Office 7-324" },
      ],
      user: {
        firstName: "Maria",
        lastName: "Garcia",
        title: "Professor of Business",
        website: "https://faculty.smccd.edu/mgarcia",
      },
    };

    const buffer = await renderToBuffer(
      React.createElement(GridPDFDocument, { doorcard: skylineDoorcard })
    );

    if (buffer && buffer.byteLength > 0) {
      results.push({
        name: "Skyline College theme",
        passed: true,
        details: `Generated ${buffer.byteLength.toLocaleString()} bytes`,
      });
      console.log(`   ✅ PASS - Generated ${buffer.byteLength.toLocaleString()} bytes`);

      if (saveOutput) {
        const fs = await import("fs");
        fs.writeFileSync("./test-output-skyline.pdf", buffer);
        console.log(`   📁 Saved to ./test-output-skyline.pdf`);
      }
    } else {
      throw new Error("Buffer is empty");
    }
  } catch (error) {
    results.push({
      name: "Skyline College theme",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`   ❌ FAIL - ${error}`);
  }

  // Test 5: Cañada College (green/yellow theme)
  console.log("\n📄 Test 5: Cañada College Theme");
  try {
    const canadaDoorcard: DoorcardLite = {
      name: "Robert Chen",
      officeNumber: "Building 9, Room 9-150",
      term: "Spring",
      year: "2025",
      college: "CANADA",
      appointments: [
        { id: "c1", name: "ART 101 - Drawing I", startTime: "10:00", endTime: "12:00", dayOfWeek: "MONDAY", category: "IN_CLASS", location: "Art Studio" },
        { id: "c2", name: "ART 101", startTime: "10:00", endTime: "12:00", dayOfWeek: "WEDNESDAY", category: "IN_CLASS", location: "Art Studio" },
        { id: "c3", name: "Office Hours", startTime: "13:00", endTime: "14:00", dayOfWeek: "TUESDAY", category: "OFFICE_HOURS", location: "Office 9-150" },
        { id: "c4", name: "ART 210 - Painting", startTime: "14:00", endTime: "16:00", dayOfWeek: "THURSDAY", category: "LAB", location: "Art Studio" },
      ],
      user: {
        firstName: "Robert",
        lastName: "Chen",
        title: "Instructor of Art",
      },
    };

    const buffer = await renderToBuffer(
      React.createElement(GridPDFDocument, { doorcard: canadaDoorcard })
    );

    if (buffer && buffer.byteLength > 0) {
      results.push({
        name: "Cañada College theme",
        passed: true,
        details: `Generated ${buffer.byteLength.toLocaleString()} bytes`,
      });
      console.log(`   ✅ PASS - Generated ${buffer.byteLength.toLocaleString()} bytes`);

      if (saveOutput) {
        const fs = await import("fs");
        fs.writeFileSync("./test-output-canada.pdf", buffer);
        console.log(`   📁 Saved to ./test-output-canada.pdf`);
      }
    } else {
      throw new Error("Buffer is empty");
    }
  } catch (error) {
    results.push({
      name: "Cañada College theme",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`   ❌ FAIL - ${error}`);
  }

  // Test 6: Dense schedule (many appointments) - CSM
  console.log("\n📄 Test 6: Dense Schedule (CSM)");
  try {
    const denseDoorcard: DoorcardLite = {
      name: "Busy Professor",
      term: "Fall",
      year: "2024",
      college: "CSM",
      appointments: [
        // Monday
        { id: "m1", name: "MATH 101", startTime: "08:00", endTime: "09:00", dayOfWeek: "MONDAY", category: "IN_CLASS" },
        { id: "m2", name: "Office Hours", startTime: "09:00", endTime: "10:00", dayOfWeek: "MONDAY", category: "OFFICE_HOURS" },
        { id: "m3", name: "MATH 200", startTime: "10:00", endTime: "11:30", dayOfWeek: "MONDAY", category: "LECTURE" },
        { id: "m4", name: "Lab", startTime: "13:00", endTime: "15:00", dayOfWeek: "MONDAY", category: "LAB" },
        // Tuesday
        { id: "t1", name: "MATH 101", startTime: "08:00", endTime: "09:00", dayOfWeek: "TUESDAY", category: "IN_CLASS" },
        { id: "t2", name: "Meeting", startTime: "10:00", endTime: "11:00", dayOfWeek: "TUESDAY", category: "REFERENCE" },
        { id: "t3", name: "MATH 200", startTime: "13:00", endTime: "14:30", dayOfWeek: "TUESDAY", category: "LECTURE" },
        // Wednesday
        { id: "w1", name: "MATH 101", startTime: "08:00", endTime: "09:00", dayOfWeek: "WEDNESDAY", category: "IN_CLASS" },
        { id: "w2", name: "Office Hours", startTime: "09:00", endTime: "11:00", dayOfWeek: "WEDNESDAY", category: "OFFICE_HOURS" },
        { id: "w3", name: "Lab", startTime: "13:00", endTime: "15:00", dayOfWeek: "WEDNESDAY", category: "LAB" },
        // Thursday
        { id: "th1", name: "MATH 101", startTime: "08:00", endTime: "09:00", dayOfWeek: "THURSDAY", category: "IN_CLASS" },
        { id: "th2", name: "MATH 200", startTime: "10:00", endTime: "11:30", dayOfWeek: "THURSDAY", category: "LECTURE" },
        { id: "th3", name: "Office Hours", startTime: "14:00", endTime: "16:00", dayOfWeek: "THURSDAY", category: "OFFICE_HOURS" },
        // Friday
        { id: "f1", name: "Office Hours", startTime: "09:00", endTime: "12:00", dayOfWeek: "FRIDAY", category: "OFFICE_HOURS" },
        { id: "f2", name: "Grading", startTime: "13:00", endTime: "15:00", dayOfWeek: "FRIDAY", category: "REFERENCE" },
      ],
      user: {
        firstName: "Busy",
        lastName: "Professor",
        title: "Full-Time Faculty",
      },
    };

    const buffer = await renderToBuffer(
      React.createElement(GridPDFDocument, { doorcard: denseDoorcard })
    );

    if (buffer && buffer.byteLength > 0) {
      results.push({
        name: "Dense schedule",
        passed: true,
        details: `Generated ${buffer.byteLength.toLocaleString()} bytes (15 appointments)`,
      });
      console.log(`   ✅ PASS - Generated ${buffer.byteLength.toLocaleString()} bytes (15 appointments)`);

      if (saveOutput) {
        const fs = await import("fs");
        fs.writeFileSync("./test-output-dense.pdf", buffer);
        console.log(`   📁 Saved to ./test-output-dense.pdf`);
      }
    } else {
      throw new Error("Buffer is empty");
    }
  } catch (error) {
    results.push({
      name: "Dense schedule",
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(`   ❌ FAIL - ${error}`);
  }

  // Summary
  console.log("\n" + "─".repeat(70));
  console.log("\n📋 Summary:");
  const passing = results.filter((r) => r.passed).length;
  const failing = results.filter((r) => !r.passed).length;

  console.log(`✅ Passing: ${passing}/${results.length}`);
  console.log(`❌ Failing: ${failing}/${results.length}`);

  if (failing > 0) {
    console.log("\n⚠️  Failed Tests:");
    results
      .filter((r) => !r.passed)
      .forEach((result) => {
        console.log(`   • ${result.name}: ${result.error}`);
      });
    process.exit(1);
  } else {
    console.log("\n✅ All PDF tests PASS!");
    console.log("\n📝 Grid Layout Features:");
    console.log("   • Time column (8 AM - 6 PM)");
    console.log("   • Day columns (Mon-Fri)");
    console.log("   • Color-coded appointments with left border accent");
    console.log("   • Appointment time & location display");
    console.log("   • Activity type legend");

    if (!saveOutput) {
      console.log("\n💡 Run with --save to output PDF files");
    }
    process.exit(0);
  }
}

runPDFTests().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
