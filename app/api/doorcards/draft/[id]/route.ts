import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUserAPI } from "@/lib/require-auth-user";

interface Params {
  params: { id: string };
}

// GET single draft
export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const draft = await prisma.doorcardDraft.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  return NextResponse.json(draft);
}

// PUT update draft
export async function PUT(req: Request, { params }: Params) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draft = await prisma.doorcardDraft.update({
    where: { id: params.id, userId: auth.user.id },
    data: { data: body, lastUpdated: new Date() },
  });

  return NextResponse.json(draft);
}

// DELETE draft
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAuthUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await prisma.doorcardDraft.delete({
    where: { id: params.id, userId: auth.user.id },
  });

  return NextResponse.json({ message: "Draft deleted successfully" });
}
