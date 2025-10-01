"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import type { College, TermSeason } from "@prisma/client";
import { generateDoorcardTitle } from "@/lib/doorcard-title-generator";
import crypto from "crypto";

type ActionResult = { success: boolean; message?: string };

const CAMPUS_VALUES = ["SKYLINE", "CSM", "CANADA"] as const;
const TERM_DISPLAY = ["Fall", "Spring", "Summer"] as const;

const campusTermSchema = z.object({
  term: z.enum(TERM_DISPLAY),
  year: z.coerce.number().int().min(2000).max(2100),
  college: z.enum(CAMPUS_VALUES, {
    errorMap: () => ({ message: "Campus is required" }),
  }),
});

function toEnumSeason(display: (typeof TERM_DISPLAY)[number]): TermSeason {
  return display.toUpperCase() as TermSeason;
}

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

export async function handleNewDoorcardForm(formData: FormData): Promise<void> {
  let newDoorcardId: string | null = null;

  // Log for debugging
  console.log("[NEW_DOORCARD] Starting form submission", {
    term: formData.get("term"),
    year: formData.get("year"),
    college: formData.get("college"),
  });

  try {
    const user = await requireAuth();
    console.log("[NEW_DOORCARD] User authenticated", { userId: user.id });

    const data = campusTermSchema.parse({
      term: formData.get("term"),
      year: formData.get("year"),
      college: formData.get("college"),
    });
    console.log("[NEW_DOORCARD] Data validated", data);

    // Multiple doorcards per term are now allowed - no need to check for existing

    // Get user's profile info for smart defaults
    console.log("[NEW_DOORCARD] Fetching user profile");
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
    console.log("[NEW_DOORCARD] User profile fetched", {
      hasProfile: !!userProfile,
    });

    // Create smart default display name with better error handling
    let defaultDisplayName = "";
    try {
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
    } catch (nameError) {
      console.warn(
        "[NEW_DOORCARD] Error generating display name, using fallback",
        nameError
      );
      defaultDisplayName = user.email?.split("@")[0] || "Faculty Member";
    }

    // Ensure we have a non-empty display name
    if (!defaultDisplayName || defaultDisplayName.trim() === "") {
      defaultDisplayName = "Faculty Member";
    }

    // Generate automatic doorcard title using the new convention
    const doorcardTitle = generateDoorcardTitle({
      facultyName: defaultDisplayName,
      term: toEnumSeason(data.term),
      year: data.year,
    });

    console.log("[NEW_DOORCARD] Creating doorcard", {
      name: defaultDisplayName,
      doorcardTitle: doorcardTitle,
      doorcardName: "", // Now used as optional subtitle
      term: toEnumSeason(data.term),
      year: data.year,
      college: data.college,
      userId: user.id,
    });

    const newDoorcard = await prisma.doorcard.create({
      data: {
        id: crypto.randomUUID(),
        name: defaultDisplayName,
        doorcardName: "", // Start with empty subtitle - user can add one later
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
    console.log("[NEW_DOORCARD] Doorcard created successfully", {
      id: newDoorcardId,
    });
  } catch (error: any) {
    console.error("[NEW_DOORCARD] Error creating doorcard:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    });

    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      redirect(`/doorcard/new?error=${encodeURIComponent(errorMessages)}`);
    }

    // Multiple doorcards per term are now allowed - no unique constraint to handle

    redirect(
      `/doorcard/new?error=${encodeURIComponent("An unexpected error occurred")}`
    );
  }

  // Revalidate paths to ensure fresh data
  revalidatePath(`/doorcard/${newDoorcardId}/edit`);
  revalidatePath("/dashboard");
  redirect(`/doorcard/${newDoorcardId}/edit?step=1`);
}

export async function handleEditDoorcardCampusForm(
  doorcardId: string,
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
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
