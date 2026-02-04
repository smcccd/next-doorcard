import { logger } from "@/lib/logger";
import { requireAdminUserAPI } from "@/lib/require-auth-user";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/doorcards/admin - Get all doorcards for admin oversight
export async function GET() {
  // SECURITY: This endpoint returns ALL doorcards, so it requires admin role
  const authResult = await requireAdminUserAPI();
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    logger.debug("🔍 Doorcards Admin API: Starting request...");
    // const session = await getServerSession(authOptions); // This line is removed

    // logger.debug("🔍 Doorcards Admin API: Session check:", !!session); // This line is removed
    // if (!session) { // This line is removed
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); // This line is removed
    // } // This line is removed

    logger.debug("🔍 Doorcards Admin API: Querying database...");
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

    logger.debug("🔍 Doorcards Admin API: Got doorcards", {
      count: doorcards.length,
      unit: "items",
    });
    return NextResponse.json(doorcards);
  } catch (error) {
    logger.error("❌ Doorcards Admin API Error:", error);
    logger.error("❌ Error stack:", {
      stack: error instanceof Error ? error.stack : "No stack",
    });
    return NextResponse.json(
      { error: "Failed to fetch doorcards" },
      { status: 500 }
    );
  }
}
