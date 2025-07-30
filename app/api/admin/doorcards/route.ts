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
        { status: 403 }
      );
    }

    // Get URL parameters for pagination and filtering
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50") || 50;
    const offset = parseInt(searchParams.get("offset") || "0") || 0;
    const search = searchParams.get("search") || "";
    const campus = searchParams.get("campus") || "";
    const term = searchParams.get("term") || "";
    const active = searchParams.get("active");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { doorcardName: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { name: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (campus && campus !== "all") {
      where.college = campus;
    }

    if (term) {
      where.term = term;
    }

    if (active === "true") {
      where.isActive = true;
    } else if (active === "false") {
      where.isActive = false;
    }

    // Get doorcards with related data
    const doorcards = await prisma.doorcard.findMany({
      where,
      select: {
        id: true,
        name: true,
        doorcardName: true,
        term: true,
        year: true,
        college: true,
        isActive: true,
        isPublic: true,
        officeNumber: true,
        createdAt: true,
        User: {
          select: {
            email: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            Appointment: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: limit,
      skip: offset,
    });

    // Process the data
    const processedDoorcards = doorcards.map((doorcard) => ({
      id: doorcard.id,
      name: doorcard.name,
      doorcardName: doorcard.doorcardName,
      term: doorcard.term,
      year: doorcard.year,
      college: doorcard.college,
      isActive: doorcard.isActive,
      isPublic: doorcard.isPublic,
      officeNumber: doorcard.officeNumber,
      appointmentCount: doorcard._count.Appointment,
      createdAt: doorcard.createdAt.toISOString(),
      user: {
        email: doorcard.User.email,
        name:
          doorcard.User.firstName && doorcard.User.lastName
            ? `${doorcard.User.firstName} ${doorcard.User.lastName}`
            : doorcard.User.name,
      },
    }));

    return NextResponse.json(processedDoorcards);
  } catch (error) {
    console.error("Admin doorcards error:", error);
    return NextResponse.json(
      { error: "Failed to fetch doorcards" },
      { status: 500 }
    );
  }
}
