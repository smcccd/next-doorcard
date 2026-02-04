import { NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const authResult = await requireAdminUserAPI();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
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
      recentDoorcards,
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
      // Campus breakdown with aggregated data
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
      // Recent doorcards (last 7 days)
      prisma.doorcard.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Get campus data with single aggregated query
    const campusList = campusStats
      .map((stat) => stat.college)
      .filter((college) => college !== null);

    const [campusUserData, campusAppointmentData] = await Promise.all([
      // Get user counts per campus
      prisma.user.findMany({
        where: {
          Doorcard: {
            some: {
              college: {
                in: campusList,
              },
            },
          },
        },
        select: {
          id: true,
          Doorcard: {
            select: {
              college: true,
            },
            distinct: ["college"],
          },
        },
      }),
      // Get appointment counts per campus
      prisma.appointment.groupBy({
        by: ["doorcardId"],
        where: {
          Doorcard: {
            college: {
              in: campusList,
            },
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get doorcard to campus mapping for appointments
    const doorcardIds = campusAppointmentData.map((item) => item.doorcardId);
    const doorcardCampusMap = await prisma.doorcard.findMany({
      where: {
        id: {
          in: doorcardIds,
        },
      },
      select: {
        id: true,
        college: true,
      },
    });

    // Process campus breakdown
    const campusBreakdown: Record<
      string,
      { users: number; doorcards: number; appointments: number }
    > = {};

    // Count unique users per campus
    const campusUserCount: Record<string, Set<string>> = {};
    campusUserData.forEach((user) => {
      user.Doorcard.forEach((doorcard) => {
        if (doorcard.college) {
          if (!campusUserCount[doorcard.college]) {
            campusUserCount[doorcard.college] = new Set();
          }
          campusUserCount[doorcard.college].add(user.id);
        }
      });
    });

    // Count appointments per campus
    const campusAppointmentCount: Record<string, number> = {};
    const campusMap = new Map(doorcardCampusMap.map((d) => [d.id, d.college]));
    campusAppointmentData.forEach((appointment) => {
      const campus = campusMap.get(appointment.doorcardId);
      if (campus) {
        campusAppointmentCount[campus] =
          (campusAppointmentCount[campus] || 0) + appointment._count.id;
      }
    });

    // Build final campus breakdown
    for (const stat of campusStats) {
      const campus = stat.college;
      if (!campus) continue;

      campusBreakdown[campus] = {
        users: campusUserCount[campus]?.size || 0,
        doorcards: stat._count.id,
        appointments: campusAppointmentCount[campus] || 0,
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
        newDoorcards: recentDoorcards,
        newAppointments: 0, // TODO: Add appointment creation tracking
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
