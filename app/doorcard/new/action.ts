"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import type { College, TermSeason } from "@prisma/client";
import crypto from "crypto";

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

export async function handleNewDoorcardForm(formData: FormData) {
  try {
    // Validate user is authenticated
    const authResult = await requireAuthUserAPI();

    if ("error" in authResult) {
      redirect("/login");
    }

    const user = authResult.user;

    // Parse form data
    const rawData = {
      college: formData.get("college") as string,
      term: formData.get("term") as string,
      year: formData.get("year") as string,
    };

    try {
      // Validate the data
      const validatedData = campusTermSchema.parse(rawData);

      // Remove the pre-check - let the database constraint handle duplicates
      // This eliminates the race condition between check and create

      // Create the doorcard
      const doorcard = await prisma.doorcard.create({
        data: {
          id: crypto.randomUUID(),
          name: user.name || user.email || "Faculty Member",
          doorcardName: user.name || user.email || "Faculty Member",
          officeNumber: "",
          term: toEnumSeason(validatedData.term),
          year: validatedData.year,
          college: validatedData.college as College,
          isActive: true,
          isPublic: false,
          userId: user.id,
          updatedAt: new Date(),
        },
      });

      // Revalidate and redirect
      revalidatePath("/doorcard");
      redirect(`/doorcard/${doorcard.id}/edit`);
    } catch (error: any) {
      console.error("Error creating doorcard:", error);

      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map((err) => err.message).join(", ");
        redirect(`/doorcard/new?error=${encodeURIComponent(errorMessages)}`);
      }

      // Handle unique constraint violation
      if (error.code === "P2002") {
        const errorMessage =
          "You already have a doorcard for this term and campus.";
        redirect(`/doorcard/new?error=${encodeURIComponent(errorMessage)}`);
      }

      redirect(
        `/doorcard/new?error=${encodeURIComponent("An unexpected error occurred")}`
      );
    }
  } catch (err) {
    console.error("Error in handleNewDoorcardForm:", err);
    redirect(
      `/doorcard/new?error=${encodeURIComponent("An unexpected error occurred")}`
    );
  }
}

export async function handleEditDoorcardCampusForm(
  doorcardId: string,
  formData: FormData
) {
  try {
    // Validate user is authenticated
    const authResult = await requireAuthUserAPI();

    if ("error" in authResult) {
      redirect("/login");
    }

    const user = authResult.user;

    // Parse form data
    const rawData = {
      college: formData.get("college") as string,
      term: formData.get("term") as string,
      year: formData.get("year") as string,
    };

    // Validate the data
    const validatedData = campusTermSchema.parse(rawData);

    // Update the doorcard
    await prisma.doorcard.update({
      where: {
        id: doorcardId,
        userId: user.id, // Ensure user owns this doorcard
      },
      data: {
        term: toEnumSeason(validatedData.term),
        year: validatedData.year,
        college: validatedData.college as College,
        updatedAt: new Date(),
      },
    });

    // Revalidate and redirect
    revalidatePath(`/doorcard/${doorcardId}`);
    redirect(`/doorcard/${doorcardId}/edit`);
  } catch (error) {
    console.error("Error updating doorcard:", error);

    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => err.message).join(", ");
      redirect(
        `/doorcard/${doorcardId}/edit?error=${encodeURIComponent(errorMessages)}`
      );
    }

    redirect(
      `/doorcard/${doorcardId}/edit?error=${encodeURIComponent("An unexpected error occurred")}`
    );
  }
}
