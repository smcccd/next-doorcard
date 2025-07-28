import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // Get URL parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const search = searchParams.get("search") || "";
    const campus = searchParams.get("campus") || "";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (campus && campus !== "all") {
      where.doorcards = {
        some: {
          college: campus,
        },
      };
    }

    // Get users with related data
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        college: true,
        createdAt: true,
        _count: {
          select: {
            doorcards: true,
          },
        },
        doorcards: {
          select: {
            college: true,
            _count: {
              select: {
                appointments: true,
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
    });

    // Process the data to include computed fields
    const processedUsers = users.map((user) => {
      const doorcardCount = user._count.doorcards;
      const appointmentCount = user.doorcards.reduce(
        (total, doorcard) => total + doorcard._count.appointments,
        0,
      );

      // Get primary campus from doorcards
      const campuses = user.doorcards.map((d) => d.college).filter(Boolean);
      const primaryCampus = campuses.length > 0 ? campuses[0] : user.college;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        role: user.role,
        college: primaryCampus,
        createdAt: user.createdAt.toISOString(),
        doorcardCount,
        appointmentCount,
        lastActive: null, // TODO: Add last login tracking
      };
    });

    return NextResponse.json(processedUsers);
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
