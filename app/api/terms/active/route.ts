// app/api/terms/active/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAcademicTerm } from "@/lib/active-term";

export async function GET() {
  try {
    // First, try to get the active term from database
    const activeTerm = await prisma.term.findFirst({
      where: {
        isActive: true,
      },
    });

    if (activeTerm) {
      // Return database term
      return NextResponse.json({
        activeTerm: {
          id: activeTerm.id,
          name: activeTerm.name,
          season: activeTerm.season,
          year: activeTerm.year,
          startDate: activeTerm.startDate,
          endDate: activeTerm.endDate,
          isFromDatabase: true,
        },
      });
    }

    // Fallback to computed current term
    const computedTerm = getCurrentAcademicTerm();

    return NextResponse.json({
      activeTerm: {
        id: null,
        name: computedTerm.displayName,
        season: computedTerm.season,
        year: computedTerm.year,
        startDate: null,
        endDate: null,
        isFromDatabase: false,
      },
    });
  } catch (error) {
    console.error("Error fetching active term:", error);

    // Return computed term as fallback
    const computedTerm = getCurrentAcademicTerm();

    return NextResponse.json({
      activeTerm: {
        id: null,
        name: computedTerm.displayName,
        season: computedTerm.season,
        year: computedTerm.year,
        startDate: null,
        endDate: null,
        isFromDatabase: false,
      },
    });
  }
}
