import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/doorcards/[id]/timeblocks - Get appointments (timeblocks) for a doorcard
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const appointments = await prisma.appointment.findMany({
      where: { doorcardId: id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Convert appointments to timeblock format for compatibility
    const timeblocks = appointments.map((appointment) => ({
      dayOfWeek: appointment.dayOfWeek,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      isAvailable: true, // Appointments are always available
      name: appointment.name,
      category: appointment.category,
      location: appointment.location,
    }));

    return NextResponse.json(timeblocks);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}
