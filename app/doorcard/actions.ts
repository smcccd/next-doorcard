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
} from "@/lib/appointment-validation";
import type { College, TermSeason } from "@prisma/client";
import crypto from "crypto";

/* -------------------------------------------------------------------------- */
/* Schemas / helpers                                                          */
/* -------------------------------------------------------------------------- */

const CAMPUS_VALUES = ["SKYLINE", "CSM", "CANADA"] as const;
const TERM_DISPLAY = ["Fall", "Spring", "Summer"] as const;

const campusTermSchema = z.object({
  term: z.enum(TERM_DISPLAY),
  year: z.coerce.number().int().min(2000).max(2100), // coerce form value to number
  college: z.enum(CAMPUS_VALUES, {
    errorMap: () => ({ message: "Campus is required" }),
  }),
});

function toEnumSeason(display: (typeof TERM_DISPLAY)[number]): TermSeason {
  return display.toUpperCase() as TermSeason; // "Fall" -> "FALL"
}

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

function campusLabel(code: string) {
  switch (code) {
    case "SKYLINE":
      return "Skyline College";
    case "CSM":
      return "College of San Mateo";
    case "CANADA":
      return "Cañada College";
    default:
      return code;
  }
}

function handleActionError(err: unknown): ActionResult {
  // Re-throw redirect errors - they should not be handled as regular errors
  if (err instanceof Error && err.message === "NEXT_REDIRECT") {
    throw err;
  }

  if (err instanceof z.ZodError) {
    return {
      success: false,
      message: `Validation failed: ${err.errors
        .map((e) => e.message)
        .join(", ")}`,
    };
  }
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
    return handleActionError(err);
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
      return { success: false, message: "Unable to determine your name from profile. Please update your profile first." };
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
    return handleActionError(err);
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
    return handleActionError(err);
  }

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  redirect(`/doorcard/${doorcardId}/edit?step=3`);
}

export async function publishDoorcard(doorcardId: string) {
  const user = await requireAuth();
  await prisma.doorcard.update({
    where: { id: doorcardId, userId: user.id },
    data: { isActive: true, isPublic: true },
  });

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  revalidatePath("/dashboard");
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
        message: `You already have a doorcard for ${campusLabel(
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

    // Create smart default display name
    let defaultDisplayName = "";
    if (userProfile?.firstName && userProfile?.lastName) {
      // Use firstName/lastName if available
      if (userProfile.title && userProfile.title !== "none") {
        defaultDisplayName = `${userProfile.title} ${userProfile.firstName} ${userProfile.lastName}`;
      } else {
        defaultDisplayName = `${userProfile.firstName} ${userProfile.lastName}`;
      }
    } else if (userProfile?.name) {
      // Fallback to legacy name field
      defaultDisplayName = userProfile.name;
    } else {
      // Ultimate fallback
      defaultDisplayName = user.email?.split("@")[0] || "Faculty Member";
    }

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
    return handleActionError(err);
  }

  // Revalidate paths to ensure fresh data
  revalidatePath(`/doorcard/${newDoorcardId}/edit`);
  revalidatePath("/dashboard");
  redirect(`/doorcard/${newDoorcardId}/edit?step=1`);
}
