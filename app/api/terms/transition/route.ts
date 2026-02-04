import { requireAdminUserAPI } from "@/lib/require-auth-user";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await requireAdminUserAPI();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  // ...rest of your logic...
}
