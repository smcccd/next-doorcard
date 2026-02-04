"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { timeBlockSchema } from "@/lib/validations/doorcard-edit";
import {
  validateAppointments,
  normalizeAppointments,
} from "@/lib/doorcard/appointment-validation";
import { captureAndLogError } from "@/lib/api/error-handler";
import { deriveDisplayName, getCollegeDisplayName } from "@/lib/display-name";
import {
  TERM_DISPLAY_VALUES,
  CAMPUS_VALUES,
  toEnumSeason,
} from "@/lib/term/term-management";
import type { College } from "@prisma/client";
import crypto from "crypto";

/* -------------------------------------------------------------------------- */
/* Schemas / helpers                                                          */
/* -------------------------------------------------------------------------- */

const campusTermSchema = z.object({
  term: z.enum(TERM_DISPLAY_VALUES),
  year: z.coerce.number().int().min(2000).max(2100), // coerce form value to number
  college: z.enum(CAMPUS_VALUES, {
    errorMap: () => ({ message: "Campus is required" }),
  }),
});

const personalInfoSchema = z.object({
  doorcardName: z.string().optional().default(""),
  officeNumber: z.string().min(1, "Office number is required"),
});

type ActionResult = { success: boolean; message?: string };

async function requireAuth() {
  const authResult = await requireAuthUserAPI();
  if ("error" in authResult) throw new Error(authResult.error);
  return authResult.user;
}

function handleActionError(err: unknown, context?: { action?: string; doorcardId?: string }): ActionResult {
  // Re-throw redirect errors - they should not be handled as regular errors
  if (err instanceof Error && err.message === "NEXT_REDIRECT") {
    throw err;
  }

  // Don't capture validation errors to Sentry (expected user input errors)
  if (err instanceof z.ZodError) {
    return {
      success: false,
      message: `Validation failed: ${err.errors
        .map((e) => e.message)
        .join(", ")}`,
    };
  }

  // Capture unexpected errors to Sentry
  captureAndLogError(err, {
    tags: {
      component: "server-action",
      action: context?.action || "unknown",
    },
    extra: { doorcardId: context?.doorcardId },
  });

  return {
    success: false,
    message:
      err instanceof Error ? err.message : "An unexpected error occurred",
  };
}

/* -------------------------------------------------------------------------- */
/* Actions                                                                    */
/* -------------------------------------------------------------------------- */

export async function validateCampusTerm(
  doorcardId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!doorcardId) {
    return { success: false, message: "Doorcard ID is required" };
  }
  try {
    const user = await requireAuth();
    const data = campusTermSchema.parse({
      term: formData.get("term"),
      year: formData.get("year"),
      college: formData.get("college"),
    });

    // Update doorcard - multiple doorcards per term are now allowed
    await prisma.doorcard.update({
      where: { id: doorcardId, userId: user.id },
      data: {
        term: toEnumSeason(data.term),
        year: data.year,
        college: data.college as College,
      },
    });

    revalidatePath(`/doorcard/${doorcardId}/edit`);
    redirect(`/doorcard/${doorcardId}/edit?step=1`);
  } catch (err) {
    return handleActionError(err, { action: "validateCampusTerm", doorcardId });
  }
}

export async function updateBasicInfo(
  doorcardId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!doorcardId) {
    return { success: false, message: "Doorcard ID is required" };
  }
  try {
    const user = await requireAuth();
    const data = personalInfoSchema.parse({
      doorcardName: formData.get("doorcardName"),
      officeNumber: formData.get("officeNumber"),
    });

    // Get the user's name from their profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        title: true,
        name: true,
      },
    });

    // Build the display name from user profile
    const displayName = deriveDisplayName(userProfile || {});

    if (displayName === "Faculty Member") {
      return {
        success: false,
        message:
          "Unable to determine your name from profile. Please update your profile first.",
      };
    }

    await prisma.doorcard.update({
      where: { id: doorcardId, userId: user.id },
      data: {
        name: displayName,
        doorcardName: data.doorcardName,
        officeNumber: data.officeNumber,
      },
    });
  } catch (err) {
    return handleActionError(err, { action: "updateBasicInfo", doorcardId });
  }

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  redirect(`/doorcard/${doorcardId}/edit?step=2`);
}

