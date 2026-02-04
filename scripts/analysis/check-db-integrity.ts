import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDatabaseIntegrity() {
  console.log("🔍 Checking database integrity...\n");

  try {
    // Check basic counts
    const userCount = await prisma.user.count();
    const doorcardCount = await prisma.doorcard.count();
    const appointmentCount = await prisma.appointment.count();

    console.log("📊 Basic Counts:");
    console.log(`  Users: ${userCount}`);
    console.log(`  Doorcards: ${doorcardCount}`);
    console.log(`  Appointments: ${appointmentCount}\n`);

    // Check for appointments with invalid doorcard IDs
    const allDoorcardIds = await prisma.doorcard.findMany({
      select: { id: true },
    });
    const validDoorcardIds = new Set(allDoorcardIds.map((d) => d.id));

    const allAppointments = await prisma.appointment.findMany({
      select: { id: true, doorcardId: true },
    });
    const orphanedAppointments = allAppointments.filter(
      (apt) => !validDoorcardIds.has(apt.doorcardId)
    );

    console.log(`🔗 Orphaned Appointments: ${orphanedAppointments.length}`);
    if (orphanedAppointments.length > 0) {
      console.log(
        "  Sample orphaned appointment IDs:",
        orphanedAppointments.slice(0, 5).map((a) => a.id)
      );
    }

    // Check for doorcards with invalid user IDs
    const allUserIds = await prisma.user.findMany({ select: { id: true } });
    const validUserIds = new Set(allUserIds.map((u) => u.id));

    const allDoorcards = await prisma.doorcard.findMany({
      select: { id: true, userId: true },
    });
    const orphanedDoorcards = allDoorcards.filter(
      (dc) => !validUserIds.has(dc.userId)
    );

    console.log(`🔗 Orphaned Doorcards: ${orphanedDoorcards.length}`);
    if (orphanedDoorcards.length > 0) {
      console.log(
        "  Sample orphaned doorcard IDs:",
        orphanedDoorcards.slice(0, 5).map((d) => d.id)
      );
    }

    // Check for appointment time conflicts within same doorcard
    console.log("\n⚠️ Checking for appointment conflicts...");
    const doorcards = await prisma.doorcard.findMany({
      include: {
        Appointment: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
    });

    let totalConflicts = 0;
    let doorcardConflicts = 0;

    for (const doorcard of doorcards) {
      const conflicts = [];
      const appointments = doorcard.Appointment;

      for (let i = 0; i < appointments.length; i++) {
        for (let j = i + 1; j < appointments.length; j++) {
          const a1 = appointments[i];
          const a2 = appointments[j];

          // Check if same day and overlapping times
          if (a1.dayOfWeek === a2.dayOfWeek) {
            const start1 = a1.startTime;
            const end1 = a1.endTime;
            const start2 = a2.startTime;
            const end2 = a2.endTime;

            // Check for overlap
            if (start1 < end2 && start2 < end1) {
              conflicts.push({
                appointment1: `${a1.name} (${start1}-${end1})`,
                appointment2: `${a2.name} (${start2}-${end2})`,
                day: a1.dayOfWeek,
              });
            }
          }
        }
      }

      if (conflicts.length > 0) {
        doorcardConflicts++;
        totalConflicts += conflicts.length;

        if (doorcardConflicts <= 3) {
          // Show first 3 problematic doorcards
          console.log(
            `\n  Doorcard: ${doorcard.doorcardName} (${doorcard.id})`
          );
          console.log(`  User: ${doorcard.userId}`);
          console.log(`  Conflicts (${conflicts.length}):`);
          conflicts.slice(0, 3).forEach((conflict) => {
            console.log(
              `    ${conflict.day}: ${conflict.appointment1} overlaps ${conflict.appointment2}`
            );
          });
        }
      }
    }

    console.log(`\n📈 Conflict Summary:`);
    console.log(
      `  Doorcards with conflicts: ${doorcardConflicts}/${doorcards.length}`
    );
    console.log(`  Total conflicts: ${totalConflicts}`);

    // Check the specific doorcard from the error
    const problemDoorcardId = "c71bb185-40f2-4940-abe6-a71a5683f22c";
    console.log(`\n🎯 Checking problem doorcard: ${problemDoorcardId}`);

    const problemDoorcard = await prisma.doorcard.findUnique({
      where: { id: problemDoorcardId },
      include: {
        Appointment: true,
        User: { select: { email: true, name: true } },
      },
    });

    if (problemDoorcard) {
      console.log(`  Name: ${problemDoorcard.doorcardName}`);
      console.log(`  User: ${problemDoorcard.User?.email}`);
      console.log(`  Appointments: ${problemDoorcard.Appointment.length}`);
      console.log(`  Active: ${problemDoorcard.isActive}`);
      console.log(`  Public: ${problemDoorcard.isPublic}`);

      if (problemDoorcard.Appointment.length > 0) {
        console.log(`  Sample appointments:`);
        problemDoorcard.Appointment.slice(0, 3).forEach((apt) => {
          console.log(
            `    ${apt.dayOfWeek}: ${apt.name} ${apt.startTime}-${apt.endTime}`
          );
        });
      }
    } else {
      console.log(`  ❌ Doorcard not found!`);
    }
  } catch (error) {
    console.error("❌ Error checking database integrity:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseIntegrity().catch(console.error);
