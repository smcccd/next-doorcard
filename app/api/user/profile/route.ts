import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[Profile API] Session:", session?.user?.email);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      firstName,
      lastName,
      title,
      pronouns,
      displayFormat,
      college,
      website,
    } = await req.json();
    console.log("[Profile API] Update request:", {
      name,
      firstName,
      lastName,
      title,
      pronouns,
      displayFormat,
      college,
      website,
    });

    // Validate required fields - either use new firstName/lastName or legacy name
    const hasNewNameFields = firstName && lastName;
    const hasLegacyName =
      name && typeof name === "string" && name.trim().length > 0;

    if (!hasNewNameFields && !hasLegacyName) {
      return NextResponse.json(
        { error: "Either firstName/lastName or name is required" },
        { status: 400 },
      );
    }

    // Validate website URL if provided
    if (website && typeof website === "string") {
      try {
        const urlToValidate = website.startsWith("http")
          ? website
          : `https://${website}`;
        new URL(urlToValidate);
      } catch {
        return NextResponse.json(
          { error: "Invalid website URL" },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      website: website && website.trim() ? website.trim() : null,
    };

    // Update name fields
    if (hasNewNameFields) {
      updateData.firstName = firstName.trim();
      updateData.lastName = lastName.trim();
      updateData.name = `${firstName.trim()} ${lastName.trim()}`; // Keep legacy name in sync
      updateData.title =
        title && title.trim() && title !== "none" ? title.trim() : null;
      updateData.pronouns =
        pronouns && pronouns.trim() && pronouns !== "none"
          ? pronouns.trim()
          : null;
      updateData.displayFormat = displayFormat || "FULL_NAME";
    } else if (hasLegacyName) {
      updateData.name = name.trim();
    }

    // Update college if provided
    if (
      college &&
      college !== "none" &&
      ["SKYLINE", "CSM", "CANADA"].includes(college)
    ) {
      updateData.college = college;
    } else if (college === "none") {
      updateData.college = null;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        title: true,
        pronouns: true,
        displayFormat: true,
        email: true,
        college: true,
        website: true,
      },
    });

    console.log("[Profile API] Updated user:", updatedUser);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    console.log("[Profile API GET] Starting request...");
    console.log(
      "[Profile API GET] Request headers:",
      Object.fromEntries(req.headers.entries()),
    );

    const session = await getServerSession(authOptions);
    console.log("[Profile API GET] Session:", session ? "EXISTS" : "NULL");
    console.log(
      "[Profile API GET] Full session:",
      JSON.stringify(session, null, 2),
    );

    if (!session?.user?.email) {
      console.log("[Profile API GET] No session or email, returning 401");
      console.log("[Profile API GET] Session user:", session?.user);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        title: true,
        pronouns: true,
        displayFormat: true,
        email: true,
        username: true,
        website: true,
        college: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
