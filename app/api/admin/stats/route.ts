import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get overall stats
    const [
      totalUsers,
      activeUsers,
      totalDoorcards,
      activeDoorcards,
      totalAppointments,
      campusStats,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          Doorcard: {
            some: {},
          },
        },
      }),
      prisma.doorcard.count(),
      prisma.doorcard.count({
        where: { isActive: true },
      }),
      prisma.appointment.count(),
      // Campus breakdown
      prisma.doorcard.groupBy({
        by: ["college"],
        _count: {
          id: true,
        },
      }),
      // Recent activity (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Process campus breakdown
    const campusBreakdown: Record<
      string,
      { users: number; doorcards: number; appointments: number }
    > = {};

    for (const stat of campusStats) {
      const campus = stat.college;
      if (!campus) continue;

      // Get user count for this campus
      const campusUsers = await prisma.user.count({
        where: {
          Doorcard: {
            some: {
              college: campus,
            },
          },
        },
      });

      // Get appointment count for this campus
      const campusAppointments = await prisma.appointment.count({
        where: {
          Doorcard: {
            college: campus,
          },
        },
      });

      campusBreakdown[campus] = {
        users: campusUsers,
        doorcards: stat._count.id,
        appointments: campusAppointments,
      };
    }

    const stats = {
      totalUsers,
      activeUsers,
      totalDoorcards,
      activeDoorcards,
      totalAppointments,
      campusBreakdown,
      recentActivity: {
        newUsers: recentUsers,
        newDoorcards: 0, // TODO: Add doorcard creation tracking
        newAppointments: 0, // TODO: Add appointment creation tracking
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 },
    );
  }
}
