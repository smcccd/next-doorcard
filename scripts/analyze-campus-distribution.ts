import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CampusStats {
  campus: string;
  count: number;
  percentage: number;
}

interface UserActivityData {
  userId: string;
  userName: string | null;
  email: string;
  userCampus: string | null;
  doorcardCampus: string;
  totalViews: number;
  totalPrints: number;
  totalShares: number;
  totalActivity: number;
}

async function analyzeCampusDistribution() {
  console.log(
    "🏫 Analyzing Campus Distribution for Doorcard Users (2024-2025)",
  );
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
      User: true,
      DoorcardMetrics: true,
    },
  });

  console.log(
    `📊 Found ${recentDoorcards.length} doorcards from recent terms (Fall 2024, Spring 2025, Summer 2025)\n`,
  );

  // 2. Analyze campus distribution of doorcards
  const campusDistribution = new Map<string, number>();
  const usersByCampus = new Map<string, Set<string>>(); // Track unique users per campus

  // Initialize campus tracking
  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    campusDistribution.set(campus, 0);
    usersByCampus.set(campus, new Set<string>());
  });

  // Track unique users across all campuses
  const allUniqueUsers = new Set<string>();

  recentDoorcards.forEach((doorcard) => {
    // Count doorcard campus distribution
    const doorcardCampus = doorcard.college;
    campusDistribution.set(
      doorcardCampus,
      (campusDistribution.get(doorcardCampus) || 0) + 1,
    );

    // Track users by their doorcard campus (since user.college is mostly null)
    usersByCampus.get(doorcardCampus)?.add(doorcard.userId);
    allUniqueUsers.add(doorcard.userId);
  });

  const totalDoorcards = recentDoorcards.length;
  const totalUniqueUsers = allUniqueUsers.size;

  console.log("🎯 DOORCARD CAMPUS DISTRIBUTION");
  console.log("-".repeat(40));
  const doorcardStats: CampusStats[] = [];
  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const count = campusDistribution.get(campus) || 0;
    const percentage = (count / totalDoorcards) * 100;
    doorcardStats.push({ campus, count, percentage });
    console.log(
      `${campus.padEnd(8)}: ${count.toString().padStart(4)} doorcards (${percentage.toFixed(1)}%)`,
    );
  });

  console.log(
    `${"TOTAL".padEnd(8)}: ${totalDoorcards.toString().padStart(4)} doorcards (100.0%)\n`,
  );

  console.log("👥 USER DISTRIBUTION BY DOORCARD CAMPUS (Unique Users)");
  console.log("-".repeat(50));
  const userStats: CampusStats[] = [];
  let overlappingUsers = 0;

  // Calculate overlapping users (users who have doorcards at multiple campuses)
  const userCampusCount = new Map<string, Set<string>>();
  recentDoorcards.forEach((doorcard) => {
    if (!userCampusCount.has(doorcard.userId)) {
      userCampusCount.set(doorcard.userId, new Set());
    }
    userCampusCount.get(doorcard.userId)?.add(doorcard.college);
  });

  userCampusCount.forEach((campuses) => {
    if (campuses.size > 1) {
      overlappingUsers++;
    }
  });

  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const uniqueUserCount = usersByCampus.get(campus)?.size || 0;
    const percentage = (uniqueUserCount / totalUniqueUsers) * 100;
    userStats.push({ campus, count: uniqueUserCount, percentage });
    console.log(
      `${campus.padEnd(8)}: ${uniqueUserCount.toString().padStart(4)} users (${percentage.toFixed(1)}%)`,
    );
  });

  console.log(
    `${"OVERLAP".padEnd(8)}: ${overlappingUsers.toString().padStart(4)} users have doorcards at multiple campuses`,
  );
  console.log(
    `${"TOTAL".padEnd(8)}: ${totalUniqueUsers.toString().padStart(4)} unique users\n`,
  );

  // 3. Get top 10 most active users based on combined metrics
  console.log("🏆 TOP 10 MOST ACTIVE USERS - CAMPUS BREAKDOWN");
  console.log("-".repeat(60));

  const userActivityMap = new Map<string, UserActivityData>();

  recentDoorcards.forEach((doorcard) => {
    const userId = doorcard.userId;
    const metrics = doorcard.DoorcardMetrics;

    if (!userActivityMap.has(userId)) {
      // Find the primary campus for this user (campus with most doorcards)
      const userDoorcards = recentDoorcards.filter((d) => d.userId === userId);
      const campusCount = new Map<string, number>();
      userDoorcards.forEach((d) => {
        campusCount.set(d.college, (campusCount.get(d.college) || 0) + 1);
      });
      const primaryCampus = Array.from(campusCount.entries()).reduce(
        (max, current) => (current[1] > max[1] ? current : max),
      )[0];

      userActivityMap.set(userId, {
        userId,
        userName: doorcard.User.name,
        email: doorcard.User.email,
        userCampus: primaryCampus, // Use primary campus instead of user.college
        doorcardCampus: doorcard.college,
        totalViews: 0,
        totalPrints: 0,
        totalShares: 0,
        totalActivity: 0,
      });
    }

    const userData = userActivityMap.get(userId)!;
    if (metrics) {
      userData.totalViews += metrics.totalViews;
      userData.totalPrints += metrics.totalPrints;
      userData.totalShares += metrics.totalShares;
    }
  });

  // Calculate total activity score (weighted: views=1, prints=3, shares=2)
  userActivityMap.forEach((userData) => {
    userData.totalActivity =
      userData.totalViews + userData.totalPrints * 3 + userData.totalShares * 2;
  });

  const topUsers = Array.from(userActivityMap.values())
    .sort((a, b) => b.totalActivity - a.totalActivity)
    .slice(0, 10);

  topUsers.forEach((user, index) => {
    const rank = (index + 1).toString().padStart(2);
    const campus = user.userCampus;
    const name = user.userName || user.email.split("@")[0];
    console.log(
      `${rank}. ${name.substring(0, 25).padEnd(25)} | ${(campus || "UNKNOWN").padEnd(9)} | Score: ${user.totalActivity.toString().padStart(4)} (V:${user.totalViews} P:${user.totalPrints} S:${user.totalShares})`,
    );
  });

  // 4. Analyze top 10 users' campus distribution
  console.log("\n📈 TOP 10 USERS CAMPUS DISTRIBUTION");
  console.log("-".repeat(40));
  const topUsersCampusCount = new Map<string, number>();
  let topUsersNoCampus = 0;

  topUsers.forEach((user) => {
    const campus = user.userCampus || "UNKNOWN";
    topUsersCampusCount.set(campus, (topUsersCampusCount.get(campus) || 0) + 1);
  });

  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    const count = topUsersCampusCount.get(campus) || 0;
    const percentage = (count / 10) * 100;
    console.log(
      `${campus.padEnd(8)}: ${count.toString().padStart(2)}/10 users (${percentage.toFixed(0)}%)`,
    );
  });

  // 5. Usage patterns analysis
  console.log("\n🔍 CAMPUS USAGE PATTERNS");
  console.log("-".repeat(50));

  const campusActivityStats = new Map<
    string,
    {
      totalViews: number;
      totalPrints: number;
      totalShares: number;
      userCount: number;
      doorcardCount: number;
      avgViewsPerUser: number;
      avgPrintsPerUser: number;
      avgSharesPerUser: number;
    }
  >();

  // Initialize stats for each campus
  ["SKYLINE", "CSM", "CANADA"].forEach((campus) => {
    campusActivityStats.set(campus, {
      totalViews: 0,
      totalPrints: 0,
      totalShares: 0,
      userCount: 0,
      doorcardCount: 0,
      avgViewsPerUser: 0,
      avgPrintsPerUser: 0,
      avgSharesPerUser: 0,
    });
  });

  // Aggregate metrics by campus
  userActivityMap.forEach((userData) => {
    const campus = userData.userCampus || "UNKNOWN";
    if (campusActivityStats.has(campus)) {
      const stats = campusActivityStats.get(campus)!;
      stats.totalViews += userData.totalViews;
      stats.totalPrints += userData.totalPrints;
      stats.totalShares += userData.totalShares;
      stats.userCount++;
    }
  });

  // Count doorcards per campus and calculate averages
  campusDistribution.forEach((count, campus) => {
    if (campusActivityStats.has(campus)) {
      const stats = campusActivityStats.get(campus)!;
      stats.doorcardCount = count;

      if (stats.userCount > 0) {
        stats.avgViewsPerUser = stats.totalViews / stats.userCount;
        stats.avgPrintsPerUser = stats.totalPrints / stats.userCount;
        stats.avgSharesPerUser = stats.totalShares / stats.userCount;
      }
    }
  });

  campusActivityStats.forEach((stats, campus) => {
    console.log(`\n${campus}:`);
    console.log(
      `  Users: ${stats.userCount} | Doorcards: ${stats.doorcardCount}`,
    );
    console.log(
      `  Total Activity: ${stats.totalViews} views, ${stats.totalPrints} prints, ${stats.totalShares} shares`,
    );
    console.log(
      `  Avg per User: ${stats.avgViewsPerUser.toFixed(1)} views, ${stats.avgPrintsPerUser.toFixed(1)} prints, ${stats.avgSharesPerUser.toFixed(1)} shares`,
    );
  });

  // 6. Summary insights
  console.log("\n🎯 KEY INSIGHTS");
  console.log("-".repeat(30));

  const mostActiveDoorcardCampus = doorcardStats.reduce((max, current) =>
    current.count > max.count ? current : max,
  );

  const mostActiveUserCampus = userStats.reduce((max, current) =>
    current.count > max.count ? current : max,
  );

  console.log(
    `• Most doorcards: ${mostActiveDoorcardCampus.campus} (${mostActiveDoorcardCampus.count} doorcards, ${mostActiveDoorcardCampus.percentage.toFixed(1)}%)`,
  );
  console.log(
    `• Most users: ${mostActiveUserCampus.campus} (${mostActiveUserCampus.count} users, ${mostActiveUserCampus.percentage.toFixed(1)}%)`,
  );
  console.log(`• Users with overlapping campuses: ${overlappingUsers}`);

  const topUserCampusLeader = Array.from(topUsersCampusCount.entries()).reduce(
    (max, current) => (current[1] > max[1] ? current : max),
    ["", 0],
  );

  if (topUserCampusLeader[0]) {
    console.log(
      `• Top users dominated by: ${topUserCampusLeader[0]} (${topUserCampusLeader[1]}/10 users)`,
    );
  }

  // Additional insight: Users with no campus in their profile
  const usersWithNoCampusProfile = await prisma.user.count({
    where: {
      college: null,
    },
  });

  const totalUsers = await prisma.user.count();

  console.log(
    `• User profile campus assignment: ${totalUsers - usersWithNoCampusProfile}/${totalUsers} users have campus in profile (${(((totalUsers - usersWithNoCampusProfile) / totalUsers) * 100).toFixed(1)}%)`,
  );
  console.log(
    `• Note: Campus analysis based on doorcard assignments since most users lack profile campus data`,
  );

  console.log("\n✅ Analysis complete!\n");
}

analyzeCampusDistribution()
  .catch((error) => {
    console.error("❌ Error analyzing campus distribution:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
