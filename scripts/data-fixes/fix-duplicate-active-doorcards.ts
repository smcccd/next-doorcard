#!/usr/bin/env npx ts-node

/**
 * Fix users who have multiple active doorcards for the same term.
 * Business rule: Only one active doorcard per user per term (regardless of college).
 *
 * Strategy: Keep the most recently updated public doorcard, archive the others.
 */

import { prisma } from "../../lib/prisma";

interface DoorcardGroup {
  userId: string;
  term: string;
  year: number;
  doorcards: Array<{
    id: string;
    college: string;
    doorcardName: string;
    isPublic: boolean;
    updatedAt: Date;
    createdAt: Date;
  }>;
  user: {
    username: string;
    name: string;
  };
}

async function fixDuplicateActiveDoorcards(dryRun: boolean = true) {
  console.log(
    `🔧 ${dryRun ? "DRY RUN: " : ""}Fixing duplicate active doorcards...\n`
  );

  try {
    // Find all active doorcards
    const activeDoorcards = await prisma.doorcard.findMany({
      where: {
        isActive: true,
      },
      include: {
        User: {
          select: {
            username: true,
            name: true,
          },
        },
      },
      orderBy: [
        { userId: "asc" },
        { term: "asc" },
        { year: "asc" },
        { isPublic: "desc" }, // Prefer public doorcards
        { updatedAt: "desc" }, // Then most recent
      ],
    });

    // Group by user/term/year
    const userTermGroups = new Map<string, DoorcardGroup>();

    for (const doorcard of activeDoorcards) {
      const key = `${doorcard.userId}-${doorcard.term}-${doorcard.year}`;

      if (!userTermGroups.has(key)) {
        userTermGroups.set(key, {
          userId: doorcard.userId,
          term: doorcard.term,
          year: doorcard.year,
          doorcards: [],
          user: {
            username: doorcard.User.username || "no-username",
            name: doorcard.User.name || "Unknown",
          },
        });
      }

      userTermGroups.get(key)!.doorcards.push({
        id: doorcard.id,
        college: doorcard.college,
        doorcardName: doorcard.doorcardName || "Untitled",
        isPublic: doorcard.isPublic,
        updatedAt: doorcard.updatedAt,
        createdAt: doorcard.createdAt,
      });
    }

    // Find groups with multiple active doorcards
    const duplicateGroups = Array.from(userTermGroups.values()).filter(
      (group) => group.doorcards.length > 1
    );

    if (duplicateGroups.length === 0) {
      console.log("✅ No users with multiple active doorcards found!\n");
      return;
    }

    console.log(
      `⚠️  Found ${duplicateGroups.length} users with multiple active doorcards for the same term:\n`
    );

    let totalArchived = 0;

    for (const group of duplicateGroups) {
      console.log(
        `👤 ${group.user.name} (${group.user.username}) - ${group.term} ${group.year}`
      );
      console.log(`   Current active doorcards: ${group.doorcards.length}`);

      // Sort by preference: public first, then most recently updated
      const sortedDoorcards = group.doorcards.sort((a, b) => {
        // First prefer public
        if (a.isPublic !== b.isPublic) {
          return b.isPublic ? 1 : -1;
        }
        // Then prefer most recent
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

      const keepDoorcard = sortedDoorcards[0];
      const archiveDoorcards = sortedDoorcards.slice(1);

      console.log(
        `   ✅ Keeping: ${keepDoorcard.doorcardName} (${keepDoorcard.college}) - ${keepDoorcard.isPublic ? "Public" : "Private"}`
      );

      for (const archiveDoorcard of archiveDoorcards) {
        console.log(
          `   📦 Archiving: ${archiveDoorcard.doorcardName} (${archiveDoorcard.college}) - ${archiveDoorcard.isPublic ? "Public" : "Private"}`
        );
        totalArchived++;

        if (!dryRun) {
          await prisma.doorcard.update({
            where: { id: archiveDoorcard.id },
            data: { isActive: false },
          });
        }
      }
      console.log("");
    }

    console.log(`📊 Summary:`);
    console.log(`   - Users affected: ${duplicateGroups.length}`);
    console.log(`   - Doorcards to archive: ${totalArchived}`);

    if (dryRun) {
      console.log(`\n⚠️  This was a DRY RUN - no changes made to database`);
      console.log(
        `   Run with --execute to apply changes: npx ts-node scripts/fix-duplicate-active-doorcards.ts --execute`
      );
    } else {
      console.log(`\n✅ Database updated successfully!`);
      console.log(`   - ${totalArchived} doorcards archived`);
      console.log(`   - Each user now has only one active doorcard per term`);
    }
  } catch (error) {
    console.error("❌ Error fixing duplicates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const executeMode = args.includes("--execute") || args.includes("--apply");

if (require.main === module) {
  fixDuplicateActiveDoorcards(!executeMode).catch(console.error);
}
