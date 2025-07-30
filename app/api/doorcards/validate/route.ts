import { NextResponse } from "next/server";
import { requireAuthUserAPI } from "@/lib/require-auth-user";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { COLLEGE_META, type College } from "@/types/doorcard";
import { TermSeason } from "@prisma/client";

const validateSchema = z.object({
  college: z.enum(["SKYLINE", "CSM", "CANADA"]),
  term: z.string().min(1, "Term is required"),
  year: z.string().regex(/^\d{4}$/, "Year must be 4 digits"),
  excludeDoorcardId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAuthUserAPI();
    if ("error" in auth) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status || 401 }
      );
    }
    const { user } = auth;

    const body = await req.json();
    const { college, term, year, excludeDoorcardId } =
      validateSchema.parse(body);

    // (Optional) Verify the excluded doorcard actually belongs to this user
    if (excludeDoorcardId) {
      const owned = await prisma.doorcard.findFirst({
        where: { id: excludeDoorcardId, userId: user.id },
        select: { id: true },
      });
      if (!owned) {
        return NextResponse.json(
          { error: "Invalid doorcard reference" },
          { status: 400 }
        );
      }
    }

    const existing = await prisma.doorcard.findFirst({
      where: {
        userId: user.id,
        college: college as College,
        term: term as TermSeason,
        year: parseInt(year),
        isActive: true,
        ...(excludeDoorcardId && { NOT: { id: excludeDoorcardId } }),
      },
      select: { id: true, doorcardName: true },
    });

    if (existing) {
      const campusName = COLLEGE_META[college as College].label;
      return NextResponse.json({
        isDuplicate: true,
        message: `You already have a doorcard for ${campusName} - ${term} ${year}`,
        existingDoorcardId: existing.id,
        existingDoorcardName: existing.doorcardName,
      });
    }

    return NextResponse.json({
      isDuplicate: false,
      message: "This campus and term combination is available!",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: err.errors },
        { status: 400 }
      );
    }
    console.error("Error validating doorcard:", err);
    return NextResponse.json(
      { error: "Failed to validate doorcard" },
      { status: 500 }
    );
  }
}
