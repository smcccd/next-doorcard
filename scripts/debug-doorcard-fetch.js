const { PrismaClient } = require("@prisma/client");

// Load environment in Next.js-like order
require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

async function debugDoorcardFetch() {
  try {
    console.log("🔍 Testing doorcard fetch logic...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL);

    const username = "besnyib";

    // Step 1: Find user
    console.log("Step 1: Finding user...");
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, name: true, college: true, email: true },
    });

    if (!user) {
      console.log("❌ User not found");
      return;
    }
    console.log("✅ User found:", user);

    // Step 2: Find active doorcard (current logic)
    console.log("\nStep 2: Finding active doorcard...");
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

    console.log("Doorcard result:", !!doorcard ? "FOUND" : "NOT FOUND");
    if (doorcard) {
      console.log("✅ Doorcard details:");
      console.log("  ID:", doorcard.id);
      console.log("  Name:", doorcard.name);
      console.log("  Slug:", doorcard.slug);
      console.log("  Active:", doorcard.isActive);
      console.log("  Public:", doorcard.isPublic);
      console.log("  Appointments:", doorcard.Appointment?.length);
      console.log("  User:", doorcard.User?.name);
    } else {
      console.log("❌ No doorcard found");

      // Let's check all doorcards for this user
      console.log("\nStep 3: Checking ALL doorcards for user...");
      const allDoorcards = await prisma.doorcard.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          isPublic: true,
          term: true,
          year: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      console.log(`Found ${allDoorcards.length} total doorcards:`);
      allDoorcards.forEach((dc, i) => {
        console.log(
          `  ${i + 1}. ID: ${dc.id.slice(0, 8)}... Name: ${dc.name} (Active: ${dc.isActive}, Public: ${dc.isPublic}, Term: ${dc.term} ${dc.year})`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDoorcardFetch();
