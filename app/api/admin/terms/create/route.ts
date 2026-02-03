import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TermManager } from "@/lib/term-management";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin users to create terms
    // You may want to add proper role checking here
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
