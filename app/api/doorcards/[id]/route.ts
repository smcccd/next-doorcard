import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { z } from "zod";
import { COLLEGES } from "@/types/doorcard";
import { Prisma } from "@prisma/client";

/* ----------------------------------------------------------------------------
 * Schemas / Helpers
 * -------------------------------------------------------------------------- */

const baseUpdateSchema = z.object({
  name: z.string().optional(),
  doorcardName: z.string().optional(),
  officeNumber: z.string().optional(),
  term: z.string().optional(),
  year: z.string().optional(),
  college: z.enum(COLLEGES).optional(),
});

const timeBlockLegacySchema = z.object({
  activity: z.string().optional(),
  name: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  day: z.string().optional(), // legacy
  dayOfWeek: z.string().optional(), // current
  category: z.string().optional(),
  location: z.string().nullable().optional(),
});

const requestSchemaPUT = baseUpdateSchema.extend({
  timeBlocks: z.array(timeBlockLegacySchema).optional(), // legacy create/edit
});

const requestSchemaPATCH = baseUpdateSchema.extend({
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeblocks: z.array(timeBlockLegacySchema).optional(), // new spelling
});

/** Normalize blocks from either shape into appointment create objects */
async function replaceAppointments(
  doorcardId: string,
  blocks: z.infer<typeof timeBlockLegacySchema>[] | undefined
) {
  if (!blocks) return;

  await prisma.appointment.deleteMany({ where: { doorcardId } });

  if (blocks.length === 0) return;

  const data = blocks.map((b) => ({
    doorcardId,
    name: b.activity || b.name || "Office Hours",
    startTime: b.startTime,
    endTime: b.endTime,
    dayOfWeek: (b.dayOfWeek || b.day || "MONDAY") as any,
    category: (b.category as any) || "OFFICE_HOURS",
    location: b.location ?? null,
  }));

  await prisma.appointment.createMany({ data });
}

function includeDoorcard(): Prisma.DoorcardInclude {
  return {
    appointments: {
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }], // <- no `as const`
    },
    user: { select: { name: true, college: true, email: true } },
  };
}

/* ----------------------------------------------------------------------------
 * GET /api/doorcards/[id]
 * -------------------------------------------------------------------------- */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const doorcard = await prisma.doorcard.findFirst({
    where: { id: params.id, userId: auth.user.id },
    include: includeDoorcard(),
  });

  if (!doorcard) {
    return NextResponse.json({ error: "Doorcard not found" }, { status: 404 });
  }

  return NextResponse.json(doorcard);
}

/* ----------------------------------------------------------------------------
 * PUT /api/doorcards/[id]
 * (Full update – legacy editor flow)
 * -------------------------------------------------------------------------- */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = requestSchemaPUT.parse(body);

    // Ensure doorcard belongs to user
    const exists = await prisma.doorcard.findFirst({
      where: { id: params.id, userId: auth.user.id },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Doorcard not found" },
        { status: 404 }
      );
    }

    await replaceAppointments(params.id, parsed.timeBlocks);

    const doorcard = await prisma.doorcard.update({
      where: { id: params.id },
      data: {
        name: parsed.name,
        doorcardName: parsed.doorcardName,
        officeNumber: parsed.officeNumber,
        term: parsed.term,
        year: parsed.year,
        college: parsed.college,
      },
      include: includeDoorcard(),
    });

    return NextResponse.json(doorcard);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }
    console.error("Error updating doorcard (PUT):", err);
    return NextResponse.json(
      { error: "Failed to update doorcard" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------------------------------
 * PATCH /api/doorcards/[id]
 * (Partial update – status / misc fields)
 * -------------------------------------------------------------------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const parsed = requestSchemaPATCH.parse(body);

    const exists = await prisma.doorcard.findFirst({
      where: { id: params.id, userId: auth.user.id },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Doorcard not found" },
        { status: 404 }
      );
    }

    await replaceAppointments(params.id, parsed.timeblocks);

    const doorcard = await prisma.doorcard.update({
      where: { id: params.id },
      data: {
        name: parsed.name,
        doorcardName: parsed.doorcardName,
        officeNumber: parsed.officeNumber,
        term: parsed.term,
        year: parsed.year,
        college: parsed.college,
        isPublic: parsed.isPublic ?? exists.isPublic,
        isActive: parsed.isActive ?? exists.isActive,
        startDate: parsed.startDate
          ? new Date(parsed.startDate)
          : exists.startDate,
        endDate: parsed.endDate ? new Date(parsed.endDate) : exists.endDate,
      },
      include: includeDoorcard(),
    });

    return NextResponse.json(doorcard);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }
    console.error("Error updating doorcard (PATCH):", err);
    return NextResponse.json(
      { error: "Failed to update doorcard" },
      { status: 500 }
    );
  }
}

/* ----------------------------------------------------------------------------
 * DELETE /api/doorcards/[id]
 * -------------------------------------------------------------------------- */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await prisma.doorcard.delete({
      where: { id: params.id, userId: auth.user.id },
    });
    return NextResponse.json({ message: "Doorcard deleted successfully" });
  } catch (err) {
    console.error("Error deleting doorcard:", err);
    return NextResponse.json(
      { error: "Failed to delete doorcard" },
      { status: 500 }
    );
  }
}
