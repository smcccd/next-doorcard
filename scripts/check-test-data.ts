import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkTestData() {
  console.log("🔍 Checking test doorcard data...\n");

  const doorcard = await prisma.doorcard.findUnique({
    where: { id: "off-hours-test-doorcard" },
    include: { Appointment: true },
  });

  if (!doorcard) {
    console.log("❌ Test doorcard not found");
    return;
  }

  console.log(
    `📋 Found doorcard with ${doorcard.Appointment.length} appointments:`
  );

  const byDay: Record<string, any[]> = {};
  doorcard.Appointment.forEach((apt) => {
    if (!byDay[apt.dayOfWeek]) byDay[apt.dayOfWeek] = [];
    byDay[apt.dayOfWeek].push(apt);
    console.log(
      `  • ${apt.name}: ${apt.startTime}-${apt.endTime} (${apt.dayOfWeek})`
    );
  });

  console.log("\n📊 Days with appointments:");
  Object.keys(byDay).forEach((day) => {
    console.log(`  ${day}: ${byDay[day].length} appointments`);
  });

  const hasWeekends = Boolean(byDay.SATURDAY?.length || byDay.SUNDAY?.length);
  console.log(`\n🔍 Has weekend appointments: ${hasWeekends ? "YES" : "NO"}`);

  if (hasWeekends) {
    console.log("   → Calendar should show 7 days (Mon-Sun)");
  } else {
    console.log("   → Calendar should show 5 days (Mon-Fri)");
  }
}

checkTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
