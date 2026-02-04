import { NextRequest, NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/require-auth-user";
import { TermManager } from "@/lib/term/term-management";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminUserAPI();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { name, year, season, startDate, endDate, isActive, isUpcoming } =
      body;

    // Validate required fields
    if (!name || !year || !season || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    const termData = {
      name,
      year,
      season,
      startDate: start,
      endDate: end,
      isActive: Boolean(isActive),
      isArchived: false,
      isUpcoming: Boolean(isUpcoming),
      archiveDate: undefined,
    };

    const newTerm = await TermManager.createTerm(termData);

    return NextResponse.json({
      success: true,
      term: newTerm,
    });
  } catch (error) {
    console.error("Error creating term:", error);
    return NextResponse.json(
      { error: "Failed to create term" },
      { status: 500 }
    );
  }
}
