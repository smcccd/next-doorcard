import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/doorcards/admin - Get all doorcards for admin oversight
export async function GET() {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    console.log("🔍 Doorcards Admin API: Starting request...");
    // const session = await getServerSession(authOptions); // This line is removed

    // console.log("🔍 Doorcards Admin API: Session check:", !!session); // This line is removed
    // if (!session) { // This line is removed
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // This line is removed
    // } // This line is removed

    console.log("🔍 Doorcards Admin API: Querying database...");
    const doorcards = await prisma.doorcard.findMany({
      include: {
        User: {
          select: {
            name: true,
            email: true,
            username: true,
            college: true,
          },
        },
        _count: {
          select: {
            Appointment: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    console.log(
      "🔍 Doorcards Admin API: Got doorcards:",
      doorcards.length,
      "items"
    );
    return NextResponse.json(doorcards);
  } catch (error) {
    console.error("❌ Doorcards Admin API Error:", error);
    console.error(
      "❌ Error stack:",
      error instanceof Error ? error.stack : "No stack"
    );
    return NextResponse.json(
      { error: "Failed to fetch doorcards" },
      { status: 500 }
    );
  }
}
