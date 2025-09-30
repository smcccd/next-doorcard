import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TermManager } from "@/lib/term-management";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin users to archive terms
    // You may want to add proper role checking here
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
