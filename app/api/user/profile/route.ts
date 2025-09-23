import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  withRateLimit,
  RateLimitTier,
  getClientIdentifier,
  getUserIdentifier,
} from "@/lib/rate-limit";

export async function PATCH(req: NextRequest) {
  // Apply rate limiting with user-specific identifier for authenticated requests
  return withRateLimit(req, RateLimitTier.API, undefined, async () => {
    try {
      const session = await getServerSession(authOptions);
      logger.debug("[Profile API] Session:", session?.user?.email);

      if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Use user-specific rate limiting for authenticated requests
      const ip = getClientIdentifier(req);
      const userIdentifier = getUserIdentifier(session.user.email, ip);

      // Additional rate limit check for sensitive profile updates (optional)
      // Could be implemented here if needed for stricter profile update limits

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
      logger.debug("[Profile API] Update request:", {
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
      // Note: firstName/lastName might not be provided if they're locked (from OneLogin)
      const hasNewNameFields = firstName && lastName;
      const hasLegacyName =
        name && typeof name === "string" && name.trim().length > 0;

      // Only require name fields if this is a profile creation, not an update
      // For updates, firstName/lastName might be locked and not provided
      if (!hasNewNameFields && !hasLegacyName) {
        // Check if user already has name fields in database
        const existingUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { firstName: true, lastName: true, name: true },
        });

        if (
          !existingUser ||
          (!existingUser.firstName &&
            !existingUser.lastName &&
            !existingUser.name)
        ) {
          return NextResponse.json(
            { error: "Either firstName/lastName or name is required" },
            { status: 400 }
          );
        }
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
            { status: 400 }
          );
        }
      }

      // Prepare update data
      const updateData: any = {
        website: website && website.trim() ? website.trim() : null,
      };

      // Update name fields only if provided
      if (hasNewNameFields) {
        updateData.firstName = firstName.trim();
        updateData.lastName = lastName.trim();
        updateData.name = `${firstName.trim()} ${lastName.trim()}`; // Keep legacy name in sync
      } else if (hasLegacyName) {
        updateData.name = name.trim();
      }

      // Always update these fields if provided (they can be updated even if name fields are locked)
      if (title !== undefined) {
        updateData.title =
          title && title.trim() && title !== "none" ? title.trim() : null;
      }
      if (pronouns !== undefined) {
        updateData.pronouns =
          pronouns && pronouns.trim() && pronouns !== "none"
            ? pronouns.trim()
            : null;
      }
      if (displayFormat !== undefined) {
        updateData.displayFormat = displayFormat || "FULL_NAME";
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

      logger.debug("[Profile API] Updated user:", updatedUser);
      return NextResponse.json(updatedUser);
    } catch (error) {
      logger.error("Profile update error:", error);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }
  });
}

export async function GET(req: NextRequest) {
  // Apply rate limiting for profile GET requests
  return withRateLimit(req, RateLimitTier.API, undefined, async () => {
    try {
      logger.debug("[Profile API GET] Starting request...");
      logger.debug(
        "[Profile API GET] Request headers:",
        Object.fromEntries(req.headers.entries())
      );

      const session = await getServerSession(authOptions);
      logger.debug("[Profile API GET] Session:", session ? "EXISTS" : "NULL");
      logger.debug(
        "[Profile API GET] Full session:",
        JSON.stringify(session, null, 2)
      );

      if (!session?.user?.email) {
        logger.debug("[Profile API GET] No session or email, returning 401");
        logger.debug("[Profile API GET] Session user:", session?.user);
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
      logger.error("Profile fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 }
      );
    }
  });
}
