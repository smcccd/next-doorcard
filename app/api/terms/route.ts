import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { TermManager, TermData } from "@/lib/term-management";

// GET /api/terms - Get all terms
export async function GET() {
  try {
    console.log("🔍 Terms API: Starting request...");
    const authResult = await requireAuthUserAPI();

    console.log("🔍 Terms API: Auth check:", !("error" in authResult));
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    console.log("🔍 Terms API: Calling TermManager.getAllTerms()...");
    const terms = await TermManager.getAllTerms();
    console.log("🔍 Terms API: Got terms:", terms.length, "items");

    return NextResponse.json(terms);
  } catch (error) {
    console.error("❌ Terms API Error:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      { error: "Failed to fetch terms" },
      { status: 500 }
    );
  }
}

// POST /api/terms - Create a new term
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthUserAPI();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
    console.error("Error creating term:", error);
    return NextResponse.json(
      { error: "Failed to create term" },
      { status: 500 }
    );
  }
}
