import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";

// GET: list all drafts for current user
export async function GET() {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const drafts = await prisma.doorcardDraft.findMany({
    where: { userId: auth.user.id },
    orderBy: { lastUpdated: "desc" },
  });

  return NextResponse.json(drafts);
}

// POST: create a new draft (optionally with initial data)
export async function POST(req: Request) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Attempt to parse JSON body (may be empty)
  let body: any = {};
  try {
    if (req.headers.get("content-type")?.includes("application/json")) {
      body = await req.json();
    }
  } catch {
    // Ignore invalid JSON; treat as empty body
  }

  const hasBody = Object.keys(body).length > 0;

  // Optional duplicate prevention when term/year provided
  if (hasBody && body.term && body.year) {
    const existing = await prisma.doorcardDraft.findFirst({
      where: {
        userId: auth.user.id,
        AND: [
          { data: { path: ["term"], equals: body.term } },
          { data: { path: ["year"], equals: body.year } },
        ],
      },
    });
    if (existing) {
      return NextResponse.json(
        {
          error:
            "You already have a draft for this term/year. Complete or delete it first.",
          existingDraftId: existing.id,
        },
        { status: 409 }
      );
    }
  }

  const draft = await prisma.doorcardDraft.create({
    data: {
      userId: auth.user.id,
      originalDoorcardId: body.originalDoorcardId ?? null,
      data: body,
    },
  });

  // If this was a “blank” creation (no body), return redirect URL for editor
  if (!hasBody) {
    return NextResponse.json(
      { redirectUrl: `/doorcard?draftId=${draft.id}` },
      { status: 201 }
    );
  }

  // Otherwise return the full draft object
  return NextResponse.json(draft, { status: 201 });
}
