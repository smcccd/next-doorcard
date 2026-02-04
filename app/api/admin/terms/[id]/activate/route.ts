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

    const activatedTerm = await TermManager.transitionToNewTerm(termId, {
      archiveOldTerm: true,
      activateNewTerm: true,
      archiveOldDoorcards: false, // Don't automatically archive old doorcards on transition
    });

    return NextResponse.json({
      success: true,
      term: activatedTerm,
    });
  } catch (error) {
    console.error("Error activating term:", error);
    return NextResponse.json(
      { error: "Failed to activate term" },
      { status: 500 }
    );
  }
}
