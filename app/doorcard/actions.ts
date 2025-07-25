"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { timeBlockSchema } from "@/lib/validations/doorcard-edit";

/* -------------------------------------------------------------------------- */
/* Schemas / helpers                                                          */
/* -------------------------------------------------------------------------- */

const CAMPUS_VALUES = ["SKYLINE", "CSM", "CANADA"] as const;

const campusTermSchema = z.object({
  term: z.string().min(1, "Term is required"),
  year: z.string().min(1, "Year is required"),
  college: z
    .string()
    .min(1, "Campus is required")
    .refine((val) => CAMPUS_VALUES.includes(val as any), {
      message: "Campus is required",
    }),
});

const personalInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  doorcardName: z.string().min(1, "Doorcard name is required"),
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
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const data = campusTermSchema.parse({
      term: formData.get("term")?.toString() || "",
      year: formData.get("year")?.toString() || "",
      college: formData.get("college")?.toString() || "",
    });

    const existing = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        college: data.college as any,
        term: data.term,
        year: data.year,
        isActive: true,
        NOT: { id: doorcardId },
      },
    });
    if (existing) {
      return {
        success: false,
        message: `You already have a doorcard for ${campusLabel(
          data.college
        )} - ${data.term} ${data.year}. Please edit your existing doorcard "${
          existing.doorcardName
        }" instead.`,
      };
    }

    await prisma.doorcard.update({
      where: { id: doorcardId, userId: user.id },
      data: { term: data.term, year: data.year, college: data.college as any },
    });
  } catch (err) {
    return handleActionError(err);
  }

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  redirect(`/doorcard/${doorcardId}/edit?step=1`);
}

export async function updateBasicInfo(
  doorcardId: string,
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const data = personalInfoSchema.parse({
      name: formData.get("name")?.toString() || "",
      doorcardName: formData.get("doorcardName")?.toString() || "",
      officeNumber: formData.get("officeNumber")?.toString() || "",
    });

    await prisma.doorcard.update({
      where: { id: doorcardId, userId: user.id },
      data: {
        name: data.name,
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
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAuth();

    const json = formData.get("timeBlocks")?.toString();
    if (!json) return { success: false, message: "No time blocks provided" };

    const blocks = z.array(timeBlockSchema).parse(JSON.parse(json));
    if (blocks.length === 0) {
      return { success: false, message: "At least one time block is required" };
    }

    await prisma.appointment.deleteMany({ where: { doorcardId } });
    await prisma.appointment.createMany({
      data: blocks.map((b) => ({
        doorcardId,
        name: b.activity,
        startTime: b.startTime,
        endTime: b.endTime,
        dayOfWeek: b.day,
        category: b.category || "OFFICE_HOURS",
        location: b.location,
      })),
    });
  } catch (err) {
    return handleActionError(err);
  }

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  redirect(`/doorcard/${doorcardId}/edit?step=3`);
}

/**
 * Optional legacy draft creation (kept if needed).
 */
export async function createDoorcardDraft(): Promise<string> {
  const user = await requireAuth();
  const newDraft = await prisma.doorcard.create({
    data: {
      name: "",
      doorcardName: "",
      officeNumber: "",
      term: "",
      year: "",
      college: null,
      isActive: false,
      isPublic: false,
      userId: user.id,
    },
  });
  return `/doorcard/${newDraft.id}/edit?step=0`;
}

export async function publishDoorcard(doorcardId: string) {
  try {
    const user = await requireAuth();
    await prisma.doorcard.update({
      where: { id: doorcardId, userId: user.id },
      data: { isActive: true, isPublic: true },
    });
  } catch (err) {
    // Allow redirect errors to bubble if any occur later
    console.error("Error publishing doorcard:", err);
    throw err;
  }

  revalidatePath(`/doorcard/${doorcardId}/edit`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/**
 * Creates a doorcard only AFTER campus/term validation.
 */
export async function createDoorcardWithCampusTerm(
  _prevState: any,
  formData: FormData
): Promise<ActionResult> {
  try {
    const user = await requireAuth();

    const data = campusTermSchema.parse({
      term: formData.get("term")?.toString() || "",
      year: formData.get("year")?.toString() || "",
      college: formData.get("college")?.toString() || "",
    });

    const existing = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        college: data.college as any,
        term: data.term,
        year: data.year,
        isActive: true,
      },
    });
    if (existing) {
      return {
        success: false,
        message: `You already have a doorcard for ${campusLabel(
          data.college
        )} - ${data.term} ${data.year}. Please edit your existing doorcard "${
          existing.doorcardName
        }" instead.`,
      };
    }

    const newDoorcard = await prisma.doorcard.create({
      data: {
        name: "",
        doorcardName: "",
        officeNumber: "",
        term: data.term,
        year: data.year,
        college: data.college as any,
        isActive: false,
        isPublic: false,
        userId: user.id,
      },
    });

    revalidatePath(`/doorcard/${newDoorcard.id}/edit`);
    redirect(`/doorcard/${newDoorcard.id}/edit?step=1`);
  } catch (err) {
    return handleActionError(err);
  }
}
