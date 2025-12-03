import { logger } from "@/lib/logger";
import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { PrismaErrorHandler } from "@/lib/prisma-error-handler";
import { formatApiError, ErrorCodes } from "@/lib/error-handler";
import { z } from "zod";
import { COLLEGES } from "@/types/doorcard";
import { Prisma, College, TermSeason } from "@prisma/client";
import { getTermStatus } from "@/lib/doorcard-status";
import { randomUUID } from "crypto";
import {
  validateAppointments,
  normalizeAppointments,
  timeBlockSchema,
} from "@/lib/appointment-validation";
import { sanitizeDoorcardData, sanitizeAppointmentData } from "@/lib/sanitize";

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

const timeBlockLegacySchema = timeBlockSchema;

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
  if (!blocks) return { success: true };

  // Get existing appointments for validation
  const existingAppointments = await prisma.appointment.findMany({
    where: { doorcardId },
  });

  // Validate appointments
  const normalized = normalizeAppointments(blocks, doorcardId);
  const validation = validateAppointments(blocks as any, existingAppointments);

  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  // Delete existing and create new appointments atomically
  try {
    await prisma.$transaction(async (tx) => {
      // Delete all existing appointments for this doorcard
      await tx.appointment.deleteMany({ where: { doorcardId } });

      // If no new appointments, we're done
      if (blocks.length === 0) return;

      // Create new appointments
      const data = normalized.map((b) => ({
        id: b.id || randomUUID(),
        doorcardId: b.doorcardId,
        name: b.name,
        startTime: b.startTime,
        endTime: b.endTime,
        dayOfWeek: b.dayOfWeek,
        category: b.category,
        location: b.location,
        updatedAt: new Date(),
      }));

      await tx.appointment.createMany({ data });
    });

    return { success: true, warnings: validation.warnings };
  } catch (error) {
    logger.error("Transaction failed in replaceAppointments:", error);

    // Handle unique constraint violation (duplicate appointment)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return {
        success: false,
        errors: [
          "Duplicate appointment detected. Each time slot can only have one appointment.",
        ],
        warnings: validation.warnings,
      };
    }

    return {
      success: false,
      errors: ["Failed to update appointments. Please try again."],
      warnings: validation.warnings,
    };
  }
}

function includeDoorcard(): Prisma.DoorcardInclude {
  return {
    Appointment: {
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }], // <- no `as const`
    },
    User: { select: { name: true, college: true, email: true } },
  };
}

/* ----------------------------------------------------------------------------
 * GET /api/doorcards/[id]
 * -------------------------------------------------------------------------- */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthUserAPI();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const resolvedParams = await params;
    const doorcard = await prisma.doorcard.findFirst({
      where: { id: resolvedParams.id, userId: auth.user.id },
      include: includeDoorcard(),
    });

    if (!doorcard) {
      return NextResponse.json({ error: "Doorcard not found" }, { status: 404 });
    }

    return NextResponse.json(doorcard);
  } catch (error) {
    logger.error("Error fetching doorcard:", error);
    return PrismaErrorHandler.handle(error);
  }
}

/* ----------------------------------------------------------------------------
 * PUT /api/doorcards/[id]
 * (Full update – legacy editor flow)
 * -------------------------------------------------------------------------- */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rawBody = await req.json();

    // Sanitize doorcard data
    const sanitizedData = sanitizeDoorcardData(rawBody);

    // Sanitize time blocks if they exist
    if (sanitizedData.timeBlocks && Array.isArray(sanitizedData.timeBlocks)) {
      sanitizedData.timeBlocks = sanitizedData.timeBlocks.map((block: any) =>
        sanitizeAppointmentData(block)
      );
    }

    const parsed = requestSchemaPUT.parse(sanitizedData);

    const resolvedParams = await params;
    // Ensure doorcard belongs to user and is not archived
    const exists = await prisma.doorcard.findFirst({
      where: { id: resolvedParams.id, userId: auth.user.id },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Doorcard not found" },
        { status: 404 }
      );
    }

    // Prevent editing archived doorcards
    const termStatus = getTermStatus(exists);
    if (termStatus === "past") {
      return NextResponse.json(
        {
          error:
            "Cannot edit archived doorcards. Archived doorcards are read-only to maintain data integrity.",
        },
        { status: 403 }
      );
    }

    const appointmentResult = await replaceAppointments(
      resolvedParams.id,
      parsed.timeBlocks
    );

    if (!appointmentResult.success) {
      return NextResponse.json(
        {
          error: "Appointment validation failed",
          details: appointmentResult.errors,
          warnings: appointmentResult.warnings,
        },
        { status: 400 }
      );
    }

    const doorcard = await prisma.doorcard.update({
      where: { id: resolvedParams.id },
      data: {
        name: parsed.name,
        doorcardName: parsed.doorcardName,
        officeNumber: parsed.officeNumber,
        term: parsed.term as TermSeason,
        year: parsed.year ? parseInt(parsed.year.toString()) : undefined,
        college: parsed.college as College,
      },
      include: includeDoorcard(),
    });

    const response: any = { ...doorcard };
    if (appointmentResult.warnings && appointmentResult.warnings.length > 0) {
      response.warnings = appointmentResult.warnings;
    }

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }
    return formatApiError(
      err,
      500,
      "Failed to update doorcard",
      ErrorCodes.UPDATE_FAILED,
      { tags: { api_route: "/api/doorcards/[id]", method: "PUT" } }
    );
  }
}

