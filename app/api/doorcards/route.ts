import { NextResponse, NextRequest } from "next/server";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { doorcardSchema } from "@/lib/validations/doorcard";
import { z } from "zod";
import crypto from "crypto";
import { PrismaErrorHandler, withRetry } from "@/lib/prisma-error-handler";
import { validateAppointments } from "@/lib/appointment-validation";
import { applyRateLimit, apiRateLimit } from "@/lib/rate-limit";
import { sanitizeDoorcardData, sanitizeAppointmentData } from "@/lib/sanitize";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(req, apiRateLimit);
  if (rateLimitResult) return rateLimitResult;
  try {
    const authResult = await requireAuthUserAPI();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { user } = authResult;

    const rawData = await req.json();

    // Sanitize input data before validation
    const sanitizedData = sanitizeDoorcardData(rawData);

    // Sanitize appointments if they exist
    if (
      sanitizedData.appointments &&
      Array.isArray(sanitizedData.appointments)
    ) {
      sanitizedData.appointments = sanitizedData.appointments.map((apt: any) =>
        sanitizeAppointmentData(apt)
      );
    }

    try {
      const validatedData = doorcardSchema.parse(sanitizedData);

      // We'll rely on the database unique constraint to prevent duplicates
      // This eliminates the race condition between check and create

      // Validate appointments for overlaps
      const validation = validateAppointments(
        validatedData.appointments as any,
        []
      );

      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "Appointment validation failed",
            details: validation.errors,
            warnings: validation.warnings,
          },
          { status: 400 }
        );
      }

      // Derive name from user profile
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { firstName: true, lastName: true, title: true, name: true },
      });

      let displayName = "";
      if (userProfile?.firstName && userProfile?.lastName) {
        if (userProfile.title && userProfile.title !== "none") {
          displayName = `${userProfile.title} ${userProfile.firstName} ${userProfile.lastName}`;
        } else {
          displayName = `${userProfile.firstName} ${userProfile.lastName}`;
        }
      } else if (userProfile?.name) {
        displayName = userProfile.name;
      }

      if (!displayName) {
        return NextResponse.json(
          {
            error:
              "Unable to determine your name from profile. Please update your profile first.",
          },
          { status: 400 }
        );
      }

      // Generate a URL-friendly slug
      const baseSlug = `${displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")}-${validatedData.term.toLowerCase()}-${
        validatedData.year
      }`;
      const cleanSlug = baseSlug.replace(/-+/g, "-").replace(/^-|-$/g, "");

      // Try to create the doorcard - let the database constraint prevent duplicates
      const doorcard = await withRetry(() =>
        prisma.doorcard.create({
          data: {
            id: crypto.randomUUID(),
            name: displayName,
            doorcardName: validatedData.doorcardName,
            officeNumber: validatedData.officeNumber,
            term: validatedData.term,
            year: validatedData.year,
            college: validatedData.college,
            isActive: validatedData.isActive,
            isPublic: validatedData.isPublic,
            slug: cleanSlug,
            userId: user.id,
            Appointment: {
              create: validatedData.appointments.map((apt) => ({
                id: crypto.randomUUID(),
                name: apt.name,
                startTime: apt.startTime,
                endTime: apt.endTime,
                dayOfWeek: apt.dayOfWeek,
                category: apt.category,
                location: apt.location,
                updatedAt: new Date(),
              })),
            },
            updatedAt: new Date(),
          },
          include: {
            Appointment: true,
          },
        })
      );

      const response: any = { ...doorcard };
      if (validation.warnings && validation.warnings.length > 0) {
        response.warnings = validation.warnings;
      }

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation error", details: error.errors },
          { status: 400 }
        );
      }

      // Handle unique constraint violations
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "P2002"
      ) {
        const meta = (error as any).meta;
        if (meta?.target?.includes("userId")) {
          return NextResponse.json(
            {
              error:
                "A doorcard already exists for this term and campus. Please edit your existing doorcard instead.",
              code: "DUPLICATE_DOORCARD",
            },
            { status: 409 }
          );
        } else if (meta?.target?.includes("doorcardId")) {
          return NextResponse.json(
            {
              error:
                "Duplicate appointment detected. Each time slot can only have one appointment.",
              code: "DUPLICATE_APPOINTMENT",
            },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            {
              error: "A duplicate entry was detected. Please check your data.",
              code: "DUPLICATE_ENTRY",
            },
            { status: 409 }
          );
        }
      }

      throw error;
    }
  } catch (error) {
    logger.error("Error creating doorcard", error);
    return PrismaErrorHandler.handle(error);
  }
}

export async function GET() {
  try {
    const authResult = await requireAuthUserAPI();
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { user } = authResult;

    const doorcards = await withRetry(() =>
      prisma.doorcard.findMany({
        where: {
          userId: user.id,
        },
        include: {
          User: {
            select: {
              name: true,
              username: true,
              email: true,
              college: true,
            },
          },
          Appointment: {
            orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
          },
        },
      })
    );

    return NextResponse.json(doorcards);
  } catch (error) {
    logger.error("Error fetching doorcards", error);
    return PrismaErrorHandler.handle(error);
  }
}
