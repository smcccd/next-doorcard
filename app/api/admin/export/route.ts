import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("type") || "users";

    let data;
    let filename;
    let headers;

    switch (dataType) {
      case "users":
        data = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            username: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true,
            college: true,
            title: true,
            pronouns: true,
            website: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                Doorcard: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Format user data for CSV
        headers = [
          "ID",
          "Email",
          "Username",
          "First Name",
          "Last Name",
          "Display Name",
          "Role",
          "Campus",
          "Title",
          "Pronouns",
          "Website",
          "Doorcards",
          "Appointments",
          "Created",
          "Updated",
        ];

        data = data.map((user) => [
          user.id,
          user.email,
          user.username,
          user.firstName || "",
          user.lastName || "",
          user.name || "",
          user.role,
          user.college || "",
          user.title || "",
          user.pronouns || "",
          user.website || "",
          user._count.Doorcard,
          0, // appointments count - would need separate query
          user.createdAt.toISOString(),
          user.updatedAt.toISOString(),
        ]);

        filename = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "doorcards":
        data = await prisma.doorcard.findMany({
          include: {
            User: {
              select: {
                email: true,
                name: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                Appointment: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Format doorcard data for CSV
        headers = [
          "ID",
          "Doorcard Name",
          "Faculty Name",
          "Faculty Email",
          "Term",
          "Year",
          "Campus",
          "Office Number",
          "Active",
          "Public",
          "Appointments",
          "Created",
          "Updated",
        ];

        data = data.map((doorcard) => [
          doorcard.id,
          doorcard.doorcardName,
          doorcard.name,
          doorcard.User.email,
          doorcard.term,
          doorcard.year,
          doorcard.college,
          doorcard.officeNumber,
          doorcard.isActive ? "Yes" : "No",
          doorcard.isPublic ? "Yes" : "No",
          doorcard._count.Appointment,
          doorcard.createdAt.toISOString(),
          doorcard.updatedAt.toISOString(),
        ]);

        filename = `doorcards_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;

      case "analytics":
        // Get analytics summary
        const analytics = await prisma.doorcardMetrics.findMany({
          include: {
            Doorcard: {
              include: {
                User: {
                  select: {
                    email: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            totalViews: "desc",
          },
        });

        headers = [
          "Doorcard ID",
          "Doorcard Name",
          "Faculty Name",
          "Faculty Email",
          "Total Views",
          "Unique Views",
          "Total Prints",
          "Total Shares",
          "Last Viewed",
          "Campus",
        ];

        data = analytics.map((metric) => [
          metric.doorcardId,
          metric.Doorcard.doorcardName,
          metric.Doorcard.name,
          metric.Doorcard.User.email,
          metric.totalViews,
          metric.uniqueViews || 0,
          metric.totalPrints,
          metric.totalShares,
          metric.lastViewedAt?.toISOString() || "Never",
          metric.Doorcard.college,
        ]);

        filename = `analytics_export_${new Date().toISOString().split("T")[0]}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid export type" },
          { status: 400 }
        );
    }

    // Convert to CSV format
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        row
          .map((cell) => {
            // Escape cells containing commas or quotes
            const cellStr = String(cell);
            if (cellStr.includes(",") || cellStr.includes('"')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Admin export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
