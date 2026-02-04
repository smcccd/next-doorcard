import { NextRequest, NextResponse } from "next/server";
import { requireAdminUserAPI } from "@/lib/require-auth-user";
import { TermManager } from "@/lib/term/term-management";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authResult = await requireAdminUserAPI();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const termId = id;

    const archivedTerm = await TermManager.archiveTerm(termId, true);

    return NextResponse.json({
      success: true,
      term: archivedTerm,
    });
  } catch (error) {
    console.error("Error archiving term:", error);
    return NextResponse.json(
      { error: "Failed to archive term" },
      { status: 500 }
    );
  }
}
