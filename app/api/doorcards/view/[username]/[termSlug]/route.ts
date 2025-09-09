import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { TermSeason } from "@prisma/client";

// GET /api/doorcards/view/[username]/[termSlug]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string; termSlug: string }> }
) {
  try {
    // Require authentication (admin/internal view)
    const auth = await requireAuthUserAPI();
    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }

    const resolvedParams = await params;
    const { username, termSlug } = resolvedParams;

    // Find the target user (allow username, email, or partial name)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username },
          { name: { contains: username } },
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Expect slug like "fall-2024"
    const match = termSlug.match(/^([a-z]+)-(\d{4})$/i);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid term format" },
        { status: 400 }
      );
    }

    const [, rawSeason, year] = match;
    const term = rawSeason.toUpperCase() as TermSeason; // e.g. FALL

    const doorcard = await prisma.doorcard.findFirst({
      where: { userId: user.id, term, year: parseInt(year) },
      include: {
        User: { select: { name: true, college: true } },
        Appointment: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
      },
    });

    if (!doorcard) {
      return NextResponse.json(
        { error: "Doorcard not found for this term" },
        { status: 404 }
      );
    }

    return NextResponse.json(doorcard);
  } catch (error) {
    console.error("Error fetching term doorcard:", error);
    return NextResponse.json(
      { error: "Failed to fetch doorcard" },
      { status: 500 }
    );
  }
}
