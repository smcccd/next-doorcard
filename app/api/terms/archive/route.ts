import { NextRequest, NextResponse } from "next/server";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { TermManager } from "@/lib/term-management";

// POST /api/terms/archive - Archive a specific term
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuthUserAPI();

    if ("error" in session) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const body = await request.json();
    const {
      termId,
      archiveDoorcards = true,
    }: { termId: string; archiveDoorcards?: boolean } = body;

    if (!termId) {
      return NextResponse.json(
        { error: "Term ID is required" },
        { status: 400 },
      );
    }

    const result = await TermManager.archiveTerm(termId, archiveDoorcards);

    return NextResponse.json({
      message: "Term archived successfully",
      archivedTerm: result,
    });
  } catch (error) {
    console.error("Error archiving term:", error);
    return NextResponse.json(
      { error: "Failed to archive term" },
      { status: 500 },
    );
  }
}

// GET /api/terms/archive/auto - Auto-archive expired terms
export async function GET() {
  try {
    const session = await requireAuthUserAPI();

    if ("error" in session) {
      return NextResponse.json(
        { error: session.error },
        { status: session.status },
      );
    }

    const archivedCount = await TermManager.autoArchiveExpiredTerms();

    return NextResponse.json({
      message: `Auto-archived ${archivedCount} expired terms`,
      archivedCount,
    });
  } catch (error) {
    console.error("Error auto-archiving terms:", error);
    return NextResponse.json(
      { error: "Failed to auto-archive terms" },
      { status: 500 },
    );
  }
}
