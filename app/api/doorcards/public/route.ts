import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const doorcards = await prisma.doorcard.findMany({
      where: {
        isActive: true,
        isPublic: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        appointments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { college: "asc" },
        { user: { name: "asc" } },
      ],
    });

    const publicDoorcards = doorcards.map((doorcard) => ({
      id: doorcard.id,
      name: doorcard.name,
      doorcardName: doorcard.doorcardName,
      officeNumber: doorcard.officeNumber,
      term: doorcard.term,
      year: doorcard.year.toString(),
      college: doorcard.college,
      slug: doorcard.slug,
      user: {
        name: doorcard.user.name || '',
        username: doorcard.user.username,
        college: doorcard.college,
      },
      appointmentCount: doorcard.appointments.length,
      createdAt: doorcard.createdAt.toISOString(),
      updatedAt: doorcard.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      doorcards: publicDoorcards,
      success: true,
      count: publicDoorcards.length,
    });
  } catch (error) {
    console.error("Error fetching public doorcards:", error);
    return NextResponse.json(
      { 
        doorcards: [], 
        success: false, 
        error: "Failed to fetch doorcards" 
      },
      { status: 500 }
    );
  }
}