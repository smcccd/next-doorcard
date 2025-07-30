import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Replicate the exact logic from the view page
async function fetchDoorcard(username: string) {
  console.log(`Testing fetchDoorcard for username: ${username}`);

  // Find the user first - try username, then name-based search
  let user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, college: true, email: true },
  });

  console.log("User found by username:", user);

  if (!user) {
    // Convert slug back to potential name patterns
    const namePatterns = [
      username.replace(/-/g, " "), // "john-ortiz" -> "john ortiz"
      username
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "), // "john-ortiz" -> "John Ortiz"
    ];

    console.log("Trying name patterns:", namePatterns);

    user = await prisma.user.findFirst({
      where: {
        OR: namePatterns.map((name) => ({
          name: { equals: name, mode: "insensitive" as const },
        })),
      },
      select: { id: true, name: true, college: true, email: true },
    });

    console.log("User found by name patterns:", user);
  }

  if (!user) {
    console.log("❌ User not found");
    return { error: "Doorcard not found" } as const;
  }

  // Current active doorcard for this user
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

  console.log(
    "Doorcard found:",
    doorcard
      ? {
          id: doorcard.id,
          name: doorcard.name,
          isActive: doorcard.isActive,
          isPublic: doorcard.isPublic,
          userId: doorcard.userId,
        }
      : null
  );

  if (!doorcard) {
    console.log("❌ No active doorcard found");
    return { error: "Doorcard not found" } as const;
  }

  // Enforce public visibility unless ?auth=true with valid session
  if (!doorcard.isPublic) {
    console.log("❌ Doorcard is not public");
    return { error: "This doorcard is not publicly accessible" } as const;
  }

  console.log("✅ Success! Doorcard should be accessible");
  return { doorcard } as const;
}

async function testDoorcard() {
  try {
    const result = await fetchDoorcard("besnyib");
    console.log("\nFinal result:", result);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDoorcard();
