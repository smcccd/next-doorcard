#!/usr/bin/env npx ts-node

/**
 * Restore the correct business logic: Allow multiple active doorcards per term
 * but only one per campus per term.
 *
 * This reverses the overly aggressive cleanup that enforced one active per term total.
 */

import { prisma } from "../lib/prisma";

async function restoreMultiCampusDoorcards(dryRun: boolean = true) {
  console.log(
    `🔧 ${dryRun ? "DRY RUN: " : ""}Restoring multi-campus doorcard logic...\n`
  );

  try {
    // Find users who had multiple active doorcards for same term that were incorrectly archived
    console.log("📊 Current state analysis...\n");

    // Check besnyib specifically since that's what we're fixing
    const besnyibUser = await prisma.user.findFirst({
      where: { username: "besnyib" },
    });

    if (!besnyibUser) {
      console.log("❌ besnyib user not found");
      return;
    }

    const besnyibDoorcards = await prisma.doorcard.findMany({
      where: {
        userId: besnyibUser.id,
        term: "FALL",
        year: 2025,
      },
      orderBy: [{ college: "asc" }, { updatedAt: "desc" }],
    });

    console.log(`👤 besnyib Fall 2025 doorcards:`);
    besnyibDoorcards.forEach((d) => {
      const status = d.isActive ? "✅ Active" : "📦 Inactive";
      const visibility = d.isPublic ? "Public" : "Private";
      console.log(
        `   ${d.college}: ${d.doorcardName} - ${status} (${visibility})`
      );
    });
    console.log("");

    // The correct state should be:
    // - CSM: Active (current - keep as is)
    // - CANADA: Active (restore from inactive)
    // - SKYLINE: Can be active if desired (currently inactive - could restore)

    const changes = [];

    // Restore Canada doorcard to active if it has appointments
    const canadaDoorcard = besnyibDoorcards.find((d) => d.college === "CANADA");
    if (canadaDoorcard && !canadaDoorcard.isActive) {
      const appointments = await prisma.appointment.count({
        where: { doorcardId: canadaDoorcard.id },
      });

      if (appointments > 0) {
        console.log(
          `🔄 Will restore Canada doorcard to active (has ${appointments} appointments)`
        );
        changes.push({
          id: canadaDoorcard.id,
          college: canadaDoorcard.college,
          doorcardName: canadaDoorcard.doorcardName,
          action: "activate",
        });
      }
    }

    // Check if Skyline doorcard should be restored (if it has content)
    const skylineDoorcard = besnyibDoorcards.find(
      (d) => d.college === "SKYLINE"
    );
    if (skylineDoorcard && !skylineDoorcard.isActive) {
      const appointments = await prisma.appointment.count({
        where: { doorcardId: skylineDoorcard.id },
      });

      if (appointments > 0) {
        console.log(
          `🔄 Will restore Skyline doorcard to active (has ${appointments} appointments)`
        );
        changes.push({
          id: skylineDoorcard.id,
          college: skylineDoorcard.college,
          doorcardName: skylineDoorcard.doorcardName,
          action: "activate",
        });
      } else {
        console.log(
          `⚪ Skyline doorcard has no appointments - leaving inactive`
        );
      }
    }

    if (changes.length === 0) {
      console.log("✅ No changes needed - current state is correct\n");
      return;
    }

    console.log(`\n📋 Planned changes:`);
    changes.forEach((change) => {
      console.log(`   ${change.college}: Activate "${change.doorcardName}"`);
    });

    if (!dryRun) {
      console.log(`\n⚡ Applying changes...`);
      for (const change of changes) {
        await prisma.doorcard.update({
          where: { id: change.id },
          data: { isActive: true },
        });
        console.log(`   ✅ Activated ${change.college} doorcard`);
      }
      console.log(`\n🎉 Successfully restored ${changes.length} doorcard(s)!`);
    } else {
      console.log(`\n⚠️  This was a DRY RUN - no changes made`);
      console.log(`   Run with --execute to apply changes`);
    }
  } catch (error) {
    console.error("❌ Error restoring doorcards:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const executeMode = args.includes("--execute") || args.includes("--apply");

if (require.main === module) {
  restoreMultiCampusDoorcards(!executeMode).catch(console.error);
}
