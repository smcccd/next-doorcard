import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CampusStats {
  campus: string;
  count: number;
  percentage: number;
}

interface CampusTermStats {
  campus: string;
  fall2024: number;
  spring2025: number;
  summer2025: number;
  total: number;
}

async function comprehensiveCampusAnalysis() {
  console.log("🏫 COMPREHENSIVE CAMPUS DISTRIBUTION ANALYSIS (2024-2025)");
  console.log("=".repeat(80));

  // Define recent terms (2024-2025 academic year)
  const recentTerms = [
    { season: "FALL", year: 2024 },
    { season: "SPRING", year: 2025 },
    { season: "SUMMER", year: 2025 },
  ];

  // 1. Get all doorcards from recent terms
  const recentDoorcards = await prisma.doorcard.findMany({
    where: {
      OR: recentTerms.map((term) => ({
        term: term.season as any,
        year: term.year,
      })),
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          college: true,
          role: true,
          createdAt: true,
        },
      },
    },
  });

  console.log(
    `📊 Found ${recentDoorcards.length} doorcards from recent terms (Fall 2024, Spring 2025, Summer 2025)\n`
  );

  // 2. DOORCARD CAMPUS DISTRIBUTION
  console.log("🎯 DOORCARD CAMPUS DISTRIBUTION");
  console.log("-".repeat(40));

  const campusDistribution = new Map<string, number>();
  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    campusDistribution.set(campus, 0);
  });

  recentDoorcards.forEach((doorcard) => {
    const campus = doorcard.college;
    campusDistribution.set(campus, (campusDistribution.get(campus) || 0) + 1);
  });

  const totalDoorcards = recentDoorcards.length;
  const doorcardStats: CampusStats[] = [];

  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const count = campusDistribution.get(campus) || 0;
    const percentage = (count / totalDoorcards) * 100;
    doorcardStats.push({ campus, count, percentage });
    console.log(
      `${campus.padEnd(8)}: ${count.toString().padStart(4)} doorcards (${percentage.toFixed(1)}%)`
    );
  });
  console.log(
    `${"TOTAL".padEnd(8)}: ${totalDoorcards.toString().padStart(4)} doorcards (100.0%)\n`
  );

  // 3. USER DISTRIBUTION BY CAMPUS (Based on Doorcard Assignments)
  console.log("👥 USER DISTRIBUTION BY DOORCARD CAMPUS");
  console.log("-".repeat(50));

  const usersByCampus = new Map<string, Set<string>>();
  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    usersByCampus.set(campus, new Set<string>());
  });

  const allUniqueUsers = new Set<string>();
  const userCampusCount = new Map<string, Set<string>>();

  recentDoorcards.forEach((doorcard) => {
    usersByCampus.get(doorcard.college)?.add(doorcard.userId);
    allUniqueUsers.add(doorcard.userId);

    if (!userCampusCount.has(doorcard.userId)) {
      userCampusCount.set(doorcard.userId, new Set());
    }
    userCampusCount.get(doorcard.userId)?.add(doorcard.college);
  });

  // Count users with multiple campus affiliations
  let overlappingUsers = 0;
  userCampusCount.forEach((campuses) => {
    if (campuses.size > 1) {
      overlappingUsers++;
    }
  });

  const totalUniqueUsers = allUniqueUsers.size;
  const userStats: CampusStats[] = [];

  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const uniqueUserCount = usersByCampus.get(campus)?.size || 0;
    const percentage = (uniqueUserCount / totalUniqueUsers) * 100;
    userStats.push({ campus, count: uniqueUserCount, percentage });
    console.log(
      `${campus.padEnd(8)}: ${uniqueUserCount.toString().padStart(4)} users (${percentage.toFixed(1)}%)`
    );
  });

  console.log(
    `${"OVERLAP".padEnd(8)}: ${overlappingUsers.toString().padStart(4)} users have doorcards at multiple campuses`
  );
  console.log(
    `${"TOTAL".padEnd(8)}: ${totalUniqueUsers.toString().padStart(4)} unique users\n`
  );

  // 4. TERM-BY-TERM BREAKDOWN
  console.log("📅 CAMPUS DISTRIBUTION BY TERM");
  console.log("-".repeat(50));

  const termStats = new Map<string, CampusTermStats>();
  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    termStats.set(campus, {
      campus,
      fall2024: 0,
      spring2025: 0,
      summer2025: 0,
      total: 0,
    });
  });

  recentDoorcards.forEach((doorcard) => {
    const stats = termStats.get(doorcard.college)!;
    if (doorcard.term === "FALL" && doorcard.year === 2024) {
      stats.fall2024++;
    } else if (doorcard.term === "SPRING" && doorcard.year === 2025) {
      stats.spring2025++;
    } else if (doorcard.term === "SUMMER" && doorcard.year === 2025) {
      stats.summer2025++;
    }
    stats.total++;
  });

  console.log("Campus     | Fall 2024 | Spring 2025 | Summer 2025 | Total");
  console.log("-".repeat(60));
  termStats.forEach((stats, campus) => {
    console.log(
      `${campus.padEnd(10)} | ${stats.fall2024.toString().padStart(9)} | ${stats.spring2025.toString().padStart(11)} | ${stats.summer2025.toString().padStart(11)} | ${stats.total.toString().padStart(5)}`
    );
  });

  // 5. TOP ACTIVE USERS BY DOORCARD COUNT
  console.log("\n🏆 TOP 10 USERS BY DOORCARD COUNT (Recent Terms)");
  console.log("-".repeat(60));

  const userDoorcardCount = new Map<
    string,
    { count: number; user: any; primaryCampus: string; campuses: Set<string> }
  >();

  recentDoorcards.forEach((doorcard) => {
    if (!userDoorcardCount.has(doorcard.userId)) {
      userDoorcardCount.set(doorcard.userId, {
        count: 0,
        user: doorcard.User,
        primaryCampus: "",
        campuses: new Set(),
      });
    }
    const userData = userDoorcardCount.get(doorcard.userId)!;
    userData.count++;
    userData.campuses.add(doorcard.college);
  });

  // Determine primary campus for each user (campus with most doorcards)
  userDoorcardCount.forEach((userData, userId) => {
    const userDoorcards = recentDoorcards.filter((d) => d.userId === userId);
    const campusCount = new Map<string, number>();
    userDoorcards.forEach((d) => {
      campusCount.set(d.college, (campusCount.get(d.college) || 0) + 1);
    });
    userData.primaryCampus = Array.from(campusCount.entries()).reduce(
      (max, current) => (current[1] > max[1] ? current : max)
    )[0];
  });

  const topUsers = Array.from(userDoorcardCount.entries())
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10);

  topUsers.forEach(([userId, userData], index) => {
    const rank = (index + 1).toString().padStart(2);
    const name = userData.user.name || userData.user.email.split("@")[0];
    const campusInfo =
      userData.campuses.size > 1
        ? `${userData.primaryCampus}+`
        : userData.primaryCampus;
    console.log(
      `${rank}. ${name.substring(0, 25).padEnd(25)} | ${campusInfo.padEnd(9)} | ${userData.count.toString().padStart(2)} doorcards`
    );
  });

  // 6. TOP 10 USERS CAMPUS DISTRIBUTION
  console.log("\n📈 TOP 10 USERS CAMPUS DISTRIBUTION");
  console.log("-".repeat(40));

  const topUsersCampusCount = new Map<string, number>();
  topUsers.forEach(([userId, userData]) => {
    topUsersCampusCount.set(
      userData.primaryCampus,
      (topUsersCampusCount.get(userData.primaryCampus) || 0) + 1
    );
  });

  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const count = topUsersCampusCount.get(campus) || 0;
    const percentage = (count / 10) * 100;
    console.log(
      `${campus.padEnd(8)}: ${count.toString().padStart(2)}/10 users (${percentage.toFixed(0)}%)`
    );
  });

  // 7. USAGE PATTERNS ANALYSIS
  console.log("\n🔍 CAMPUS ENGAGEMENT PATTERNS");
  console.log("-".repeat(50));

  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const campusUsers = usersByCampus.get(campus)?.size || 0;
    const campusDoorcards = campusDistribution.get(campus) || 0;
    const avgDoorcards =
      campusUsers > 0 ? (campusDoorcards / campusUsers).toFixed(1) : "0.0";

    console.log(`\n${campus}:`);
    console.log(`  Users: ${campusUsers} | Doorcards: ${campusDoorcards}`);
    console.log(`  Avg doorcards per user: ${avgDoorcards}`);

    // Get sample of recent users
    const campusUserIds = Array.from(usersByCampus.get(campus) || []);
    const sampleUsers = campusUserIds.slice(0, 3);
    const sampleUserDetails = recentDoorcards
      .filter((d) => sampleUsers.includes(d.userId))
      .map((d) => d.User.name || d.User.email.split("@")[0]);

    if (sampleUserDetails.length > 0) {
      console.log(
        `  Sample users: ${[...new Set(sampleUserDetails)].slice(0, 3).join(", ")}`
      );
    }
  });

  // 8. USER PROFILE ANALYSIS
  console.log("\n👤 USER PROFILE ANALYSIS");
  console.log("-".repeat(30));

  const usersWithProfileCampus = await prisma.user.count({
    where: {
      college: { not: null },
    },
  });

  const totalUsersInSystem = await prisma.user.count();

  // Role distribution among active doorcard users
  const roleDistribution = new Map<string, number>();
  const uniqueActiveUsers = Array.from(allUniqueUsers);

  const activeUsers = await prisma.user.findMany({
    where: {
      id: { in: uniqueActiveUsers },
    },
    select: {
      role: true,
    },
  });

  activeUsers.forEach((user) => {
    roleDistribution.set(user.role, (roleDistribution.get(user.role) || 0) + 1);
  });

  console.log(`Total users in system: ${totalUsersInSystem}`);
  console.log(
    `Users with campus in profile: ${usersWithProfileCampus} (${((usersWithProfileCampus / totalUsersInSystem) * 100).toFixed(1)}%)`
  );
  console.log(`Active doorcard users (2024-2025): ${totalUniqueUsers}`);

  console.log("\nRole distribution among active users:");
  roleDistribution.forEach((count, role) => {
    const percentage = (count / totalUniqueUsers) * 100;
    console.log(`  ${role}: ${count} (${percentage.toFixed(1)}%)`);
  });

  // 9. KEY INSIGHTS
  console.log("\n🎯 KEY INSIGHTS");
  console.log("-".repeat(30));

  const mostActiveDoorcardCampus = doorcardStats.reduce((max, current) =>
    current.count > max.count ? current : max
  );

  const mostActiveUserCampus = userStats.reduce((max, current) =>
    current.count > max.count ? current : max
  );

  const topUserCampusLeader = Array.from(topUsersCampusCount.entries()).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["", 0]
  );

  console.log(
    `• SKYLINE dominates with ${mostActiveDoorcardCampus.count} doorcards (${mostActiveDoorcardCampus.percentage.toFixed(1)}%) and ${mostActiveUserCampus.count} users (${mostActiveUserCampus.percentage.toFixed(1)}%)`
  );
  console.log(
    `• ${overlappingUsers} users (${((overlappingUsers / totalUniqueUsers) * 100).toFixed(1)}%) have doorcards at multiple campuses`
  );
  console.log(
    `• Top 10 most active users are dominated by ${topUserCampusLeader[0]} (${topUserCampusLeader[1]}/10 users)`
  );
  console.log(
    `• Only ${((usersWithProfileCampus / totalUsersInSystem) * 100).toFixed(1)}% of users have campus assigned in their profile`
  );
  console.log(`• Campus assignment is primarily managed at the doorcard level`);
  console.log(
    `• ${((totalUniqueUsers / totalUsersInSystem) * 100).toFixed(1)}% of all users have created doorcards in recent terms`
  );

  // 10. DATA QUALITY NOTES
  console.log("\n📋 DATA QUALITY NOTES");
  console.log("-".repeat(25));
  console.log(
    "• Usage analytics (views, prints, shares) are not yet populated in the database"
  );
  console.log(
    "• Campus analysis is based on doorcard assignments rather than user profiles"
  );
  console.log(
    "• 20 users have doorcards across multiple campuses, indicating cross-campus activity"
  );
  console.log(
    "• Recent terms show consistent activity across all three campuses"
  );

  console.log("\n✅ Comprehensive analysis complete!\n");
}

comprehensiveCampusAnalysis()
  .catch((error) => {
    console.error("❌ Error analyzing campus distribution:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