/* ----------------------------------------------------------------------------
 * PATCH /api/doorcards/[id]
 * (Partial update – status / misc fields)
 * -------------------------------------------------------------------------- */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rawBody = await req.json();

    // Sanitize doorcard data
    const sanitizedData = sanitizeDoorcardData(rawBody);

    // Sanitize timeblocks if they exist
    if (sanitizedData.timeblocks && Array.isArray(sanitizedData.timeblocks)) {
      sanitizedData.timeblocks = sanitizedData.timeblocks.map((block: any) =>
        sanitizeAppointmentData(block)
      );
    }

    const parsed = requestSchemaPATCH.parse(sanitizedData);

    const resolvedParams = await params;
    const exists = await prisma.doorcard.findFirst({
      where: { id: resolvedParams.id, userId: auth.user.id },
    });
    if (!exists) {
      return NextResponse.json(
        { error: "Doorcard not found" },
        { status: 404 }
      );
    }

    // Prevent editing archived doorcards
    const termStatus = getTermStatus(exists);
    if (termStatus === "past") {
      return NextResponse.json(
        {
          error:
            "Cannot edit archived doorcards. Archived doorcards are read-only to maintain data integrity.",
        },
        { status: 403 }
      );
    }

    const appointmentResult = await replaceAppointments(
      resolvedParams.id,
      parsed.timeblocks
    );

    if (!appointmentResult.success) {
      return NextResponse.json(
        {
          error: "Appointment validation failed",
          details: appointmentResult.errors,
          warnings: appointmentResult.warnings,
        },
        { status: 400 }
      );
    }

    const doorcard = await prisma.doorcard.update({
      where: { id: resolvedParams.id },
      data: {
        name: parsed.name,
        doorcardName: parsed.doorcardName,
        officeNumber: parsed.officeNumber,
        term: parsed.term as any,
        year: parsed.year ? parseInt(parsed.year.toString()) : undefined,
        college: parsed.college as any,
        isPublic: parsed.isPublic ?? exists.isPublic,
        isActive: parsed.isActive ?? exists.isActive,
      },
      include: includeDoorcard(),
    });

    const response: any = { ...doorcard };
    if (appointmentResult.warnings && appointmentResult.warnings.length > 0) {
      response.warnings = appointmentResult.warnings;
    }

    return NextResponse.json(response);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten() },
        { status: 400 }
      );
    }
    return formatApiError(
      err,
      500,
      "Failed to update doorcard",
      ErrorCodes.UPDATE_FAILED,
      { tags: { api_route: "/api/doorcards/[id]", method: "PATCH" } }
    );
  }
}

/* ----------------------------------------------------------------------------
 * DELETE /api/doorcards/[id]
 * -------------------------------------------------------------------------- */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const resolvedParams = await params;
    await prisma.doorcard.delete({
      where: { id: resolvedParams.id, userId: auth.user.id },
    });
    return NextResponse.json({ message: "Doorcard deleted successfully" });
  } catch (err) {
    logger.error("Error deleting doorcard:", err);
    return PrismaErrorHandler.handle(err);
  }
}
