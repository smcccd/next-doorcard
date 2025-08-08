import { PrismaClient } from "@prisma/client";
import { UnifiedDoorcard } from "../components/UnifiedDoorcard";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const prisma = new PrismaClient();

async function testCalendarFix() {
  console.log(
    "🧪 Testing calendar rendering fix for off-hours appointments...\n"
  );

  // Get the test doorcard data
  const doorcard = await prisma.doorcard.findUnique({
    where: { id: "off-hours-test-doorcard" },
    include: {
      Appointment: true,
      User: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          title: true,
          pronouns: true,
          displayFormat: true,
          college: true,
          website: true,
        },
      },
    },
  });

  if (!doorcard) {
    console.log("❌ Test doorcard not found. Run the seed script first.");
    return;
  }

  console.log(
    "📋 Found doorcard with",
    doorcard.Appointment.length,
    "appointments:"
  );

  // List all appointments and categorize them
  const offHourAppointments = [];
  const regularAppointments = [];

  doorcard.Appointment.forEach((apt) => {
    const [hours, minutes] = apt.startTime.split(":").map(Number);
    const isOffHour = minutes !== 0 && minutes !== 30;

    console.log(
      `  • ${apt.name}: ${apt.startTime}-${apt.endTime} (${apt.dayOfWeek}) ${isOffHour ? "[OFF-HOUR]" : "[REGULAR]"}`
    );

    if (isOffHour) {
      offHourAppointments.push(apt);
    } else {
      regularAppointments.push(apt);
    }
  });

  console.log(
    `\n📊 Summary: ${offHourAppointments.length} off-hour appointments, ${regularAppointments.length} regular appointments\n`
  );

  if (offHourAppointments.length === 0) {
    console.log("⚠️  No off-hour appointments found to test!");
    return;
  }

  // Transform data to match component interface
  const doorcardLite = {
    name: doorcard.name,
    doorcardName: doorcard.doorcardName,
    officeNumber: doorcard.officeNumber,
    term: doorcard.term,
    year: String(doorcard.year),
    college: doorcard.college,
    appointments: doorcard.Appointment.map((apt) => ({
      id: apt.id,
      name: apt.name,
      startTime: apt.startTime,
      endTime: apt.endTime,
      dayOfWeek: apt.dayOfWeek,
      category: apt.category,
      location: apt.location,
    })),
    user: doorcard.User,
  };

  // Render the component to HTML
  try {
    const html = renderToStaticMarkup(
      React.createElement(UnifiedDoorcard, {
        doorcard: doorcardLite,
        showWeekendDays: false,
        containerId: "test-calendar",
      })
    );

    console.log("✅ Component rendered successfully!\n");

    // Test 1: Check that off-hour appointments appear in the HTML
    console.log("🔍 Test 1: Checking if off-hour appointments are rendered...");

    let offHourRendered = 0;
    offHourAppointments.forEach((apt) => {
      // Look for the appointment name and time range in the HTML
      const nameInHtml =
        html.includes(apt.name.replace(" - ", "")) || html.includes(apt.name);
      const timeRangeInHtml =
        html.includes(apt.startTime) && html.includes(apt.endTime);

      if (nameInHtml && timeRangeInHtml) {
        console.log(
          `  ✅ ${apt.name} (${apt.startTime}-${apt.endTime}) - FOUND in HTML`
        );
        offHourRendered++;
      } else {
        console.log(
          `  ❌ ${apt.name} (${apt.startTime}-${apt.endTime}) - MISSING from HTML`
        );
        // Debug: show a snippet of HTML around where it should be
        const dayMatch = html.match(
          new RegExp(`${apt.dayOfWeek}[\\s\\S]{0,200}`, "i")
        );
        if (dayMatch) {
          console.log(
            `     Debug - ${apt.dayOfWeek} column content: ${dayMatch[0].substring(0, 100)}...`
          );
        }
      }
    });

    // Test 2: Check that regular appointments still work
    console.log(
      "\n🔍 Test 2: Checking if regular appointments still render..."
    );

    let regularRendered = 0;
    regularAppointments.forEach((apt) => {
      const nameInHtml =
        html.includes(apt.name.replace(" - ", "")) || html.includes(apt.name);
      const timeRangeInHtml =
        html.includes(apt.startTime) && html.includes(apt.endTime);

      if (nameInHtml && timeRangeInHtml) {
        console.log(
          `  ✅ ${apt.name} (${apt.startTime}-${apt.endTime}) - FOUND in HTML`
        );
        regularRendered++;
      } else {
        console.log(
          `  ❌ ${apt.name} (${apt.startTime}-${apt.endTime}) - MISSING from HTML`
        );
      }
    });

    // Test results
    console.log("\n📈 TEST RESULTS:");
    console.log(
      `Off-hour appointments rendered: ${offHourRendered}/${offHourAppointments.length}`
    );
    console.log(
      `Regular appointments rendered: ${regularRendered}/${regularAppointments.length}`
    );

    const offHourSuccess = offHourRendered === offHourAppointments.length;
    const regularSuccess = regularRendered === regularAppointments.length;

    if (offHourSuccess && regularSuccess) {
      console.log("\n🎉 SUCCESS! Calendar fix is working correctly!");
      console.log("   ✅ All off-hour appointments are now rendering");
      console.log("   ✅ Regular appointments still work");
      console.log(
        "\n🔗 You can view the calendar at: http://localhost:3000/view/testfaculty"
      );
    } else {
      console.log("\n❌ FAILURE! Calendar fix needs more work:");
      if (!offHourSuccess) {
        console.log(
          `   ❌ ${offHourAppointments.length - offHourRendered} off-hour appointments still missing`
        );
      }
      if (!regularSuccess) {
        console.log(
          `   ❌ ${regularAppointments.length - regularRendered} regular appointments broken`
        );
      }
    }

    // Optional: Save HTML for manual inspection
    if (process.argv.includes("--save-html")) {
      const fs = require("fs");
      fs.writeFileSync(
        "./test-calendar-output.html",
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Calendar Test Output</title>
          <style>
            body { font-family: sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ccc; padding: 8px; text-align: center; }
            .test-appointment { background: #f0f8ff; }
          </style>
        </head>
        <body>
          <h1>Calendar Test Output</h1>
          ${html}
        </body>
        </html>
      `
      );
      console.log(
        "\n💾 HTML saved to test-calendar-output.html for manual inspection"
      );
    }
  } catch (error) {
    console.log("❌ Error rendering component:", error);
  }
}

testCalendarFix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
