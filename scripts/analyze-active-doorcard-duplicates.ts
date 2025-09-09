#!/usr/bin/env npx ts-node

/**
 * Analyze duplicate active doorcards that violate the business logic:
 * Only one active doorcard per user/college/term/year should be allowed
 */

import { prisma } from "../lib/prisma";

interface DoorcardGroup {
  userId: string;
  college: string;
  term: string;
  year: number;
  count: number;
  doorcards: Array<{
    id: string;
    doorcardName: string;
    isActive: boolean;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

async function analyzeDuplicates() {
  console.log("🔍 Analyzing active doorcard duplicates...\n");

  try {
    // Find all active doorcards grouped by user/college/term/year
    const activeDoorcards = await prisma.doorcard.findMany({
      where: {
        isActive: true,
      },
      include: {
        User: {
          select: {
            username: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { userId: "asc" },
        { college: "asc" },
        { term: "asc" },
        { year: "asc" },
        { updatedAt: "desc" },
      ],
    });

    console.log(`📊 Found ${activeDoorcards.length} active doorcards total\n`);

    // Group by user/college/term/year
    const groups = new Map<string, DoorcardGroup>();

    for (const doorcard of activeDoorcards) {
      const key = `${doorcard.userId}-${doorcard.college}-${doorcard.term}-${doorcard.year}`;

      if (!groups.has(key)) {
        groups.set(key, {
          userId: doorcard.userId,
          college: doorcard.college,
          term: doorcard.term,
          year: doorcard.year,
          count: 0,
          doorcards: [],
        });
      }

      const group = groups.get(key)!;
      group.count++;
      group.doorcards.push({
        id: doorcard.id,
        doorcardName: doorcard.doorcardName || "Untitled",
        isActive: doorcard.isActive,
        isPublic: doorcard.isPublic,
        createdAt: doorcard.createdAt,
        updatedAt: doorcard.updatedAt,
      });
    }

    // Find groups with duplicates
    const duplicateGroups = Array.from(groups.values()).filter(
      (group) => group.count > 1
    );

    if (duplicateGroups.length === 0) {
      console.log(
        "✅ No duplicate active doorcards found within same college/term/year\n"
      );
    } else {
      console.log(
        `⚠️  Found ${duplicateGroups.length} groups with duplicate active doorcards:\n`
      );

      for (const group of duplicateGroups) {
        // Get user info for this group
        const user = activeDoorcards.find(
          (d) => d.userId === group.userId
        )?.User;

        console.log(
          `👤 User: ${user?.name || "Unknown"} (${user?.username || "no-username"})`
        );
        console.log(
          `📍 Location: ${group.college} - ${group.term} ${group.year}`
        );
        console.log(`🔢 Count: ${group.count} active doorcards`);
        console.log(`📋 Doorcards:`);

        group.doorcards.forEach((doorcard, index) => {
          const newest = index === 0 ? " ← NEWEST" : "";
          const publicStatus = doorcard.isPublic ? "Public" : "Private";
          console.log(
            `   ${index + 1}. ${doorcard.doorcardName} (${publicStatus})${newest}`
          );
          console.log(`      ID: ${doorcard.id}`);
          console.log(`      Created: ${doorcard.createdAt.toISOString()}`);
          console.log(`      Updated: ${doorcard.updatedAt.toISOString()}`);
        });
        console.log("");
      }

      // Summary
      const totalDuplicates = duplicateGroups.reduce(
        (sum, group) => sum + group.count - 1,
        0
      );
      console.log(`📊 Summary:`);
      console.log(`   - ${duplicateGroups.length} users affected`);
      console.log(
        `   - ${totalDuplicates} duplicate doorcards need to be archived`
      );
      console.log(
        `   - Recommendation: Keep newest doorcard active, archive older ones\n`
      );
    }

    // Also check for users with multiple active doorcards for same term (different colleges)
    console.log(
      "🔍 Checking for users with multiple active doorcards per term...\n"
    );

    const userTermGroups = new Map<
      string,
      Array<{
        userId: string;
        term: string;
        year: number;
        colleges: string[];
        doorcards: Array<{
          id: string;
          college: string;
          doorcardName: string;
          isPublic: boolean;
        }>;
      }>
    >();

    for (const doorcard of activeDoorcards) {
      const key = `${doorcard.userId}-${doorcard.term}-${doorcard.year}`;

      if (!userTermGroups.has(key)) {
        userTermGroups.set(key, []);
      }

      let group = userTermGroups
        .get(key)!
        .find(
          (g) =>
            g.userId === doorcard.userId &&
            g.term === doorcard.term &&
            g.year === doorcard.year
        );

      if (!group) {
        group = {
          userId: doorcard.userId,
          term: doorcard.term,
          year: doorcard.year,
          colleges: [],
          doorcards: [],
        };
        userTermGroups.get(key)!.push(group);
      }

      if (!group.colleges.includes(doorcard.college)) {
        group.colleges.push(doorcard.college);
      }

      group.doorcards.push({
        id: doorcard.id,
        college: doorcard.college,
        doorcardName: doorcard.doorcardName || "Untitled",
        isPublic: doorcard.isPublic,
      });
    }

    // Find users with multiple colleges for same term
    const multiCollegeUsers = Array.from(userTermGroups.values())
      .flat()
      .filter((group) => group.colleges.length > 1);

    if (multiCollegeUsers.length > 0) {
      console.log(
        `👥 Found ${multiCollegeUsers.length} users with active doorcards at multiple colleges for the same term:`
      );

      for (const group of multiCollegeUsers) {
        const user = activeDoorcards.find(
          (d) => d.userId === group.userId
        )?.User;
        console.log(
          `\n   👤 ${user?.name || "Unknown"} (${user?.username || "no-username"})`
        );
        console.log(
          `   📅 ${group.term} ${group.year} - ${group.colleges.length} colleges: ${group.colleges.join(", ")}`
        );

        group.doorcards.forEach((d) => {
          const visibility = d.isPublic ? "Public" : "Private";
          console.log(
            `      - ${d.college}: ${d.doorcardName} (${visibility})`
          );
        });
      }
      console.log("");
    } else {
      console.log(
        "✅ No users with multiple college doorcards for same term\n"
      );
    }

    // Show what the cleanup script should do
    console.log(`🔧 Cleanup plan:`);
    for (const group of duplicateGroups) {
      const user = activeDoorcards.find((d) => d.userId === group.userId)?.User;
      const keepDoorcard = group.doorcards[0]; // First one is newest due to sorting
      const archiveDoorcards = group.doorcards.slice(1);

      console.log(
        `   👤 ${user?.username || "unknown"} (${group.college} ${group.term} ${group.year}):`
      );
      console.log(`      ✅ Keep active: ${keepDoorcard.doorcardName}`);
      archiveDoorcards.forEach((d) => {
        console.log(`      📦 Archive: ${d.doorcardName}`);
      });
    }
  } catch (error) {
    console.error("❌ Error analyzing duplicates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  analyzeDuplicates().catch(console.error);
}
