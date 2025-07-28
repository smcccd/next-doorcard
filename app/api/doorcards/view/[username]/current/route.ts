import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    // Auth (admin / internal view)
    const auth = await requireAuthUserAPI();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const resolvedParams = await params;
    const { username } = resolvedParams;

    // Find the target user (allow username, email, or name contains)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username },
          { name: { contains: username, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Active doorcard
    const doorcard = await prisma.doorcard.findFirst({
      where: { userId: user.id, isActive: true },
      include: {
        user: { select: { name: true, college: true } },
        appointments: {
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!doorcard) {
      return NextResponse.json(
        { error: "No active doorcard found" },
        { status: 404 },
      );
    }

    return NextResponse.json(doorcard);
  } catch (error) {
    console.error("Error fetching current doorcard:", error);
    return NextResponse.json(
      { error: "Failed to fetch doorcard" },
      { status: 500 },
    );
  }
}
