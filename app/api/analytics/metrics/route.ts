import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const session = auth.user;

    if (!session?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's doorcards with metrics
    const doorcards = await prisma.doorcard.findMany({
      where: { userId: user.id },
      include: {
        metrics: true,
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    // Calculate real engagement metrics
    const totalDoorcards = doorcards.length;
    const activeDoors = doorcards.filter(
      (doorcard: (typeof doorcards)[0]) => doorcard.isActive
    ).length;

    // Sum up all views and prints from metrics
    const totalViews = doorcards.reduce(
      (sum: number, card: (typeof doorcards)[0]) =>
        sum + (card.metrics?.totalViews || 0),
      0
    );
    const uniqueViews = doorcards.reduce(
      (sum: number, card: (typeof doorcards)[0]) =>
        sum + (card.metrics?.uniqueViews || 0),
      0
    );
    const totalShares = doorcards.reduce(
      (sum: number, card: (typeof doorcards)[0]) =>
        sum + (card.metrics?.totalShares || 0),
      0
    );

    // Calculate avg views per card
    const avgViewsPerCard =
      totalDoorcards > 0 ? Math.round(totalViews / totalDoorcards) : 0;

    // Get recent prints (last 30 days) - we'll use total prints as an approximation for now
    // In a real implementation, you'd query the analytics table with date filters
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnalytics = await prisma.doorcardAnalytics.count({
      where: {
        doorcard: {
          userId: user.id,
        },
        eventType: "PRINT_DOWNLOAD",
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Calculate engagement score based on real data
    let engagementScore = 0;

    if (totalDoorcards > 0) {
      // 1. View frequency (40 points) - Higher views = better engagement
      const viewScore = Math.min((avgViewsPerCard / 25) * 40, 40);
      engagementScore += viewScore;

      // 2. Print usage (25 points) - Prints indicate real-world usage
      const printScore = Math.min(
        (recentAnalytics / (totalDoorcards * 2)) * 25,
        25
      );
      engagementScore += printScore;

      // 3. Active card ratio (20 points)
      const activeRatio = activeDoors / totalDoorcards;
      engagementScore += activeRatio * 20;

      // 4. Recent maintenance (15 points)
      const recentlyUpdated = doorcards.filter(
        (doorcard: (typeof doorcards)[0]) =>
          new Date(doorcard.updatedAt) > thirtyDaysAgo
      ).length;
      const maintenanceScore = (recentlyUpdated / totalDoorcards) * 15;
      engagementScore += maintenanceScore;
    }

    // Get draft count (inactive doorcards)
    const totalDrafts = await prisma.doorcard.count({
      where: { 
        userId: user.id,
        isActive: false
      },
    });

    const metrics = {
      totalDoorcards,
      activeDoors,
      totalDrafts,
      totalViews,
      uniqueViews,
      avgViewsPerCard,
      recentPrints: recentAnalytics,
      totalShares,
      engagementScore: Math.round(engagementScore),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching analytics metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
