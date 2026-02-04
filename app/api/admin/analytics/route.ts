import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminUserAPI } from "@/lib/require-auth-user";

export async function GET() {
  const authResult = await requireAdminUserAPI();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {

    // Get overall platform metrics
    const [totalAnalytics, totalMetrics, recentAnalytics] = await Promise.all([
      // Total analytics events
      prisma.doorcardAnalytics.groupBy({
        by: ["eventType"],
        _count: {
          eventType: true,
        },
      }),

      // Aggregate metrics from all doorcards
      prisma.doorcardMetrics.aggregate({
        _sum: {
          totalViews: true,
          uniqueViews: true,
          totalPrints: true,
          totalShares: true,
        },
      }),

      // Recent activity (last 30 days)
      prisma.doorcardAnalytics.groupBy({
        by: ["eventType"],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        _count: {
          eventType: true,
        },
      }),
    ]);

    // Get top performing doorcards
    const topDoorcards = await prisma.doorcard.findMany({
      include: {
        DoorcardMetrics: true,
        User: {
          select: {
            name: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      where: {
        DoorcardMetrics: {
          totalViews: {
            gt: 0,
          },
        },
      },
      orderBy: {
        DoorcardMetrics: {
          totalViews: "desc",
        },
      },
      take: 20,
    });

    // Calculate engagement score for platform
    const totalViews = totalMetrics._sum.totalViews || 0;
    const totalPrints = totalMetrics._sum.totalPrints || 0;
    const totalShares = totalMetrics._sum.totalShares || 0;
    const uniqueViews = totalMetrics._sum.uniqueViews || 0;

    let engagementScore = 0;
    if (totalViews > 0) {
      // Views (40%), Prints (30%), Shares (20%), Unique ratio (10%)
      const viewScore = Math.min((totalViews / 1000) * 40, 40);
      const printScore = Math.min((totalPrints / 100) * 30, 30);
      const shareScore = Math.min((totalShares / 50) * 20, 20);
      const uniqueRatio = uniqueViews > 0 ? (uniqueViews / totalViews) * 10 : 0;

      engagementScore = Math.round(
        viewScore + printScore + shareScore + uniqueRatio
      );
    }

    // Format data for charts
    const analyticsData = {
      totalViews,
      uniqueViews,
      totalPrints,
      totalShares,
      engagementScore,
      recentActivity: [], // You could enhance this with daily breakdowns
    };

    const doorcardAnalytics = topDoorcards.map((card) => ({
      doorcardId: card.id,
      doorcardName: card.doorcardName,
      facultyName:
        card.User.firstName && card.User.lastName
          ? `${card.User.firstName} ${card.User.lastName}`
          : card.User.name || "Unknown",
      totalViews: card.DoorcardMetrics?.totalViews || 0,
      totalPrints: card.DoorcardMetrics?.totalPrints || 0,
      totalShares: card.DoorcardMetrics?.totalShares || 0,
      lastViewedAt: card.DoorcardMetrics?.lastViewedAt?.toISOString(),
      college: card.college,
    }));

    // System-wide statistics
    const systemStats = {
      totalEvents: totalAnalytics.reduce(
        (sum, event) => sum + event._count.eventType,
        0
      ),
      recentEvents: recentAnalytics.reduce(
        (sum, event) => sum + event._count.eventType,
        0
      ),
      eventBreakdown: totalAnalytics.reduce(
        (acc, event) => {
          acc[event.eventType] = event._count.eventType;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    return NextResponse.json({
      analytics: analyticsData,
      doorcards: doorcardAnalytics,
      systemStats,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
