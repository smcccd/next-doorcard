import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Copy the key functions from UnifiedDoorcard to test them directly
function getMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function isSlotCovered(appointment: any, slot: string) {
  const s = getMinutes(slot);
  return (
    s >= getMinutes(appointment.startTime) &&
    s < getMinutes(appointment.endTime)
  );
}

// Generate TIME_SLOTS just like in the component
const TIME_SLOTS = Array.from({ length: 30 }, (_, i) => {
  const hour = Math.floor(i / 2) + 7;
  const minute = i % 2 === 0 ? "00" : "30";
  const value = `${hour.toString().padStart(2, "0")}:${minute}`;
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? "PM" : "AM";
  const label = `${displayHour}:${minute} ${period}`;
  return { value, label, hour, minute: minute === "00" ? 0 : 30 };
});

async function testCalendarLogic() {
  console.log(
    "🧪 Testing calendar rendering logic for off-hours appointments...\n"
  );

  // Get the test doorcard data
  const doorcard = await prisma.doorcard.findUnique({
    where: { id: "off-hours-test-doorcard" },
    include: { Appointment: true },
  });

  if (!doorcard) {
    console.log("❌ Test doorcard not found. Run the seed script first.");
    return;
  }

  // Group appointments by day
  const appointmentsByDay: Record<string, any[]> = {};
  doorcard.Appointment.forEach((apt) => {
    if (!appointmentsByDay[apt.dayOfWeek]) {
      appointmentsByDay[apt.dayOfWeek] = [];
    }
    appointmentsByDay[apt.dayOfWeek].push(apt);
  });

  console.log("📋 Testing appointment placement logic:\n");

  let totalTests = 0;
  let passedTests = 0;

  // Test each appointment against each time slot
  doorcard.Appointment.forEach((appointment) => {
    const [hours, minutes] = appointment.startTime.split(":").map(Number);
    const isOffHour = minutes !== 0 && minutes !== 30;

    console.log(
      `🔍 Testing: ${appointment.name} (${appointment.startTime}-${appointment.endTime}) on ${appointment.dayOfWeek}`
    );
    console.log(`   Type: ${isOffHour ? "OFF-HOUR" : "REGULAR"}`);

    let foundInSlot = false;
    let matchingSlot = null;

    // Test against each time slot using our NEW logic
    TIME_SLOTS.forEach((slot) => {
      const appointmentList = appointmentsByDay[appointment.dayOfWeek] || [];

      // OLD logic (exact match only) - this would FAIL for off-hours
      const exactMatch = appointmentList.find(
        (a) => a.startTime === slot.value
      );

      // NEW logic (within slot window) - this should WORK for off-hours
      const slotStartMinutes = getMinutes(slot.value);
      const slotEndMinutes = slotStartMinutes + 30;
      const slotStart = appointmentList.find((a) => {
        const startMinutes = getMinutes(a.startTime);
        return (
          startMinutes >= slotStartMinutes && startMinutes < slotEndMinutes
        );
      });

      if (exactMatch && exactMatch.id === appointment.id) {
        foundInSlot = true;
        matchingSlot = slot;
        console.log(
          `   ✅ Found by EXACT match in slot: ${slot.label} (${slot.value})`
        );
      } else if (slotStart && slotStart.id === appointment.id) {
        foundInSlot = true;
        matchingSlot = slot;
        console.log(
          `   ✅ Found by RANGE match in slot: ${slot.label} (${slot.value}) - within ${slotStartMinutes}-${slotEndMinutes} minutes`
        );
      }
    });

    totalTests++;
    if (foundInSlot) {
      passedTests++;
      console.log(`   ✅ SUCCESS: Appointment will render in calendar`);
    } else {
      console.log(`   ❌ FAILURE: Appointment will NOT render in calendar`);

      // Debug: show which slot it should be in
      const appointmentMinutes = getMinutes(appointment.startTime);
      const expectedSlot = TIME_SLOTS.find((slot) => {
        const slotMinutes = getMinutes(slot.value);
        return (
          appointmentMinutes >= slotMinutes &&
          appointmentMinutes < slotMinutes + 30
        );
      });

      if (expectedSlot) {
        console.log(
          `   🔍 Debug: Should be in slot ${expectedSlot.label} (${expectedSlot.value})`
        );
        console.log(
          `   🔍 Debug: Appointment starts at minute ${appointmentMinutes}, slot covers ${getMinutes(expectedSlot.value)}-${getMinutes(expectedSlot.value) + 30}`
        );
      }
    }
    console.log("");
  });

  // Summary
  console.log("📊 TEST SUMMARY:");
  console.log(`Total appointments tested: ${totalTests}`);
  console.log(`Appointments that will render: ${passedTests}`);
  console.log(`Appointments that will be missing: ${totalTests - passedTests}`);

  if (passedTests === totalTests) {
    console.log(
      "\n🎉 SUCCESS! All appointments (including off-hours) will render correctly!"
    );
    console.log("The calendar fix is working as expected.");
  } else {
    console.log(
      "\n❌ FAILURE! Some appointments will still be missing from the calendar."
    );
    console.log("The calendar fix needs more work.");
  }

  console.log(
    "\n🔗 You can verify visually at: http://localhost:3000/view/testfaculty"
  );
}

testCalendarLogic()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
