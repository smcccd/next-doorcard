import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixUsername() {
  try {
    // Check if user besnyib exists and doesn't have a username
    const user = await prisma.user.findUnique({
      where: { email: "besnyib@smccd.edu" },
      select: { id: true, email: true, username: true, name: true },
    });

    if (!user) {
      console.log("User besnyib@smccd.edu not found");
      return;
    }

    console.log("Current user data:", user);

    if (!user.username) {
      // Update username based on email prefix
      const username = user.email.split("@")[0]; // 'besnyib'

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { username },
        select: { id: true, email: true, username: true, name: true },
      });

      console.log("Updated user data:", updated);
      console.log(`✅ Username set to '${username}' for ${user.email}`);
    } else {
      console.log(`Username already set: ${user.username}`);
    }

    // Check if user has any active doorcards
    const doorcards = await prisma.doorcard.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        isActive: true,
        isPublic: true,
        slug: true,
      },
    });

    console.log("User doorcards:", doorcards);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsername();
