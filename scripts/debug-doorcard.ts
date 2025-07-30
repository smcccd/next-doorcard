import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugDoorcard() {
  try {
    const username = "besnyib";

    // Step 1: Find user by username
    console.log(`1. Looking for user with username: ${username}`);
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, name: true, college: true, email: true },
    });

    if (!user) {
      console.log("❌ User not found by username");
      return;
    }
    console.log("✅ User found:", user);

    // Step 2: Look for active doorcard
    console.log(`\n2. Looking for active doorcard for user ID: ${user.id}`);
    const doorcard = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
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
      console.log("❌ No active doorcard found");
      return;
    }
    console.log("✅ Active doorcard found:", {
      id: doorcard.id,
      name: doorcard.name,
      isActive: doorcard.isActive,
      isPublic: doorcard.isPublic,
      appointmentCount: doorcard.Appointment.length,
    });

    // Step 3: Check public visibility
    console.log(`\n3. Checking public visibility`);
    if (!doorcard.isPublic) {
      console.log("❌ Doorcard is not public");
      return;
    }
    console.log("✅ Doorcard is public");

    console.log("\n✅ All checks passed - doorcard should be accessible!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDoorcard();
