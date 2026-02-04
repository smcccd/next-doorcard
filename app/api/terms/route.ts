import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserAPI, requireAdminUserAPI } from "@/lib/require-auth-user";
import { TermManager, TermData } from "@/lib/term/term-management";

// GET /api/terms - Get all terms
export async function GET() {
  try {
    logger.debug("🔍 Terms API: Starting request...");
    const authResult = await requireAuthUserAPI();

    logger.debug("🔍 Terms API: Auth check:", !("error" in authResult));
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    logger.debug("🔍 Terms API: Calling TermManager.getAllTerms()...");
    const terms = await TermManager.getAllTerms();
    logger.debug("🔍 Terms API: Got terms", {
      count: terms.length,
      unit: "items",
    });

    return NextResponse.json(terms);
  } catch (error) {
    logger.error("❌ Terms API Error:", error);
    logger.error("❌ Error stack:", {
      stack: error instanceof Error ? error.stack : "No stack",
    });
    return NextResponse.json(
      { error: "Failed to fetch terms" },
      { status: 500 }
    );
  }
}

// POST /api/terms - Create a new term (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminUserAPI();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const body: TermData = await request.json();

    // Validate required fields
    if (
      !body.name ||
      !body.year ||
      !body.season ||
      !body.startDate ||
      !body.endDate
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const term = await TermManager.createTerm({
      ...body,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    logger.error("Error creating term:", error);
    return NextResponse.json(
      { error: "Failed to create term" },
      { status: 500 }
    );
  }
}
