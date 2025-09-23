"use server";

import { revalidatePath } from "next/cache";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function deleteDoorcard(
  doorcardId: string
): Promise<{ success: boolean; message: string }> {
  logger.info(`Delete doorcard request received`, { doorcardId });

  try {
    const auth = await requireAuthUserAPI();
    if ("error" in auth) {
      logger.error("Delete doorcard auth failed", { error: auth.error });
      throw new Error(auth.error);
    }

    logger.info(`Attempting to delete doorcard`, {
      doorcardId,
      userId: auth.user.id,
      userEmail: auth.user.email,
    });

    // Verify doorcard belongs to user before deletion
    const doorcard = await prisma.doorcard.findFirst({
      where: { id: doorcardId, userId: auth.user.id },
    });

    if (!doorcard) {
      logger.warn("Doorcard not found or unauthorized", {
        doorcardId,
        userId: auth.user.id,
      });
      throw new Error(
        "Doorcard not found or you don't have permission to delete it"
      );
    }

    logger.info(`Doorcard found, proceeding with deletion`, {
      doorcardId,
      doorcardName: doorcard.doorcardName,
      term: doorcard.term,
      year: doorcard.year,
    });

    // Delete doorcard (appointments will cascade delete due to foreign key constraints)
    await prisma.doorcard.delete({
      where: { id: doorcardId, userId: auth.user.id },
    });

    logger.info(`Doorcard deleted successfully`, { doorcardId });

    // Revalidate dashboard to show updated list
    revalidatePath("/dashboard");

    return { success: true, message: "Doorcard deleted successfully" };
  } catch (error) {
    logger.error("Error deleting doorcard:", {
      doorcardId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete doorcard",
    };
  }
}
