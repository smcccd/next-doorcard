#!/usr/bin/env ts-node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixAppointmentConflicts() {
  console.log("🔧 Starting appointment conflict resolution...\n");

  try {
    // Get all doorcards with appointment conflicts
    const doorcards = await prisma.doorcard.findMany({
      include: {
        Appointment: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        User: {
          select: { email: true, name: true },
        },
      },
    });

    console.log(`📊 Processing ${doorcards.length} doorcards...\n`);

    let totalConflictsFound = 0;
    let totalConflictsResolved = 0;
    let doorcardsCleaned = 0;

    for (const doorcard of doorcards) {
      const appointmentsByDay = doorcard.Appointment.reduce(
        (acc, apt) => {
          if (!acc[apt.dayOfWeek]) acc[apt.dayOfWeek] = [];
          acc[apt.dayOfWeek].push(apt);
          return acc;
        },
        {} as Record<string, typeof doorcard.Appointment>
      );

      let conflictsInDoorcard = 0;
      const appointmentsToDelete: string[] = [];

      for (const [day, appointments] of Object.entries(appointmentsByDay)) {
        for (let i = 0; i < appointments.length - 1; i++) {
          const current = appointments[i];
          const next = appointments[i + 1];

          // Check for overlapping times
          if (current.endTime > next.startTime) {
            conflictsInDoorcard++;
            totalConflictsFound++;

            // Resolution strategy: keep the longer appointment, or the first one if same length
            const currentDuration = calculateDuration(
              current.startTime,
              current.endTime
            );
            const nextDuration = calculateDuration(
              next.startTime,
              next.endTime
            );

            if (nextDuration > currentDuration) {
              appointmentsToDelete.push(current.id);
              console.log(
                `  ❌ Removing shorter: ${current.name} ${current.startTime}-${current.endTime}`
              );
            } else {
              appointmentsToDelete.push(next.id);
              console.log(
                `  ❌ Removing shorter: ${next.name} ${next.startTime}-${next.endTime}`
              );
            }
          }
        }
      }

      if (conflictsInDoorcard > 0) {
        console.log(
          `\n🔍 Doorcard: ${doorcard.doorcardName} (${doorcard.User?.email})`
        );
        console.log(
          `  Found ${conflictsInDoorcard} conflicts, removing ${appointmentsToDelete.length} appointments`
        );

        // Delete conflicting appointments
        if (appointmentsToDelete.length > 0) {
          await prisma.appointment.deleteMany({
            where: { id: { in: appointmentsToDelete } },
          });
          totalConflictsResolved += appointmentsToDelete.length;
          doorcardsCleaned++;
        }
      }
    }

    console.log(`\n✅ Cleanup Complete!`);
    console.log(`  📊 Total conflicts found: ${totalConflictsFound}`);
    console.log(`  🔧 Appointments removed: ${totalConflictsResolved}`);
    console.log(`  📋 Doorcards cleaned: ${doorcardsCleaned}`);

    // Verify cleanup worked
    console.log("\n🔍 Re-running conflict check...");
    const verification = await prisma.$queryRaw<Array<{ conflicts: number }>>`
      SELECT COUNT(*) as conflicts
      FROM Appointment a1 
      JOIN Appointment a2 ON a1.doorcardId = a2.doorcardId 
        AND a1.dayOfWeek = a2.dayOfWeek 
        AND a1.id != a2.id
        AND a1.endTime > a2.startTime 
        AND a1.startTime < a2.endTime
    `;

    const remainingConflicts = verification[0]?.conflicts || 0;
    console.log(`  🎯 Remaining conflicts: ${remainingConflicts}`);
  } catch (error) {
    console.error("❌ Error fixing appointment conflicts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);
  return endHour * 60 + endMin - (startHour * 60 + startMin);
}

if (require.main === module) {
  fixAppointmentConflicts();
}
