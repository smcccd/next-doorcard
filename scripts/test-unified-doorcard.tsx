import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UnifiedDoorcard } from "../components/UnifiedDoorcard";

// Mock data without weekend appointments
const mockDoorcardWeekdaysOnly = {
  name: "Test Faculty",
  officeNumber: "ITS-101",
  term: "Fall",
  year: "2025",
  college: "CSM",
  appointments: [
    {
      id: "1",
      name: "CS 101 - Programming",
      startTime: "09:00",
      endTime: "10:30",
      dayOfWeek: "MONDAY" as const,
      category: "LECTURE" as const,
      location: "Room 123",
    },
    {
      id: "2",
      name: "MATH 101 - Calculus",
      startTime: "10:15",
      endTime: "11:00",
      dayOfWeek: "WEDNESDAY" as const,
      category: "LECTURE" as const,
      location: "Room 456",
    },
    {
      id: "3",
      name: "Office Hours",
      startTime: "14:00",
      endTime: "15:30",
      dayOfWeek: "FRIDAY" as const,
      category: "OFFICE_HOURS" as const,
      location: "ITS-101",
    },
  ],
  user: {
    name: "Test Faculty",
    firstName: "Test",
    lastName: "Faculty",
    title: "Professor",
    pronouns: null,
    displayFormat: null,
    website: null,
  },
};

// Mock data WITH weekend appointments
const mockDoorcardWithWeekends = {
  ...mockDoorcardWeekdaysOnly,
  appointments: [
    ...mockDoorcardWeekdaysOnly.appointments,
    {
      id: "4",
      name: "Saturday Study Group",
      startTime: "10:00",
      endTime: "12:00",
      dayOfWeek: "SATURDAY" as const,
      category: "REFERENCE" as const,
      location: "Library",
    },
  ],
};

function testUnifiedDoorcard() {
  console.log("🧪 Testing UnifiedDoorcard weekend logic...\n");

  try {
    console.log("📋 Test 1: Weekdays only (should show 5 columns)");
    const html1 = renderToStaticMarkup(
      React.createElement(UnifiedDoorcard, {
        doorcard: mockDoorcardWeekdaysOnly,
        showWeekendDays: false,
        containerId: "test-1",
      })
    );

    const hasSaturday1 = html1.includes("Saturday");
    const hasSunday1 = html1.includes("Sunday");
    const hasMonday1 = html1.includes("Monday");

    console.log(`  Contains Saturday: ${hasSaturday1}`);
    console.log(`  Contains Sunday: ${hasSunday1}`);
    console.log(`  Contains Monday: ${hasMonday1}`);
    console.log(`  ✅ Expected: Saturday=false, Sunday=false, Monday=true\n`);

    console.log("📋 Test 2: With weekend appointments (should show 7 columns)");
    const html2 = renderToStaticMarkup(
      React.createElement(UnifiedDoorcard, {
        doorcard: mockDoorcardWithWeekends,
        showWeekendDays: false,
        containerId: "test-2",
      })
    );

    const hasSaturday2 = html2.includes("Saturday");
    const hasSunday2 = html2.includes("Sunday");
    const hasMonday2 = html2.includes("Monday");

    console.log(`  Contains Saturday: ${hasSaturday2}`);
    console.log(`  Contains Sunday: ${hasSunday2}`);
    console.log(`  Contains Monday: ${hasMonday2}`);
    console.log(`  ✅ Expected: Saturday=true, Sunday=true, Monday=true\n`);

    if (
      !hasSaturday1 &&
      !hasSunday1 &&
      hasMonday1 &&
      hasSaturday2 &&
      hasSunday2 &&
      hasMonday2
    ) {
      console.log("🎉 SUCCESS: Weekend logic is working correctly!");
    } else {
      console.log("❌ ISSUE: Weekend logic is not working as expected");
    }
  } catch (error) {
    console.log("❌ Error testing component:", error);
  }
}

testUnifiedDoorcard();