export async function updateTimeBlocks(
  doorcardId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  if (!doorcardId) {
    return { success: false, message: "Doorcard ID is required" };
  }
  try {
    const user = await requireAuth();

    const doorcard = await prisma.doorcard.findFirst({
      where: { id: doorcardId, userId: user.id },
      select: { id: true },
    });
    if (!doorcard) {
      return {
        success: false,
        message: "Not authorized to modify this doorcard.",
      };
    }

    const json = formData.get("timeBlocks")?.toString();
    if (!json) return { success: false, message: "No time blocks provided" };

    const blocks = z.array(timeBlockSchema).parse(JSON.parse(json));
    if (blocks.length === 0) {
      return { success: false, message: "At least one time block is required" };
    }

    // Map the blocks to the format expected by validateAppointments
    const blocksForValidation = blocks.map((b) => ({
      ...b,
      dayOfWeek: b.day, // Map 'day' to 'dayOfWeek'
      name: b.activity,
    }));

    // Since we're replacing ALL appointments, we don't need to compare against existing ones
    // Just validate the new blocks against themselves
    const validation = validateAppointments(blocksForValidation, []);

    if (!validation.isValid) {
      return {
        success: false,
        message: `Appointment validation failed: ${validation.errors.join(". ")}`,
      };
    }

    // Use transaction to ensure atomic appointment replacement
    try {
      await prisma.$transaction(async (tx) => {
        // Delete all existing appointments for this doorcard
        await tx.appointment.deleteMany({ where: { doorcardId } });

        // Create new appointments
        await tx.appointment.createMany({
          data: blocks.map((b) => ({
            id: crypto.randomUUID(),
            doorcardId,
            name: b.activity,
            startTime: b.startTime,
            endTime: b.endTime,
            dayOfWeek: b.day,
            category: b.category || "OFFICE_HOURS",
            location: b.location,
            updatedAt: new Date(),
          })),
        });
      });
    } catch (err: any) {
      // Handle unique constraint violation (duplicate appointment)
      if (err.code === "P2002") {
        return {
          success: false,
          message:
            "Duplicate appointment detected. Each time slot can only have one appointment.",
        };
      }
      throw err; // Re-throw other errors to be handled by outer catch
    }
  } catch (err) {
    return handleActionError(err, { action: "updateTimeBlocks", doorcardId });
  }

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  redirect(`/doorcard/${doorcardId}/edit?step=3`);
}

export async function publishDoorcard(doorcardId: string) {
  try {
    const user = await requireAuth();
    await prisma.doorcard.update({
      where: { id: doorcardId, userId: user.id },
      data: { isActive: true, isPublic: true },
    });

    revalidatePath(`/doorcard/${doorcardId}/edit`);
    revalidatePath("/dashboard");
  } catch (err) {
    captureAndLogError(err, {
      tags: { component: "server-action", action: "publishDoorcard" },
      extra: { doorcardId },
    });
    throw err;
  }
  redirect("/dashboard");
}

export async function createDoorcardWithCampusTerm(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let newDoorcardId: string | null = null;
  try {
    const user = await requireAuth();
    const data = campusTermSchema.parse({
      term: formData.get("term"),
      year: formData.get("year"),
      college: formData.get("college"),
    });

    const existing = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        college: data.college as College,
        term: toEnumSeason(data.term),
        year: data.year,
      },
    });
    if (existing) {
      return {
        success: false,
        message: `You already have a doorcard for ${getCollegeDisplayName(
          data.college
        )} - ${data.term} ${data.year}. Please edit "${
          existing.doorcardName
        }" instead.`,
      };
    }

    // Get user's profile info for smart defaults
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        firstName: true,
        lastName: true,
        title: true,
        name: true,
        college: true,
      },
    });

    // Create smart default display name using shared utility
    const defaultDisplayName = deriveDisplayName({
      ...userProfile,
      email: user.email,
    });

    // Create smart default doorcard title
    const defaultDoorcardTitle = `${defaultDisplayName}'s ${data.term} ${data.year} Doorcard`;

    const newDoorcard = await prisma.doorcard.create({
      data: {
        id: crypto.randomUUID(),
        name: defaultDisplayName,
        doorcardName: defaultDoorcardTitle,
        officeNumber: "",
        term: toEnumSeason(data.term),
        year: data.year,
        college: data.college as College,
        isActive: false,
        isPublic: false,
        userId: user.id,
        updatedAt: new Date(),
      },
    });
    newDoorcardId = newDoorcard.id;
  } catch (err) {
    return handleActionError(err, { action: "createDoorcardWithCampusTerm" });
  }

  // Revalidate paths to ensure fresh data
  revalidatePath(`/doorcard/${newDoorcardId}/edit`);
  revalidatePath("/dashboard");
  redirect(`/doorcard/${newDoorcardId}/edit?step=1`);
}
