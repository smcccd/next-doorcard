import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const resolvedParams = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (adminUser?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 },
      );
    }

    // Get detailed user information
    const user = await prisma.user.findUnique({
      where: { id: resolvedParams.userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        college: true,
        title: true,
        pronouns: true,
        website: true,
        displayFormat: true,
        createdAt: true,
        updatedAt: true,
        Doorcard: {
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
            updatedAt: true,
            _count: {
              select: {
                appointments: true,
              },
            },
            appointments: {
              select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
                dayOfWeek: true,
                category: true,
                location: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
          orderBy: [
            { isActive: "desc" },
            { year: "desc" },
            { term: "desc" },
            { createdAt: "desc" },
          ],
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Process the data
    const processedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      college: user.college,
      title: user.title,
      pronouns: user.pronouns,
      website: user.website,
      displayFormat: user.displayFormat,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      doorcards: user.doorcards.map((doorcard) => ({
        id: doorcard.id,
        name: doorcard.name,
        doorcardName: doorcard.doorcardName,
        term: doorcard.term,
        year: doorcard.year,
        college: doorcard.college,
        isActive: doorcard.isActive,
        isPublic: doorcard.isPublic,
        officeNumber: doorcard.officeNumber,
        createdAt: doorcard.createdAt.toISOString(),
        updatedAt: doorcard.updatedAt.toISOString(),
        appointmentCount: doorcard._count.appointments,
        appointments: doorcard.appointments,
      })),
      totalDoorcards: user.doorcards.length,
      activeDoorcards: user.doorcards.filter((d) => d.isActive).length,
      totalAppointments: user.doorcards.reduce(
        (total, doorcard) => total + doorcard._count.appointments,
        0,
      ),
    };

    return NextResponse.json(processedUser);
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 },
    );
  }
}
