import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrismaErrorHandler } from "@/lib/prisma-error-handler";
import { z } from "zod";

const queryParamsSchema = z.object({
  limit: z.string().optional().transform((val) => {
    const parsed = parseInt(val || "50");
    return isNaN(parsed) || parsed < 1 || parsed > 100 ? 50 : parsed;
  }),
  offset: z.string().optional().transform((val) => {
    const parsed = parseInt(val || "0");
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }),
  search: z.string().optional().transform((val) => (val || "").trim()),
  campus: z.enum(["all", "SKYLINE", "CSM", "CANADA", "DISTRICT_OFFICE"]).optional().default("all"),
});

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
        { status: 403 }
      );
    }

    // Get and validate URL parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const rawParams = {
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"), 
      search: searchParams.get("search"),
      campus: searchParams.get("campus"),
    };

    const validationResult = queryParamsSchema.safeParse(rawParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { limit, offset, search, campus } = validationResult.data;

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
            Doorcard: true,
          },
        },
        Doorcard: {
          select: {
            college: true,
            _count: {
              select: {
                Appointment: true,
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
      const doorcardCount = user._count.Doorcard;
      const appointmentCount = user.Doorcard.reduce(
        (total, doorcard) => total + doorcard._count.Appointment,
        0
      );

      // Get primary campus from doorcards
      const campuses = user.Doorcard.map((d) => d.college).filter(Boolean);
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
    return PrismaErrorHandler.handle(error);
  }
}
