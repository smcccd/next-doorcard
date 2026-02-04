#!/usr/bin/env npx ts-node

/**
 * Check the status of the besnyib user and doorcards for debugging view route
 */

import { prisma } from "../../lib/prisma";

async function checkBesnyibUser() {
  console.log("🔍 Checking besnyib user status...");

  try {
    // Find user by username
    const user = await prisma.user.findFirst({
      where: { username: "besnyib" },
    });

    if (!user) {
      console.log('❌ User "besnyib" not found in database');

      // Check if there are any users with similar names
      const similarUsers = await prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: "besny" } },
            { name: { contains: "besny" } },
            { email: { contains: "besny" } },
          ],
        },
        select: { id: true, username: true, name: true, email: true },
      });

      if (similarUsers.length > 0) {
        console.log("🔍 Found similar users:");
        similarUsers.forEach((u) => {
          console.log(
            `  - Username: ${u.username}, Name: ${u.name}, Email: ${u.email}`
          );
        });
      } else {
        console.log("❌ No similar users found");
      }
      return;
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   College: ${user.college}`);

    // Check doorcards for this user
    const doorcards = await prisma.doorcard.findMany({
      where: { userId: user.id },
      include: {
        Appointment: true,
      },
      orderBy: [{ isActive: "desc" }, { year: "desc" }, { term: "desc" }],
    });

    console.log(`📋 Found ${doorcards.length} doorcard(s):`);

    doorcards.forEach((doorcard, index) => {
      console.log(`   ${index + 1}. ${doorcard.doorcardName}`);
      console.log(`      - ID: ${doorcard.id}`);
      console.log(`      - Term: ${doorcard.term} ${doorcard.year}`);
      console.log(`      - College: ${doorcard.college}`);
      console.log(`      - Active: ${doorcard.isActive}`);
      console.log(`      - Public: ${doorcard.isPublic}`);
      console.log(`      - Slug: ${doorcard.slug || "none"}`);
      console.log(`      - Appointments: ${doorcard.Appointment.length}`);

      if (doorcard.isActive && doorcard.isPublic) {
        console.log(`      - ✅ Available at: /view/besnyib`);
      } else if (doorcard.isActive) {
        console.log(
          `      - ⚠️  Private doorcard (need ?auth=true): /view/besnyib?auth=true`
        );
      } else {
        console.log(`      - ❌ Inactive doorcard`);
      }
      console.log("");
    });

    // Check if there's an active doorcard
    const activeDoorcard = doorcards.find((d) => d.isActive);
    if (activeDoorcard) {
      console.log(`🎯 Active doorcard: ${activeDoorcard.doorcardName}`);
      if (activeDoorcard.isPublic) {
        console.log(
          `✅ Public URL should work: http://localhost:3000/view/besnyib`
        );
      } else {
        console.log(
          `⚠️  Private doorcard - try: http://localhost:3000/view/besnyib?auth=true`
        );
      }
    } else {
      console.log(
        "❌ No active doorcard found - user needs to activate a doorcard first"
      );
    }
  } catch (error) {
    console.error("❌ Error checking user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkBesnyibUser().catch(console.error);
}
